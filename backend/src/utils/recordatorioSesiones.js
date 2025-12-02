import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import { AppDataSource } from '../config/config.db.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';
import { enviarEmailsEnLotes, formatearHorario } from '../utils/emailHelpers.js';

dayjs.locale('es');

export async function enviarRecordatoriosSesiones() {
  const manager = AppDataSource.manager;
  const manana = dayjs().add(1, 'day').format('YYYY-MM-DD');

  try {
    // Query optimizada con JOIN
    const sesiones = await manager
      .createQueryBuilder(SesionEntrenamientoSchema, 'sesion')
      .leftJoinAndSelect('sesion.grupo', 'grupo')
      .leftJoinAndSelect('sesion.cancha', 'cancha')
      .leftJoinAndSelect('grupo.jugadores', 'jugadorGrupo')
      .leftJoinAndSelect('jugadorGrupo.jugador', 'jugador')
      .leftJoinAndSelect('jugador.usuario', 'usuario')
      .where('sesion.fecha = :fecha', { fecha: manana })
      .andWhere('sesion.recordatorio24hEnviado = :enviado', { enviado: false })
      .getMany();

    if (!sesiones.length) {
     // console.log('✓ No hay sesiones para enviar recordatorios');
      return;
    }

    console.log(` Procesando ${sesiones.length} sesión(es)...`);
    let totalEnviados = 0;

    for (const sesion of sesiones) {
      const grupo = sesion?.grupo;
      if (!grupo) continue;

      // Recolectar destinatarios
      const destinatarios = sesion.grupo.jugadores
        ?.map(jg => jg?.jugador?.usuario)
        .filter(u => u && u.estado === 'activo' && u.email)
        .map(u => u.email) || [];

      if (!destinatarios.length) continue;

      // Preparar mensaje
      const lugar = sesion?.ubicacionExterna?.trim() 
        || sesion?.cancha?.nombre?.trim() 
        || 'Por confirmar';
      
      const fechaFmt = dayjs(sesion.fecha).format('DD/MM/YYYY');
      const horario = formatearHorario(sesion.horaInicio, sesion.horaFin);
      const horaIni = horario.split(' - ')[0];

      const asunto = `Recordatorio: sesión ${fechaFmt} ${horaIni} — ${grupo.nombre}`;
      const texto = `
Hola 

Le recordamos que mañana tiene una sesión del grupo "${grupo.nombre}".

  Fecha: ${fechaFmt}
  Hora: ${horario}
  Lugar: ${lugar}

Por favor llega con 10 minutos de anticipación.

 SPORTUBB
`.trim();

      // Enviar en lotes
      const resultado = await enviarEmailsEnLotes(destinatarios, asunto, texto);
      totalEnviados += resultado.exitosos;

      // Marcar como enviado
      if (resultado.exitosos > 0) {
        await manager.update(SesionEntrenamientoSchema, sesion.id, {
          recordatorio24hEnviado: true,
        });
      }
    }

    console.log(` Recordatorios de sesiones: ${totalEnviados} emails enviados`);

  } catch (error) {
    console.error('Error en enviarRecordatoriosSesiones():', error);
  }
}