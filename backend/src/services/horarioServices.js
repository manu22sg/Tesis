
import { AppDataSource } from '../config/config.db.js';
import  CanchaSchema  from '../entity/Cancha.js';
import  SesionEntrenamientoSchema  from '../entity/sesionEntrenamiento.js';
import  PartidoCampeonatoSchema  from '../entity/partidoCampeonato.js';
import  ReservaCanchaSchema  from '../entity/reservaCancha.js';
import { LessThanOrEqual, Between, MoreThan,In } from 'typeorm';
import { HORARIO_RESERVAS, HORARIO_SESIONES } from '../validations/validationsSchemas.js';



const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

function toISODateSafe(input) {
  if (typeof input === 'string' && DATE_YYYY_MM_DD.test(input)) return input;

  const d = new Date(input);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

function hayConflictoHorario(b1, b2) {
  const i1 = timeToMinutes(b1.horaInicio);
  const f1 = timeToMinutes(b1.horaFin);
  const i2 = timeToMinutes(b2.horaInicio);
  const f2 = timeToMinutes(b2.horaFin);
  return !(f1 <= i2 || f2 <= i1);
}

// ============================================
// 🔧 GENERADORES DE BLOQUES
// ============================================

function generarBloquesReservas() {
  const bloques = [];
  const ini = timeToMinutes(HORARIO_RESERVAS.horainicio);
  const fin = timeToMinutes(HORARIO_RESERVAS.horafin);
  const bloque = HORARIO_RESERVAS.duracionBloque;
  const limpieza = HORARIO_RESERVAS.tiempoLimpieza;

  for (let t = ini; t + bloque <= fin; t += (bloque + limpieza)) {
    bloques.push({
      horaInicio: minutesToTime(t),
      horaFin: minutesToTime(t + bloque),
      disponible: true
    });
  }
  return bloques;
}

function generarBloquesSesiones() {
  const bloques = [];
  const ini = timeToMinutes(HORARIO_SESIONES.horainicio);
  const fin = timeToMinutes(HORARIO_SESIONES.horafin);
  const bloqueDuracion = 120; // 2 horas por bloque visual

  for (let t = ini; t + bloqueDuracion <= fin; t += bloqueDuracion) {
    bloques.push({
      horaInicio: minutesToTime(t),
      horaFin: minutesToTime(t + bloqueDuracion),
      disponible: true
    });
  }
  return bloques;
}

// ============================================
// 📋 TUS FUNCIONES EXISTENTES (no tocar)
// ============================================

export async function obtenerDisponibilidadPorFecha(fechaISO, page = 1, limit = 10, filtros = {}) {
  try {
    const fecha = toISODateSafe(fechaISO);
    const { canchaId, capacidad, tipoUso = 'reserva' } = filtros; // 🆕 Agregado tipoUso

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
          select: ['canchaId','horaInicio','horaFin']
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

    // 🔥 CAMBIO CLAVE: Plantilla según tipo de uso
    const plantilla = tipoUso === 'sesion' 
      ? generarBloquesSesiones() 
      : generarBloquesReservas();
    
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
export async function verificarDisponibilidadSesion(
  canchaId, 
  fechaISO, 
  horaInicio, 
  horaFin, 
  sesionIdExcluir = null,
  partidoIdExcluir = null
) {
  try {
    const fecha = toISODateSafe(fechaISO);

    const canchaRepository  = AppDataSource.getRepository(CanchaSchema);
    const sesionRepository  = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const partidoRepository = AppDataSource.getRepository(PartidoCampeonatoSchema);
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema); 

    const cancha = await canchaRepository.findOne({ 
      where: { id: canchaId, estado: 'disponible' } 
    });
    
    if (!cancha) {
      return [false, 'Cancha inexistente o no disponible'];
    }

    // ✅ 1. Verificar otras sesiones de entrenamiento
    const sesiones = await sesionRepository.find({ 
      where: { canchaId, fecha } 
    });
    
    for (const s of sesiones) {
      if (sesionIdExcluir && s.id === sesionIdExcluir) continue;
      
      if (hayConflictoHorario({ horaInicio, horaFin }, s)) {
        return [false, `Conflicto con otra sesión (${s.horaInicio} - ${s.horaFin})`];
      }
    }

    // ✅ 2. Verificar partidos de campeonato
    const partidos = await partidoRepository.find({
      where: { 
        canchaId, 
        fecha, 
        estado: In(['programado', 'en_juego']) 
      }
    });
    
    for (const p of partidos) {
  if (partidoIdExcluir && p.id === partidoIdExcluir) continue;
      if (hayConflictoHorario({ horaInicio, horaFin }, p)) {
        return [false, `Ya existe un partido de campeonato en ese horario`];
      }
    }

    // ✅ 3. Verificar reservas de cancha (NUEVO)
    const reservas = await reservaRepository.find({
      where: { 
        canchaId, 
        fechaReserva: fecha, 
        estado: In(['aprobada']) 
      }
    });
    
    for (const r of reservas) {
      if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
        return [false, `Conflicto con una reserva de cancha (${r.estado}) en ese horario`];
      }
    }

    return [true, null];
  } catch (err) {
    console.error('Error verificando disponibilidad de sesión:', err);
    return [false, 'Error interno del servidor'];
  }
}

export async function verificarDisponibilidadReserva(
  canchaId, 
  fechaISO, 
  horaInicio, 
  horaFin
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

    // ✅ 1. Verificar conflictos con otras reservas
    const reservas = await reservaRepository.find({
      where: { 
        canchaId, 
        fechaReserva: fecha, 
        estado: In(['pendiente', 'aprobada']) 
      }
    });
    
    for (const r of reservas) {
      if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
        return [false, `Ya existe una reserva en ese horario`]; //(${r.estado}) 
      }
    }

    // ✅ 2. Verificar conflictos con sesiones de entrenamiento
    const sesiones = await sesionRepository.find({ 
      where: { canchaId, fecha } 
    });
    
    for (const s of sesiones) {
      if (hayConflictoHorario({ horaInicio, horaFin }, s)) {
        return [false, `Conflicto con otra sesión de entrenamiento (${s.horaInicio} - ${s.horaFin}) `];
      }
    }

    // ✅ 3. Verificar conflictos con partidos de campeonato
    const partidos = await partidoRepository.find({
      where: { 
        canchaId, 
        fecha, 
        estado: In(['programado', 'en_juego']) 
      }
    });
    
    for (const p of partidos) {
      if (hayConflictoHorario({ horaInicio, horaFin }, p)) {
        return [false, `Ya existe un partido de campeonato en ese horario`];
      }
    }

    return [true, null];
  } catch (err) {
    console.error('Error verificando disponibilidad de reserva:', err);
    return [false, 'Error interno del servidor'];
  }
}