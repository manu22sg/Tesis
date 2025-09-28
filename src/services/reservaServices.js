import { AppDataSource } from '../config/config.db.js';
import { In } from 'typeorm';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import ParticipanteReservaSchema from '../entity/ParticipanteReserva.js';
import HistorialReservaSchema from '../entity/HistorialReserva.js';
import UsuarioSchema from '../entity/Usuario.js';
import CanchaSchema from '../entity/Cancha.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js'; // ⬅ usar sesiones reales
import { parseDateLocal, formatYMD } from '../utils/dateLocal.js';
/**
 * Crear una nueva reserva con participantes
 */
export async function crearReserva(datosReserva, usuarioId) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { canchaId, fecha, horaInicio, horaFin, motivo, participantes } = datosReserva;

    // disponibilidad verificando: cancha -> sesiones -> reservas
    const [ok, errDisp] = await verificarDisponibilidadEspecificaTx(
      queryRunner.manager, canchaId, fecha, horaInicio, horaFin
    );
    if (!ok) return [null, errDisp];

    const reservaRepo = queryRunner.manager.getRepository(ReservaCanchaSchema);
    const usuarioRepo = queryRunner.manager.getRepository(UsuarioSchema);
    const partRepo    = queryRunner.manager.getRepository(ParticipanteReservaSchema);
    const histRepo    = queryRunner.manager.getRepository(HistorialReservaSchema);

    // lock + último chequeo contra reservas pendientes/aprobadas
    const conflicto = await reservaRepo.createQueryBuilder('r')
      .setLock('pessimistic_read')
      .select('r.id')
      .where('r."canchaId" = :canchaId', { canchaId })
      .andWhere('r."fechaSolicitud" = :fecha', { fecha })
      .andWhere('r."estado" IN (:...estados)', { estados: ['pendiente', 'aprobada'] })
      .andWhere('NOT (r."horaFin" <= :inicio OR r."horaInicio" >= :fin)', {
        inicio: horaInicio, fin: horaFin
      })
      .limit(1)
      .getOne();

    if (conflicto) return [null, 'Ya existe una reserva en ese horario'];

    const usuarioQueReserva = await usuarioRepo.findOne({ where: { id: usuarioId } });
    if (!usuarioQueReserva) return [null, 'Usuario no encontrado'];

    const participantesCompletos = Array.isArray(participantes) ? [...participantes] : [];
    if (!participantesCompletos.includes(usuarioQueReserva.rut)) {
      participantesCompletos.unshift(usuarioQueReserva.rut);
    }
    if (participantesCompletos.length !== 12) {
      return [null, `Se requieren exactamente 12 participantes. Tienes ${participantesCompletos.length} participantes.`];
    }
    const rutUnicos = new Set(participantesCompletos);
    if (rutUnicos.size !== participantesCompletos.length) {
      return [null, 'No se pueden repetir participantes en la reserva'];
    }

    const usuariosExistentes = await usuarioRepo.find({
      where: participantesCompletos.map(rut => ({ rut }))
    });
    if (usuariosExistentes.length !== 12) {
      const rutsExist = usuariosExistentes.map(u => u.rut);
      const rutsNo = participantesCompletos.filter(rut => !rutsExist.includes(rut));
      return [null, `Los siguientes RUT no están registrados en el sistema: ${rutsNo.join(', ')}`];
    }

    // 4) Crear reserva
    const nuevaReserva = reservaRepo.create({
      usuarioId,
      canchaId,
      fechaSolicitud: fecha,   // 'YYYY-MM-DD'
      horaInicio,              // 'HH:mm'
      horaFin,                 // 'HH:mm'
      motivo: motivo || null,
      estado: 'pendiente',
      confirmado: false
    });

    let reservaGuardada;
    try {
      reservaGuardada = await reservaRepo.save(nuevaReserva);
    } catch (e) {
      if (e?.code === '23505' || e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062) {
        await queryRunner.rollbackTransaction();
        return [null, 'Ya existe una reserva en ese horario'];
      }
      throw e;
    }

    const participantesParaGuardar = usuariosExistentes.map(u => partRepo.create({
      reservaId: reservaGuardada.id,
      usuarioId: u.id,
      rut: u.rut,
      nombreOpcional: u.nombre
    }));
    await partRepo.save(participantesParaGuardar);

    await histRepo.save(histRepo.create({
      reservaId: reservaGuardada.id,
      accion: 'creada',
      observacion: `Reserva creada con ${participantesCompletos.length} participantes`,
      usuarioId
    }));

    await queryRunner.commitTransaction();

    const reservaCompleta = await AppDataSource.getRepository(ReservaCanchaSchema).findOne({
      where: { id: reservaGuardada.id },
      relations: ['usuario', 'cancha', 'participantes', 'participantes.usuario']
    });

    return [reservaCompleta, null];

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error creando reserva:', error);
    return [null, 'Error interno del servidor'];
  } finally {
    await queryRunner.release();
  }
}

