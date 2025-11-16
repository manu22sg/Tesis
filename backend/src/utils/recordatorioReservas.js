import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import { AppDataSource } from '../config/config.db.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import HistorialReservaSchema from '../entity/HistorialReserva.js';
import { enviarEmailsEnLotes, formatearHorario } from '../utils/emailHelpers.js';

dayjs.locale('es');

export async function enviarRecordatoriosReservas() {
  const manager = AppDataSource.manager;
  const manana = dayjs().add(1, 'day').format('YYYY-MM-DD');

  try {
    // Query optimizada: traer todo de una vez
    const reservas = await manager
      .createQueryBuilder(ReservaCanchaSchema, 'reserva')
      .leftJoinAndSelect('reserva.usuario', 'usuario')
      .leftJoinAndSelect('reserva.cancha', 'cancha')
      .leftJoinAndSelect('reserva.participantes', 'participante')
      .leftJoinAndSelect('participante.usuario', 'participanteUsuario')
      .where('reserva.estado IN (:...estados)', { estados: ['aprobada'] })
      .andWhere('reserva.fechaReserva = :fecha', { fecha: manana })
      .andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('1')
          .from(HistorialReservaSchema, 'h')
          .where('h.reservaId = reserva.id')
          .andWhere('h.accion = :accion', { accion: 'recordatorio_24h' })
          .getQuery();
        return `NOT EXISTS ${subQuery}`;
      })
      .getMany();

    if (!reservas.length) {
      console.log('✓ No hay reservas para enviar recordatorios');
      return;
    }

    console.log(` Procesando ${reservas.length} reserva(s)...`);
    let totalEnviados = 0;

    for (const r of reservas) {
      // Recolectar destinatarios únicos
      const destinatarios = new Set();

      if (r?.usuario?.email && r.usuario.estado === 'activo') {
        destinatarios.add(r.usuario.email);
      }

      r.participantes?.forEach(p => {
        const u = p.usuario;
        if (u?.email && u.estado === 'activo') {
          destinatarios.add(u.email);
        }
      });

      if (!destinatarios.size) continue;

      // Preparar mensaje
      const fechaFmt = dayjs(r.fechaReserva).format('DD/MM/YYYY');
      const horario = formatearHorario(r.horaInicio, r.horaFin);
      const asunto = `Recordatorio: reserva mañana ${horario} (${r.cancha?.nombre || 'Cancha'})`;
      const texto = `
Hola,

Te recordamos que mañana tienes una reserva:
 Fecha: ${fechaFmt}
 Hora: ${horario}
 Cancha: ${r.cancha?.nombre || 'Sin asignar'}

¡Nos vemos allí!

— SPORTUBB
`.trim();

      // Enviar en lotes
      const resultado = await enviarEmailsEnLotes(
        Array.from(destinatarios),
        asunto,
        texto
      );

      totalEnviados += resultado.exitosos;

      // Registrar en historial solo si hubo éxito
      if (resultado.exitosos > 0) {
        await manager.save(HistorialReservaSchema, {
          reservaId: r.id,
          accion: 'recordatorio_24h',
          observacion: `Enviado a ${resultado.exitosos} destinatario(s)`,
          usuarioId: null,
        });
      }
    }

    console.log(`Recordatorios de reservas: ${totalEnviados} emails enviados`);

  } catch (error) {
    console.error(' Error en enviarRecordatoriosReservas():', error);
  }
}