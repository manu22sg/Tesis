import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import { In } from 'typeorm';
import { AppDataSource } from '../config/config.db.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import HistorialReservaSchema from '../entity/HistorialReserva.js';
import ParticipanteReservaSchema from '../entity/ParticipanteReserva.js';
import { sendMail } from '../utils/mailer.js';

dayjs.locale('es');

/**
 * Recordatorio por correo 24h antes de la reserva:
 * - Envía al creador de la reserva y a los participantes registrados (con usuario/email)
 * - Evita duplicados registrando una sola vez por reserva en HistorialReserva (accion = 'recordatorio_24h')
 */
export async function enviarRecordatoriosReservas() {

  const manager = AppDataSource.manager;
  const manana = dayjs().add(1, 'day').format('YYYY-MM-DD');

  try {
    // 1) Reservas aprobadas de mañana (con usuario y cancha)
    const reservas = await manager.find(ReservaCanchaSchema, {
      where: { estado: In(['aprobada']), fechaReserva: manana },
      relations: ['usuario', 'cancha'],
    });

    if (!reservas.length) {
      console.log(' No hay reservas aprobadas para mañana.');
      return;
    }

    for (const r of reservas) {
      // 2) ¿Ya se envió el recordatorio para esta reserva?
      const yaEnviado = await manager.count(HistorialReservaSchema, {
        where: { reservaId: r.id, accion: 'recordatorio_24h' },
      });
      if (yaEnviado) continue;

      const destinatarios = new Set();

      if (r?.usuario?.email && r.usuario.estado === 'activo') {
        destinatarios.add(r.usuario.email);
      }

      const participantes = await manager.find(ParticipanteReservaSchema, {
        where: { reservaId: r.id },
        relations: ['usuario'],
      });

      for (const p of participantes) {
        const u = p.usuario;
        if (u?.email && u.estado === 'activo') {
          destinatarios.add(u.email);
        }
       
      }

      if (!destinatarios.size) {
        continue;
      }
      const fechaFmt = dayjs(r.fechaReserva).format('DD/MM/YYYY');

const horaInicioFormateada = dayjs(r.horaInicio, ['HH:mm', 'HH:mm:ss']).isValid()
  ? dayjs(r.horaInicio, ['HH:mm', 'HH:mm:ss']).format('HH:mm')
  : String(r.horaInicio || '').slice(0, 5);

const horaFinFormateada = r.horaFin
  ? (dayjs(r.horaFin, ['HH:mm', 'HH:mm:ss']).isValid()
      ? dayjs(r.horaFin, ['HH:mm', 'HH:mm:ss']).format('HH:mm')
      : String(r.horaFin).slice(0, 5))
  : null;

const horario = horaFinFormateada ? `${horaInicioFormateada} - ${horaFinFormateada}` : horaInicioFormateada;

const asunto = `Recordatorio: reserva mañana ${horario} (${r.cancha?.nombre || 'Cancha'})`;
const texto = `
Hola,

Te recordamos que mañana tienes una reserva:
📅 Fecha: ${fechaFmt}
🕓 Hora: ${horario}
📍 Cancha: ${r.cancha?.nombre || 'Sin asignar'}

¡Gracias!

— Sistema de Reservas
`.trim();

      // 5) Enviar a todos los destinatarios
      let enviados = 0;
      for (const correo of destinatarios) {
        try {
          await sendMail({ to: correo, subject: asunto, text: texto });
          enviados++;
        } catch (err) {
          console.error(`Error enviando a ${correo} (reserva ${r.id}):`, err?.message || err);
        }
      }

      // 6) Registrar en historial (marca la reserva para no re-enviar en corridas futuras)
      if (enviados > 0) {
        await manager.getRepository(HistorialReservaSchema).save({
          reservaId: r.id,
          accion: 'recordatorio_24h',
          observacion: `Recordatorio 24h enviado a ${enviados} destinatario(s)`,
          usuarioId: null, // acción del sistema
        });
      }
    }

    console.log(' Job enviarRecordatoriosReservas() completado.');
  } catch (error) {
    console.error('Error en enviarRecordatoriosReservas():', error);
  }
}
