import { AppDataSource } from '../config/config.db.js';
import CanchaSchema from '../entity/Cancha.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';

import { In } from 'typeorm';


const HORARIO_FUNCIONAMIENTO = { inicio: '09:00', fin: '16:00', duracionBloque: 90 };

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

function toISODateSafe(input) {
  if (typeof input === 'string' && DATE_YYYY_MM_DD.test(input)) return input;

  const d = new Date(input);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysLocal(yyyyMmDd, days) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toISODateSafe(date);
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number); // si viene HH:mm:ss, los dos primeros igual sirven
  return h * 60 + m;
}
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}
function generarBloquesHorarios() {
  const bloques = [];
  const ini = timeToMinutes(HORARIO_FUNCIONAMIENTO.inicio);
  const fin = timeToMinutes(HORARIO_FUNCIONAMIENTO.fin);
  for (let t = ini; t + HORARIO_FUNCIONAMIENTO.duracionBloque <= fin; t += HORARIO_FUNCIONAMIENTO.duracionBloque) {
    bloques.push({
      horaInicio: minutesToTime(t),
      horaFin: minutesToTime(t + HORARIO_FUNCIONAMIENTO.duracionBloque),
      disponible: true
    });
  }
  return bloques;
}
function hayConflictoHorario(b1, b2) {
  const i1 = timeToMinutes(b1.horaInicio);
  const f1 = timeToMinutes(b1.horaFin);
  const i2 = timeToMinutes(b2.horaInicio);
  const f2 = timeToMinutes(b2.horaFin);
  return !(f1 <= i2 || f2 <= i1);
}

// ---------- Services
export async function obtenerDisponibilidadPorFecha(fechaISO) {
  try {
    const fecha = toISODateSafe(fechaISO); // YYYY-MM-DD (local, sin TZ)

    const canchaRepository          = AppDataSource.getRepository(CanchaSchema);
    const reservaRepository         = AppDataSource.getRepository(ReservaCanchaSchema);
    const sesionRepository          = AppDataSource.getRepository(SesionEntrenamientoSchema);

    const canchas = await canchaRepository.find({ where: { estado: 'disponible' } });
    if (!canchas.length) return [[], 'No hay canchas disponibles'];

    const disponibilidadPorCancha = [];

    for (const cancha of canchas) {
      const bloquesHorarios = generarBloquesHorarios();

     
      // Reservas activas (pendiente/aprobada)
      const reservasExistentes = await reservaRepository.find({
        where: { canchaId: cancha.id, fechaSolicitud: fecha, estado: In(['pendiente', 'aprobada']) }
      });

      // Sesiones de entrenamiento
      const sesiones = await sesionRepository.find({
        where: { canchaId: cancha.id, fecha }
      });

      // Marcar conflictos: bloqueos
      for (const b of horariosBloqueados) {
        for (const blk of bloquesHorarios) {
          if (hayConflictoHorario(blk, b)) {
            blk.disponible = false;
            blk.motivo = `${b.tipoBloqueo}: ${b.motivo}`;
          }
        }
      }

      // Marcar conflictos: reservas
      for (const r of reservasExistentes) {
        for (const blk of bloquesHorarios) {
          if (hayConflictoHorario(blk, r)) {
            blk.disponible = false;
            blk.motivo = 'Ya reservado';
          }
        }
      }

      // Marcar conflictos: sesiones
      for (const s of sesiones) {
        for (const blk of bloquesHorarios) {
          if (hayConflictoHorario(blk, s)) {
            blk.disponible = false;
            blk.motivo = 'Sesión de entrenamiento';
          }
        }
      }

      disponibilidadPorCancha.push({
        cancha: {
          id: cancha.id,
          nombre: cancha.nombre,
          descripcion: cancha.descripcion,
          capacidadMaxima: cancha.capacidadMaxima
        },
        fecha,
        bloques: bloquesHorarios
      });
    }

    return [disponibilidadPorCancha, null];
  } catch (err) {
    console.error('Error obteniendo disponibilidad:', err);
    return [null, 'Error interno del servidor'];
  }
}


export async function obtenerDisponibilidadPorRango(fechaInicioISO, fechaFinISO) {
  try {
    const inicio = toISODateSafe(fechaInicioISO);
    const fin    = toISODateSafe(fechaFinISO);

    const disponibilidadCompleta = [];
    // Itera de inicio a fin usando sólo strings YYYY-MM-DD (sin TZ)
    for (let f = inicio; f <= fin; f = addDaysLocal(f, 1)) {
      const [dispDia, err] = await obtenerDisponibilidadPorFecha(f);
      if (!err && dispDia.length) {
        disponibilidadCompleta.push({ fecha: f, canchas: dispDia });
      }
      // protección ante loops infinitos si algo raro pasa
      if (f === fin) break;
    }

    return [disponibilidadCompleta, null];
  } catch (err) {
    console.error('Error obteniendo disponibilidad por rango:', err);
    return [null, 'Error interno del servidor'];
  }
}

export async function verificarDisponibilidadEspecifica(canchaId, fechaISO, horaInicio, horaFin) {
  try {
    
    const fecha = toISODateSafe(fechaISO); // 'YYYY-MM-DD' sin TZ

    const canchaRepository  = AppDataSource.getRepository(CanchaSchema);
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);
    const sesionRepository  = AppDataSource.getRepository(SesionEntrenamientoSchema);

    // 1) Cancha debe existir y estar disponible
    const cancha = await canchaRepository.findOne({ where: { id: canchaId, estado: 'disponible' } });
    if (!cancha) return [false, 'Cancha inexistente o no disponible'];

    // 2) Choques con sesiones de entrenamiento (bloquean igual que una reserva)
    const sesiones = await sesionRepository.find({ where: { canchaId, fecha } });
    for (const s of sesiones) {
      if (hayConflictoHorario({ horaInicio, horaFin }, s)) {
        return [false, 'Ya existe una sesión de entrenamiento en ese horario'];
      }
    }

    // 3) Choques con reservas activas (pendiente/aprobada)
    const reservas = await reservaRepository.find({
      where: { canchaId, fechaSolicitud: fecha, estado: In(['pendiente', 'aprobada']) }
    });
    for (const r of reservas) {
      if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
        return [false, 'Ya existe una reserva en ese horario'];
      }
    }

    return [true, null];
  } catch (err) {
    console.error('Error verificando disponibilidad específica:', err);
    return [false, 'Error interno del servidor'];
  }
}
