import { AppDataSource } from '../config/config.db.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';
import JugadorGrupoSchema from '../entity/JugadorGrupo.js';
import { sendMail } from '../utils/mailer.js';
import dayjs from 'dayjs';
import 'dayjs/locale/es.js';

dayjs.locale('es');

// Prioridad: ubicacionExterna > cancha.nombre > 'Por confirmar'
function getLugarTexto(sesion) {
  const ext = (sesion?.ubicacionExterna || '').trim();
  if (ext) return ext;

  const canchaNombre = sesion?.cancha?.nombre;
  if (typeof canchaNombre === 'string' && canchaNombre.trim()) {
    return canchaNombre.trim();
  }
  return 'Por confirmar';
}

export async function enviarRecordatoriosSesiones() {

  const manager = AppDataSource.manager;
  const manana = dayjs().add(1, 'day').format('YYYY-MM-DD');

  try {
    const sesiones = await manager.find(SesionEntrenamientoSchema, {
      where: {
        fecha: manana,
        recordatorio24hEnviado: false, 
      },
      relations: ['grupo', 'cancha'],
    });

    if (!sesiones.length) {
      return;
    }

    for (const sesion of sesiones) {
      const grupo = sesion?.grupo;
      if (!grupo) {
        continue;
      }

      // Lugar y horario formateados
      const lugar = getLugarTexto(sesion);
      const fechaFmt = dayjs(sesion.fecha).format('DD/MM/YYYY');

      const horaIni = dayjs(sesion.horaInicio, ['HH:mm', 'HH:mm:ss']).isValid()
        ? dayjs(sesion.horaInicio, ['HH:mm', 'HH:mm:ss']).format('HH:mm')
        : String(sesion.horaInicio || '').slice(0, 5);

      const horaFin = sesion.horaFin
        ? (dayjs(sesion.horaFin, ['HH:mm', 'HH:mm:ss']).isValid()
            ? dayjs(sesion.horaFin, ['HH:mm', 'HH:mm:ss']).format('HH:mm')
            : String(sesion.horaFin).slice(0, 5))
        : null;

      const horario = horaFin ? `${horaIni} - ${horaFin}` : horaIni;

      // Usuarios del grupo (jugador.usuario)
      const jugadoresGrupo = await manager.find(JugadorGrupoSchema, {
        where: { grupoId: grupo.id },
        relations: ['jugador', 'jugador.usuario'],
      });

      const destinatarios = jugadoresGrupo
        .map((jg) => jg?.jugador?.usuario)
        .filter((u) => u && u.estado === 'activo' && u.email);

      if (!destinatarios.length) {
        continue;
      }

      const asunto = `Recordatorio: sesión ${fechaFmt} ${horaIni} — ${grupo.nombre}`;
      const textoPlano = `
Hola 👋

Te recordamos que mañana tienes una sesión del grupo "${grupo.nombre}".

📅 Fecha: ${fechaFmt}
🕓 Hora: ${horario}
📍 Lugar: ${lugar}

Por favor llega con 10 minutos de anticipación.

– SPORTUBB
`.trim();

      let enviados = 0;

      for (const u of destinatarios) {
        try {
          await sendMail({ to: u.email, subject: asunto, text: textoPlano });
          enviados++;
        } catch (err) {
          console.error(` Error enviando a ${u.email} (sesión ${sesion.id}):`, err?.message || err);
        }
      }

      // Solo marcamos como enviado si hubo al menos un correo exitoso
      if (enviados > 0) {
        await manager.update(SesionEntrenamientoSchema, sesion.id, {
          recordatorio24hEnviado: true,
        });
      }
    }

  } catch (error) {
    console.error(' Error en enviarRecordatoriosSesiones():', error);
  }
}
