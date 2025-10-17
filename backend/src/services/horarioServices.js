import { AppDataSource } from '../config/config.db.js';
import CanchaSchema from '../entity/Cancha.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';
import PartidoCampeonatoSchema from '../entity/PartidoCampeonato.js'; 

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
  const [h, m] = time.split(':').map(Number);
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

export async function obtenerDisponibilidadPorFecha(fechaISO, page = 1, limit = 10) {
  try {
    const fecha = toISODateSafe(fechaISO);

    const canchaRepo  = AppDataSource.getRepository(CanchaSchema);
    const reservaRepo = AppDataSource.getRepository(ReservaCanchaSchema);
    const sesionRepo  = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const partidoRepo = AppDataSource.getRepository(PartidoCampeonatoSchema); // ✅ AGREGAR

    // Contar total de canchas disponibles
    const totalCanchas = await canchaRepo.count({ where: { estado: 'disponible' } });
    
    if (!totalCanchas) return [{ data: [], total: 0, page, limit, totalPages: 0 }, null];

    // Obtener canchas con paginación
    const skip = (page - 1) * limit;
    const canchas = await canchaRepo.find({ 
      where: { estado: 'disponible' },
      skip,
      take: limit,
      order: { nombre: 'ASC' }
    });

    const disponibilidadPorCancha = [];

    for (const cancha of canchas) {
      const bloquesHorarios = generarBloquesHorarios();

      // 1️⃣ Reservas activas (pendiente/aprobada)
      const reservas = await reservaRepo.find({
        where: { canchaId: cancha.id, fechaSolicitud: fecha, estado: In(['pendiente', 'aprobada']) }
      });

      // 2️⃣ Sesiones de entrenamiento
      const sesiones = await sesionRepo.find({
        where: { canchaId: cancha.id, fecha }
      });

      // 3️⃣ Partidos de campeonato (programado/en_juego) ✅ NUEVO
      const partidos = await partidoRepo.find({
        where: { canchaId: cancha.id, fecha, estado: In(['programado', 'en_juego']) }
      });

      // Marcar conflictos: reservas
      for (const r of reservas) {
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

      // Marcar conflictos: partidos ✅ NUEVO
      for (const p of partidos) {
        for (const blk of bloquesHorarios) {
          if (hayConflictoHorario(blk, p)) {
            blk.disponible = false;
            blk.motivo = 'Partido de campeonato';
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

    const totalPages = Math.ceil(totalCanchas / limit);

    return [{
      data: disponibilidadPorCancha,
      total: totalCanchas,
      page,
      limit,
      totalPages
    }, null];
  } catch (err) {
    console.error('Error obteniendo disponibilidad:', err);
    return [null, 'Error interno del servidor'];
  }
}

export async function obtenerDisponibilidadPorRango(fechaInicioISO, fechaFinISO, page = 1, limit = 10) {
  try {
    const inicio = toISODateSafe(fechaInicioISO);
    const fin    = toISODateSafe(fechaFinISO);

    // Calcular total de días en el rango
    let totalDias = 0;
    for (let f = inicio; f <= fin; f = addDaysLocal(f, 1)) {
      totalDias++;
      if (f === fin) break;
    }

    const skip = (page - 1) * limit;
    const disponibilidadCompleta = [];
    let currentIndex = 0;

    // Itera de inicio a fin usando sólo strings YYYY-MM-DD (sin TZ)
    for (let f = inicio; f <= fin; f = addDaysLocal(f, 1)) {
      // Aplicar paginación por días
      if (currentIndex >= skip && currentIndex < skip + limit) {
        const [dispDia, err] = await obtenerDisponibilidadPorFecha(f);
        if (!err && dispDia.data && dispDia.data.length) {
          disponibilidadCompleta.push({ fecha: f, canchas: dispDia.data });
        }
      }
      currentIndex++;
      if (f === fin) break;
    }

    const totalPages = Math.ceil(totalDias / limit);

    return [{
      data: disponibilidadCompleta,
      total: totalDias,
      page,
      limit,
      totalPages
    }, null];
  } catch (err) {
    console.error('Error obteniendo disponibilidad por rango:', err);
    return [null, 'Error interno del servidor'];
  }
}

// ACTUALIZADO: Ahora verifica partidos de campeonato también
export async function verificarDisponibilidadEspecifica(canchaId, fechaISO, horaInicio, horaFin) {
  try {
    const fecha = toISODateSafe(fechaISO);

    const canchaRepository  = AppDataSource.getRepository(CanchaSchema);
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);
    const sesionRepository  = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const partidoRepository = AppDataSource.getRepository(PartidoCampeonatoSchema); // ✅ AGREGAR

    // 1️⃣ Cancha debe existir y estar disponible
    const cancha = await canchaRepository.findOne({ where: { id: canchaId, estado: 'disponible' } });
    if (!cancha) return [false, 'Cancha inexistente o no disponible'];

    // 2️⃣ Choques con sesiones de entrenamiento
    const sesiones = await sesionRepository.find({ where: { canchaId, fecha } });
    for (const s of sesiones) {
      if (hayConflictoHorario({ horaInicio, horaFin }, s)) {
        return [false, `Conflicto con sesión de entrenamiento (ID: ${s.id})`];
      }
    }

    // 3️⃣ Choques con reservas activas
    const reservas = await reservaRepository.find({
      where: { canchaId, fechaSolicitud: fecha, estado: In(['pendiente', 'aprobada']) }
    });
    for (const r of reservas) {
      if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
        return [false, `Ya existe una reserva (${r.estado}) en ese horario`];
      }
    }

    // 4️⃣ Choques con partidos de campeonato ✅ NUEVO
    const partidos = await partidoRepository.find({
      where: { canchaId, fecha, estado: In(['programado', 'en_juego']) }
    });
    for (const p of partidos) {
      if (hayConflictoHorario({ horaInicio, horaFin }, p)) {
        return [false, `Ya existe un partido de campeonato en ese horario (ID: ${p.id})`];
      }
    }

    return [true, null];
  } catch (err) {
    console.error('Error verificando disponibilidad específica:', err);
    return [false, 'Error interno del servidor'];
  }
}