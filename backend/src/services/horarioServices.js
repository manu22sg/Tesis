
import { AppDataSource } from '../config/config.db.js';
import  CanchaSchema  from '../entity/Cancha.js';
import  SesionEntrenamientoSchema  from '../entity/SesionEntrenamiento.js';
import  PartidoCampeonatoSchema  from '../entity/PartidoCampeonato.js';
import  ReservaCanchaSchema  from '../entity/ReservaCancha.js';
import { LessThanOrEqual, Between, MoreThan,In, Not } from 'typeorm';
import { HORARIO_RESERVAS, HORARIO_SESIONES } from '../validations/validationsSchemas.js';
import { formatearHorario } from '../utils/emailHelpers.js';

import { 
  esCanchaPrincipal, 
  esDivision, 
  obtenerCanchaPrincipal,
  obtenerDivisiones,
  CAPACIDAD_CANCHA_PRINCIPAL
} from './canchaHierarchyservices.js';



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


export async function obtenerDisponibilidadPorFecha(fechaISO, page = 1, limit = 10, filtros = {}) {
  try {
    const fecha = toISODateSafe(fechaISO);
    const { canchaId, capacidad, tipoUso = 'reserva' } = filtros;

    const canchaRepo  = AppDataSource.getRepository(CanchaSchema);
    const reservaRepo = AppDataSource.getRepository(ReservaCanchaSchema);
    const sesionRepo  = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const partidoRepo = AppDataSource.getRepository(PartidoCampeonatoSchema);

    // Filtros de canchas
    const whereCanchas = { estado: 'disponible' };

    if (filtros.usuarioRol === 'estudiante' || filtros.usuarioRol === 'academico') {
      whereCanchas.capacidadMaxima = Not(CAPACIDAD_CANCHA_PRINCIPAL);
    }

    if (capacidad === 'pequena') whereCanchas.capacidadMaxima = LessThanOrEqual(8);
    else if (capacidad === 'mediana') whereCanchas.capacidadMaxima = Between(9, 15);
    else if (capacidad === 'grande') whereCanchas.capacidadMaxima = MoreThan(14);

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

    // 🆕 Obtener canchas del complejo para validaciones cruzadas
    const todasCanchas = await canchaRepo.find({ where: { estado: 'disponible' } });
    const canchaPrincipal = todasCanchas.find(c => esCanchaPrincipal(c));
    const divisiones = todasCanchas.filter(c => esDivision(c));

    // ⚡ Batch: trae TODO para TODAS las canchas del complejo
    const todosIds = todasCanchas.map(c => c.id);
    let reservas = [], sesiones = [], partidos = [];
    if (todosIds.length) {
      [reservas, sesiones, partidos] = await Promise.all([
        reservaRepo.find({
          where: { canchaId: In(todosIds), fechaReserva: fecha, estado: In(['pendiente','aprobada']) },
          select: ['canchaId','horaInicio','horaFin']
        }),
        sesionRepo.find({
          where: { canchaId: In(todosIds), fecha },
          select: ['canchaId','horaInicio','horaFin']
        }),
        partidoRepo.find({
          where: { canchaId: In(todosIds), fecha, estado: In(['programado','en_juego']) },
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

    const plantilla = tipoUso === 'sesion' 
      ? generarBloquesSesiones() 
      : generarBloquesReservas();
    
    const clonarBloques = () => plantilla.map(b => ({ ...b }));

    const disponibilidadPorCancha = [];
    
    for (const cancha of canchas) {
      const bloques = clonarBloques();
      const esLaPrincipal = esCanchaPrincipal(cancha);
      const esUnaDiv = esDivision(cancha);

      // 🔹 1. Marcar ocupaciones DIRECTAS en esta cancha
      for (const r of (reservasBy.get(cancha.id) || [])) {
        for (const blk of bloques) {
          if (hayConflictoHorario(blk, r)) { 
            blk.disponible = false; 
            if (!blk.motivo) blk.motivo = 'Reservado'; 
          }
        }
      }
      
      for (const s of (sesionesBy.get(cancha.id) || [])) {
        for (const blk of bloques) {
          if (hayConflictoHorario(blk, s)) { 
            blk.disponible = false; 
            if (!blk.motivo) blk.motivo = 'Sesión programada'; 
          }
        }
      }
      
      for (const p of (partidosBy.get(cancha.id) || [])) {
        for (const blk of bloques) {
          if (hayConflictoHorario(blk, p)) { 
            blk.disponible = false; 
            if (!blk.motivo) blk.motivo = 'Partido de campeonato'; 
          }
        }
      }

      // 🔹 2. BLOQUEOS CRUZADOS según jerarquía

      if (esLaPrincipal && canchaPrincipal) {
        // Si esta ES la Principal, bloquear si HAY divisiones ocupadas
        for (const div of divisiones) {
          const reservasDiv = reservasBy.get(div.id) || [];
          const partidosDiv = partidosBy.get(div.id) || [];
          
          for (const r of reservasDiv) {
            for (const blk of bloques) {
              if (hayConflictoHorario(blk, r)) {
                blk.disponible = false;
                if (!blk.motivo) blk.motivo = `${div.nombre} reservada`;
              }
            }
          }
          
          for (const p of partidosDiv) {
            for (const blk of bloques) {
              if (hayConflictoHorario(blk, p)) {
                blk.disponible = false;
                if (!blk.motivo) blk.motivo = `Partido en ${div.nombre}`;
              }
            }
          }
        }
      }

      if (esUnaDiv && canchaPrincipal) {
        // Si esta ES una división, bloquear si la Principal está ocupada
        const sesionesPrincipal = sesionesBy.get(canchaPrincipal.id) || [];
        const partidosPrincipal = partidosBy.get(canchaPrincipal.id) || [];
        
        for (const s of sesionesPrincipal) {
          for (const blk of bloques) {
            if (hayConflictoHorario(blk, s)) {
              blk.disponible = false;
              if (!blk.motivo) blk.motivo = 'Sesión en cancha principal';
            }
          }
        }
        
        for (const p of partidosPrincipal) {
          for (const blk of bloques) {
            if (hayConflictoHorario(blk, p)) {
              blk.disponible = false;
              if (!blk.motivo) blk.motivo = 'Partido en cancha principal';
            }
          }
        }

        // ✅ CAMBIO: Ya NO bloquear por partidos en otras divisiones
        // Los partidos pueden coexistir en diferentes divisiones
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
) {
  try {
    const fecha = toISODateSafe(fechaISO);

    if (!canchaId) return [true, null];

    const canchaRepository  = AppDataSource.getRepository(CanchaSchema);
    const sesionRepository  = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const partidoRepository = AppDataSource.getRepository(PartidoCampeonatoSchema);
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);

    const cancha = await canchaRepository.findOne({ 
      where: { id: canchaId, estado: 'disponible' } 
    });
    if (!cancha) return [false, 'Cancha inexistente o no disponible'];

    // ======================
    // 1. SESIONES EN ESTA CANCHA
    // ======================
    const sesiones = await sesionRepository.find({ 
      where: { canchaId, fecha }
    });

    for (const s of sesiones) {
      if (sesionIdExcluir && s.id === sesionIdExcluir) continue;
      if (hayConflictoHorario({ horaInicio, horaFin }, s)) {
        return [false, `Conflicto con otra sesión (${formatearHorario(s.horaInicio, s.horaFin)})`];
      }
    }

    // ======================
    // 2. PARTIDOS EN ESTA CANCHA
    // ======================
    const partidos = await partidoRepository.find({
      where: { canchaId, fecha, estado: In(['programado', 'en_juego']) }
    });

    for (const p of partidos) {
      if (hayConflictoHorario({ horaInicio, horaFin }, p)) {
        return [false, `Ya existe un partido de campeonato en el horario ${formatearHorario(p.horaInicio, p.horaFin)}`];
      }
    }

    // ======================
    // 3. RESERVAS EN ESTA CANCHA (solo aprobadas)
    // ======================
    const reservasPrincipal = await reservaRepository.find({
      where: { canchaId, fechaReserva: fecha, estado: In(['aprobada']) }
    });

    for (const r of reservasPrincipal) {
      if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
        return [false, `Conflicto con una reserva en el horario ${formatearHorario(r.horaInicio, r.horaFin)}`];
      }
    }

    // ======================
    // 4. VERIFICAR DIVISIONES (OPTIMIZADO)
    // ======================
    const divisiones = await obtenerDivisiones();
    const divisionesIds = divisiones.map(d => d.id);

    if (divisionesIds.length > 0) {

      // ---- Reservas de TODAS las divisiones (solo aprobadas)
      const reservasDivisiones = await reservaRepository.find({
        where: {
          canchaId: In(divisionesIds),
          fechaReserva: fecha,
          estado: In(['aprobada']),
        },
      });

      for (const r of reservasDivisiones) {
        if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
          const div = divisiones.find(d => d.id === r.canchaId);
          return [false, `Hay una reserva activa en ${div?.nombre || ''} en el horario ${formatearHorario(r.horaInicio, r.horaFin)}`];
        }
      }

      // ---- Partidos de TODAS las divisiones
      const partidosDivisiones = await partidoRepository.find({
        where: {
          canchaId: In(divisionesIds),
          fecha,
          estado: In(['programado', 'en_juego']),
        },
      });

      for (const p of partidosDivisiones) {
        if (hayConflictoHorario({ horaInicio, horaFin }, p)) {
          const div = divisiones.find(d => d.id === p.canchaId);
          return [false, `Hay un partido programado en ${div?.nombre || ''} en el horario ${formatearHorario(p.horaInicio, p.horaFin)}`];
        }
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
    
    if (!cancha) return [false, 'Cancha inexistente o no disponible'];

    // La principal NO admite reservas
    if (esCanchaPrincipal(cancha)) {
      return [false, 'La Cancha Principal no está disponible para reservas.'];
    }

    // ======================
    // 1. Reservas en ESTA cancha
    // ======================
    const reservas = await reservaRepository.find({
      where: { 
        canchaId,
        fechaReserva: fecha,
        estado: In(['pendiente', 'aprobada']) 
      }
    });

    for (const r of reservas) {
      if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
        return [false, `Ya existe una reserva en el horario ${formatearHorario(r.horaInicio, r.horaFin)}`];
      }
    }

    // ======================
    // 2. Sesiones y partidos en la principal (bloquean divisiones)
    // ======================
    const canchaPrincipal = await obtenerCanchaPrincipal();
    if (canchaPrincipal) {
      const sesionesPrincipal = await sesionRepository.find({
        where: { canchaId: canchaPrincipal.id, fecha }
      });

      for (const s of sesionesPrincipal) {
        if (hayConflictoHorario({ horaInicio, horaFin }, s)) {
          return [false, `Hay una sesión en la cancha principal en el horario ${formatearHorario(s.horaInicio, s.horaFin)}`];
        }
      }

      const partidosPrincipal = await partidoRepository.find({
        where: {
          canchaId: canchaPrincipal.id,
          fecha,
          estado: In(['programado', 'en_juego'])
        }
      });

      for (const p of partidosPrincipal) {
        if (hayConflictoHorario({ horaInicio, horaFin }, p)) {
          return [false, `Hay un partido en la cancha principal en el horario ${formatearHorario(p.horaInicio, p.horaFin)}`];
        }
      }
    }

    // ======================
    // 3. ✅ CAMBIO: Partidos solo en ESTA cancha específica
    // ======================
    const partidosCancha = await partidoRepository.find({
      where: {
        canchaId, // Solo validar en la cancha actual
        fecha,
        estado: In(['programado', 'en_juego'])
      }
    });

    for (const p of partidosCancha) {
      if (hayConflictoHorario({ horaInicio, horaFin }, p)) {
        return [false, `Hay un partido programado en esta cancha en el horario ${formatearHorario(p.horaInicio, p.horaFin)}`];
      }
    }

    return [true, null];

  } catch (err) {
    console.error('Error verificando disponibilidad de reserva:', err);
    return [false, 'Error interno del servidor'];
  }
}

