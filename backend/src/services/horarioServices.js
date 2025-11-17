import { AppDataSource } from '../config/config.db.js';
import CanchaSchema from '../entity/Cancha.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';
import PartidoCampeonatoSchema from '../entity/PartidoCampeonato.js'; 

import { In,LessThanOrEqual,Between,MoreThan } from 'typeorm';

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

export async function obtenerDisponibilidadPorFecha(fechaISO, page = 1, limit = 10, filtros = {}) {
  try {
    const fecha = toISODateSafe(fechaISO);
    const { canchaId, capacidad } = filtros;

    const canchaRepo  = AppDataSource.getRepository(CanchaSchema);
    const reservaRepo = AppDataSource.getRepository(ReservaCanchaSchema);
    const sesionRepo  = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const partidoRepo = AppDataSource.getRepository(PartidoCampeonatoSchema);

    // Filtros de canchas
    const whereCanchas = { estado: 'disponible' };
    if (capacidad === 'pequena') whereCanchas.capacidadMaxima = LessThanOrEqual(8);
    else if (capacidad === 'mediana') whereCanchas.capacidadMaxima = Between(9, 15);
    else if (capacidad === 'grande') whereCanchas.capacidadMaxima = MoreThan(15);

    // Paginación / cancha específica
    let totalCanchas = 0;
    let canchas = [];
    if (canchaId) {
      const cancha = await canchaRepo.findOne({ where: { id: canchaId, ...whereCanchas } });
      totalCanchas = cancha ? 1 : 0;
      canchas = cancha ? [cancha] : [];
    } else {
      totalCanchas = await canchaRepo.count({ where: whereCanchas });
      if (!totalCanchas) return [{ data: [], total: 0, page, limit, totalPages: 0 }, null];

      const skip = (page - 1) * limit;
      canchas = await canchaRepo.find({ where: whereCanchas, skip, take: limit, order: { nombre: 'ASC' } });
    }

    // ⚡ Batch: trae TODO para estas canchas en 3 queries
    const canchaIds = canchas.map(c => c.id);
    let reservas = [], sesiones = [], partidos = [];
    if (canchaIds.length) {
      [reservas, sesiones, partidos] = await Promise.all([
        reservaRepo.find({
          where: { canchaId: In(canchaIds), fechaReserva: fecha, estado: In(['pendiente','aprobada']) },
          select: ['canchaId','horaInicio','horaFin'] // solo lo que usas
        }),
        sesionRepo.find({
          where: { canchaId: In(canchaIds), fecha },
          select: ['canchaId','horaInicio','horaFin']
        }),
        partidoRepo.find({
          where: { canchaId: In(canchaIds), fecha, estado: In(['programado','en_juego']) },
          select: ['canchaId','horaInicio','horaFin']
        })
      ]);
    }

    // Agrupa por canchaId
    const groupBy = (arr) => {
      const m = new Map();
      for (const it of arr) {
        if (!m.has(it.canchaId)) m.set(it.canchaId, []);
        m.get(it.canchaId).push(it);
      }
      return m;
    };
    const reservasBy = groupBy(reservas);
    const sesionesBy = groupBy(sesiones);
    const partidosBy = groupBy(partidos);

    // Plantilla de bloques (una vez) y clon por cancha
    const plantilla = generarBloquesHorarios();
    const clonarBloques = () => plantilla.map(b => ({ ...b }));

    const disponibilidadPorCancha = [];
    for (const cancha of canchas) {
      const bloques = clonarBloques();

      // Marca reservas
      for (const r of (reservasBy.get(cancha.id) || [])) {
        for (const blk of bloques) {
          if (hayConflictoHorario(blk, r)) { 
            blk.disponible = false; 
            if (!blk.motivo) blk.motivo = 'Ya reservado'; 
          }
        }
      }
      // Marca sesiones
      for (const s of (sesionesBy.get(cancha.id) || [])) {
        for (const blk of bloques) {
          if (hayConflictoHorario(blk, s)) { 
            blk.disponible = false; 
            if (!blk.motivo) blk.motivo = 'Sesión de entrenamiento'; 
          }
        }
      }
      // Marca partidos
      for (const p of (partidosBy.get(cancha.id) || [])) {
        for (const blk of bloques) {
          if (hayConflictoHorario(blk, p)) { 
            blk.disponible = false; 
            if (!blk.motivo) blk.motivo = 'Partido de campeonato'; 
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
        bloques
      });
    }

    const totalPages = canchaId ? 1 : Math.ceil(totalCanchas / limit);
    return [{
      data: disponibilidadPorCancha,
      total: totalCanchas,
      page: canchaId ? 1 : page,
      limit: canchaId ? disponibilidadPorCancha.length : limit,
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
export async function verificarDisponibilidadEspecifica(
  canchaId, 
  fechaISO, 
  horaInicio, 
  horaFin, 
  sesionIdExcluir = null // Parámetro opcional
) {
  try {
    const fecha = toISODateSafe(fechaISO);

    const canchaRepository  = AppDataSource.getRepository(CanchaSchema);
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);
    const sesionRepository  = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const partidoRepository = AppDataSource.getRepository(PartidoCampeonatoSchema); 

    const cancha = await canchaRepository.findOne({ 
      where: { id: canchaId, estado: 'disponible' } 
    });
    
    if (!cancha) {
      return [false, 'Cancha inexistente o no disponible'];
    }

    // 🔥 Obtener sesiones, excluyendo la que se está editando
    const sesiones = await sesionRepository.find({ 
      where: { canchaId, fecha } 
    });
    
    for (const s of sesiones) {
      // ✅ Si estamos editando, ignorar la sesión actual
      if (sesionIdExcluir && s.id === sesionIdExcluir) {
        continue;
      }
      
      if (hayConflictoHorario({ horaInicio, horaFin }, s)) {
        return [false, `Conflicto con sesión de entrenamiento (ID: ${s.id})`];
      }
    }

    // Verificar reservas
    const reservas = await reservaRepository.find({
      where: { 
        canchaId, 
        fechaReserva: fecha, 
        estado: In(['pendiente', 'aprobada']) 
      }
    });
    
    for (const r of reservas) {
      if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
        return [false, `Ya existe una reserva (${r.estado}) en ese horario`];
      }
    }

    // Verificar partidos
    const partidos = await partidoRepository.find({
      where: { 
        canchaId, 
        fecha, 
        estado: In(['programado', 'en_juego']) 
      }
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