/**
 * Obtener reservas del usuario con filtros y paginación
 */
export async function obtenerReservasUsuario(usuarioId, filtros = {}) {
  try {
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);

    const page = Math.max(1, filtros.page || 1);
    const limit = Math.min(50, Math.max(1, filtros.limit || 10));
    const skip = (page - 1) * limit;

    const whereConditions = { usuarioId };
    if (filtros.estado) whereConditions.estado = filtros.estado;

    const [reservas, total] = await reservaRepository.findAndCount({
      where: whereConditions,
      relations: ['cancha', 'participantes', 'participantes.usuario'],
      order: { fechaCreacion: 'DESC' },
      skip, take: limit
    });

    return [{
      reservas,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        nextPage: page * limit < total ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    }, null];

  } catch (error) {
    console.error('Error obteniendo reservas de usuario:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Obtener todas las reservas (para entrenadores)
 */
export async function obtenerTodasLasReservas(filtros = {}) {
  try {
    const repo = AppDataSource.getRepository(ReservaCanchaSchema);

    const page = Math.max(1, filtros.page || 1);
    const limit = Math.min(50, Math.max(1, filtros.limit || 10));
    const skip = (page - 1) * limit;

    const whereConditions = {};
    if (filtros.estado) whereConditions.estado = filtros.estado;
    if (filtros.fecha) whereConditions.fechaSolicitud = filtros.fecha;
    if (filtros.canchaId) whereConditions.canchaId = filtros.canchaId;

    const [reservas, total] = await repo.findAndCount({
      where: whereConditions,
      relations: ['usuario', 'cancha', 'participantes', 'participantes.usuario'],
      order: { fechaCreacion: 'DESC' },
      skip, take: limit
    });

    return [{
      reservas,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        nextPage: page * limit < total ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    }, null];

  } catch (error) {
    console.error('Error obteniendo todas las reservas:', error);
    return [null, 'Error interno del servidor'];
  }
}

export async function obtenerReservaPorId(id) {
  try {
    const reserva = await AppDataSource.getRepository(ReservaCanchaSchema).findOne({
      where: { id },
      relations: ['usuario', 'cancha', 'participantes', 'participantes.usuario', 'historial', 'historial.usuario']
    });
    if (!reserva) return [null, 'Reserva no encontrada'];
    return [reserva, null];
  } catch (error) {
    console.error('Error obteniendo reserva por ID:', error);
    return [null, 'Error interno del servidor'];
  }
}

// helpers internos
const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
const startOfDay = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const toISODate = d => startOfDay(new Date(d)).toISOString().split('T')[0];

function hayConflictoHorario(a, b) {
  const i1 = toMin(a.horaInicio), f1 = toMin(a.horaFin);
  const i2 = toMin(b.horaInicio), f2 = toMin(b.horaFin);
  return !(f1 <= i2 || f2 <= i1);
}

/**
 * Verifica disponibilidad de cancha contra:
 *  - Cancha disponible
 *  - Sesiones de entrenamiento (misma cancha/fecha)
 *  - Reservas pendientes/aprobadas
 */
export async function verificarDisponibilidadEspecificaTx(manager, canchaId, fechaISO, horaInicio, horaFin) {
  try {
    const fecha = formatYMD(parseDateLocal(fechaISO));
    

    const canchaRepo  = manager.getRepository(CanchaSchema);
    const sesionRepo  = manager.getRepository(SesionEntrenamientoSchema);
    const reservaRepo = manager.getRepository(ReservaCanchaSchema);

    const cancha = await canchaRepo.findOne({ where: { id: canchaId, estado: 'disponible' } });
    if (!cancha) return [false, 'Cancha inexistente o no disponible'];

    // 1) Conflictos con sesiones (misma cancha + fecha)
    const sesiones = await sesionRepo.find({ where: { canchaId, fecha } });
    for (const s of sesiones) {
      if (hayConflictoHorario({ horaInicio, horaFin }, s)) {
        return [false, `Conflicto con sesión de entrenamiento (id: ${s.id})`];
      }
    }

    // 2) Conflictos con reservas pendientes/aprobadas (usar In)
    const reservas = await reservaRepo.find({
      where: { canchaId, fechaSolicitud: fecha, estado: In(['pendiente', 'aprobada']) }
    });
    for (const r of reservas) {
      if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
        return [false, 'Ya existe una reserva en ese horario'];
      }
    }

    return [true, null];
  } catch (e) {
    console.error('verificarDisponibilidadEspecificaTx:', e);
    return [false, 'Error interno del servidor'];
  }
}
