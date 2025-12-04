import { AppDataSource } from '../config/config.db.js';
import { In } from 'typeorm';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import ParticipanteReservaSchema from '../entity/ParticipanteReserva.js';
import HistorialReservaSchema from '../entity/HistorialReserva.js';
import UsuarioSchema from '../entity/Usuario.js';
import CanchaSchema from '../entity/Cancha.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';
import PartidoCampeonatoSchema from '../entity/PartidoCampeonato.js'; // 
import { parseDateLocal, formatYMD } from '../utils/dateLocal.js';
import { 
  esCanchaPrincipal, 
  obtenerCanchaPrincipal 
} from './canchaHierarchyservices.js';

// Crear una nueva reserva con participantes

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


export async function obtenerTodasLasReservas(filtros = {}) {
  try {
    const repo = AppDataSource.getRepository(ReservaCanchaSchema);

    const page = Math.max(1, filtros.page || 1);
    const limit = Math.min(50, Math.max(1, filtros.limit || 10));
    const skip = (page - 1) * limit;

    const whereConditions = {};
    if (filtros.estado) whereConditions.estado = filtros.estado;
    if (filtros.fecha) whereConditions.fechaReserva = filtros.fecha;
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
    
    if (reserva.historial && reserva.historial.length > 0) {
      reserva.historial = reserva.historial.map(h => ({
        ...h,
        fecha: h.fechaAccion, 
        accion: h.accion,
        observacion: h.observacion,
        usuario: h.usuario
      }));
    }
    
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

export async function verificarDisponibilidadEspecificaTx(manager, canchaId, fechaISO, horaInicio, horaFin) {
  try {
    const fecha = formatYMD(parseDateLocal(fechaISO));

    const canchaRepo  = manager.getRepository(CanchaSchema);
    const sesionRepo  = manager.getRepository(SesionEntrenamientoSchema);
    const reservaRepo = manager.getRepository(ReservaCanchaSchema);
    const partidoRepo = manager.getRepository(PartidoCampeonatoSchema);

    // 1. Cancha debe existir y estar disponible
    const cancha = await canchaRepo.findOne({ where: { id: canchaId, estado: 'disponible' } });
    if (!cancha) return [false, 'Cancha inexistente o no disponible'];

    // 🆕 2. VALIDAR: Las reservas NO pueden usar la Principal
    if (esCanchaPrincipal(cancha)) {
      return [false, 'La Cancha Principal no está disponible para reservas de usuarios'];
    }

    // 3. Conflictos con otras reservas en ESTA división
    const reservas = await reservaRepo.find({
      where: { canchaId, fechaReserva: fecha, estado: In(['aprobada']) }
    });
    for (const r of reservas) {
      if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
        return [false, `Ya existe una reserva en ese horario`];
      }
    }

    // 🆕 4. Verificar sesiones en la Principal (bloquean todas las divisiones)
    const todasCanchas = await canchaRepo.find({ where: { estado: 'disponible' } });
    const canchaPrincipal = todasCanchas.find(c => esCanchaPrincipal(c));
    
    if (canchaPrincipal) {
      const sesiones = await sesionRepo.find({ 
        where: { canchaId: canchaPrincipal.id, fecha } 
      });
      
      for (const s of sesiones) {
        if (hayConflictoHorario({ horaInicio, horaFin }, s)) {
          return [false, `Hay una sesión de entrenamiento programada en ese horario`];
        }
      }

      // Verificar partidos en la Principal
      const partidosPrincipal = await partidoRepo.find({
        where: { 
          canchaId: canchaPrincipal.id, 
          fecha, 
          estado: In(['programado', 'en_juego']) 
        }
      });
      
      for (const p of partidosPrincipal) {
        if (hayConflictoHorario({ horaInicio, horaFin }, p)) {
          return [false, `Hay un partido de campeonato en ese horario`];
        }
      }
    }

    // 🆕 5. Verificar partidos en CUALQUIER cancha (bloquean TODO)
    for (const otraCancha of todasCanchas) {
      const partidos = await partidoRepo.find({
        where: { 
          canchaId: otraCancha.id, 
          fecha, 
          estado: In(['programado', 'en_juego']) 
        }
      });
      
      for (const p of partidos) {
        if (hayConflictoHorario({ horaInicio, horaFin }, p)) {
          return [false, `Hay un partido de campeonato programado en ese horario`];
        }
      }
    }

    return [true, null];
  } catch (e) {
    console.error('verificarDisponibilidadEspecificaTx:', e);
    return [false, 'Error interno del servidor'];
  }
}


export async function crearReserva(datosReserva, usuarioId) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { canchaId, fecha, horaInicio, horaFin, motivo, participantes } = datosReserva;

    const canchaRepo = queryRunner.manager.getRepository(CanchaSchema);
const cancha = await canchaRepo.findOne({ where: { id: canchaId } });

if (!cancha) {
  await queryRunner.rollbackTransaction();
  return [null, 'Cancha no encontrada'];
}

// 🆕 VALIDAR: Las reservas NO pueden usar la Principal
if (esCanchaPrincipal(cancha)) {
  await queryRunner.rollbackTransaction();
  return [null, 'La Cancha Principal no está disponible para reservas de usuarios. Por favor elija una de las canchas divisionales.'];
}

const capacidadMaxima = cancha.capacidadMaxima;


    // Verificar disponibilidad
    const [ok, errDisp] = await verificarDisponibilidadEspecificaTx(
      queryRunner.manager, canchaId, fecha, horaInicio, horaFin
    );
    if (!ok) {
      await queryRunner.rollbackTransaction();
      return [null, errDisp];
    }

    const reservaRepo = queryRunner.manager.getRepository(ReservaCanchaSchema);
    const usuarioRepo = queryRunner.manager.getRepository(UsuarioSchema);
    const partRepo    = queryRunner.manager.getRepository(ParticipanteReservaSchema);
    const histRepo    = queryRunner.manager.getRepository(HistorialReservaSchema);

    // Lock + último chequeo contra reservas pendientes/aprobadas
    const conflicto = await reservaRepo.createQueryBuilder('r')
      .setLock('pessimistic_read')
      .select('r.id')
      .where('r."canchaId" = :canchaId', { canchaId })
      .andWhere('r."fechaReserva" = :fecha', { fecha })
      .andWhere('r."estado" IN (:...estados)', { estados: [ 'aprobada'] })
      .andWhere('NOT (r."horaFin" <= :inicio OR r."horaInicio" >= :fin)', {
        inicio: horaInicio, fin: horaFin
      })
      .limit(1)
      .getOne();

    if (conflicto) {
      await queryRunner.rollbackTransaction();
      return [null, 'Ya existe una reserva en ese horario'];
    }

    const usuarioQueReserva = await usuarioRepo.findOne({ where: { id: usuarioId } });
    if (!usuarioQueReserva) {
      await queryRunner.rollbackTransaction();
      return [null, 'Usuario no encontrado'];
    }

    // 2. Agregar el solicitante a la lista de participantes si no está
    const participantesCompletos = Array.isArray(participantes) ? [...participantes] : [];
    if (!participantesCompletos.includes(usuarioQueReserva.rut)) {
      participantesCompletos.unshift(usuarioQueReserva.rut);
    }

    // 3. Validar que el número de participantes coincida con la capacidad de la cancha
    if (participantesCompletos.length !== capacidadMaxima) {
      await queryRunner.rollbackTransaction();
      return [null, `Esta cancha requiere exactamente ${capacidadMaxima} participantes. Tiene ${participantesCompletos.length} participante${participantesCompletos.length !== 1 ? 's' : ''}.`];
    }

    // 4. Validar que no haya RUTs duplicados
    const rutUnicos = new Set(participantesCompletos);
    if (rutUnicos.size !== participantesCompletos.length) {
      await queryRunner.rollbackTransaction();
      return [null, 'No se pueden repetir participantes en la reserva'];
    }

    //  5. Verificar que todos los RUTs existan en el sistema
    const usuariosExistentes = await usuarioRepo.find({
      where: participantesCompletos.map(rut => ({ rut }))
    });
    
    if (usuariosExistentes.length !== capacidadMaxima) {
      const rutsExist = usuariosExistentes.map(u => u.rut);
      const rutsNo = participantesCompletos.filter(rut => !rutsExist.includes(rut));
      await queryRunner.rollbackTransaction();
      return [null, `Los siguientes RUT no están registrados en el sistema: ${rutsNo.join(', ')}`];
    }

    // Crear reserva
    const nuevaReserva = reservaRepo.create({
      usuarioId,
      canchaId,
      fechaReserva: fecha,
      horaInicio,
      horaFin,
      motivo: motivo || null,
      estado: 'pendiente',
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

export async function cancelarReserva(reservaId, usuarioId) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const reservaRepo = queryRunner.manager.getRepository(ReservaCanchaSchema);
    const histRepo = queryRunner.manager.getRepository(HistorialReservaSchema);

    // 1. Buscar la reserva con lock
    const reserva = await reservaRepo.createQueryBuilder('r')
      .setLock('pessimistic_write')
      .where('r.id = :id', { id: reservaId })
      .getOne();

    if (!reserva) {
      await queryRunner.rollbackTransaction();
      return [null, 'Reserva no encontrada'];
    }

    // 2. Verificar que el usuario es el creador de la reserva
    if (reserva.usuarioId !== usuarioId) {
      await queryRunner.rollbackTransaction();
      return [null, 'No tiene permiso para cancelar esta reserva'];
    }

    // 3. Verificar que la reserva esté en un estado cancelable
    if (!['pendiente', 'aprobada'].includes(reserva.estado)) {
      await queryRunner.rollbackTransaction();
      return [null, `No se puede cancelar una reserva con estado "${reserva.estado}"`];
    }

    // 4. Validar que falten al menos 24 horas para la reserva
    const fechaReservaActual = parseDateLocal(reserva.fechaReserva);
    const [horaInicioActual, minInicioActual] = reserva.horaInicio.split(':').map(Number);
    
    const fechaHoraReserva = new Date(fechaReservaActual);
    fechaHoraReserva.setHours(horaInicioActual, minInicioActual, 0, 0);
    
    const ahora = new Date();
    const diferenciaMs = fechaHoraReserva - ahora;
    const horas24EnMs = 24 * 60 * 60 * 1000;
    
    if (diferenciaMs < horas24EnMs) {
      await queryRunner.rollbackTransaction();
      const horasRestantes = Math.floor(diferenciaMs / (60 * 60 * 1000));
      const minutosRestantes = Math.floor((diferenciaMs % (60 * 60 * 1000)) / (60 * 1000));
      return [null, `No se puede cancelar la reserva porque faltan menos de 24 horas (quedan ${horasRestantes}h ${minutosRestantes}m)`];
    }

    // 5. Actualizar estado a cancelada
    reserva.estado = 'cancelada';
    await reservaRepo.save(reserva);

    // 6. Registrar en historial
    await histRepo.save(histRepo.create({
      reservaId: reserva.id,
      accion: 'cancelada',
      observacion: 'Reserva cancelada por el usuario',
      usuarioId
    }));

    await queryRunner.commitTransaction();

    // 7. Retornar la reserva actualizada con relaciones
    const reservaActualizada = await AppDataSource.getRepository(ReservaCanchaSchema).findOne({
      where: { id: reserva.id },
      relations: ['usuario', 'cancha', 'participantes', 'participantes.usuario']
    });

    return [reservaActualizada, null];

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error cancelando reserva:', error);
    return [null, 'Error interno del servidor'];
  } finally {
    await queryRunner.release();
  }
}



export async function editarParticipantesReserva(reservaId, participantes, usuarioId) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const reservaRepo = queryRunner.manager.getRepository(ReservaCanchaSchema);
    const canchaRepo = queryRunner.manager.getRepository(CanchaSchema);
    const usuarioRepo = queryRunner.manager.getRepository(UsuarioSchema);
    const partRepo = queryRunner.manager.getRepository(ParticipanteReservaSchema);
    const histRepo = queryRunner.manager.getRepository(HistorialReservaSchema);

   // 1. Buscar la reserva con lock
     const reserva = await reservaRepo.createQueryBuilder('r')
  .where('r.id = :id', { id: reservaId })
  .setLock('pessimistic_write', ['r'])   // ⬅️ SOLO bloquea r (reserva)
  .getOne();

    if (!reserva) {
  await queryRunner.rollbackTransaction();
  return [null, 'Reserva no encontrada'];
}
  reserva.participantes = await partRepo.find({
  where: { reservaId: reserva.id }
});

    // 2. Verificar que el usuario es el creador
    if (reserva.usuarioId !== usuarioId) {
      await queryRunner.rollbackTransaction();
      return [null, 'Solo el creador de la reserva puede editarla'];
    }

    // 3. Verificar que la reserva esté en estado editable
    if (!['pendiente', 'aprobada'].includes(reserva.estado)) {
      await queryRunner.rollbackTransaction();
      return [null, `No se puede editar una reserva con estado "${reserva.estado}"`];
    }

    const fechaReservaActual = parseDateLocal(reserva.fechaReserva);
    const [horaInicioActual, minInicioActual] = reserva.horaInicio.split(':').map(Number);
    
    const fechaHoraReserva = new Date(fechaReservaActual);
    fechaHoraReserva.setHours(horaInicioActual, minInicioActual, 0, 0);
    
    const ahora = new Date();
    const diferenciaMs = fechaHoraReserva - ahora;
    const horas24EnMs = 24 * 60 * 60 * 1000;
    
    if (diferenciaMs < horas24EnMs) {
      await queryRunner.rollbackTransaction();
      const horasRestantes = Math.floor(diferenciaMs / (60 * 60 * 1000));
      const minutosRestantes = Math.floor((diferenciaMs % (60 * 60 * 1000)) / (60 * 1000));
      return [null, `No se puede editar la reserva porque faltan menos de 24 horas (quedan ${horasRestantes}h ${minutosRestantes}m)`];
    }

    // 5. Obtener capacidad de la cancha
    const cancha = await canchaRepo.findOne({ where: { id: reserva.canchaId } });
    if (!cancha) {
      await queryRunner.rollbackTransaction();
      return [null, 'Cancha no encontrada'];
    }

    const capacidadMaxima = cancha.capacidadMaxima;

    // 6. Preparar lista de participantes
    const usuarioQueReserva = await usuarioRepo.findOne({ where: { id: usuarioId } });
    if (!usuarioQueReserva) {
      await queryRunner.rollbackTransaction();
      return [null, 'Usuario no encontrado'];
    }
    if (!participantes.includes(usuarioQueReserva.rut)) {
  await queryRunner.rollbackTransaction();
  return [null, 'El creador de la reserva no puede ser removido de la lista de participantes.'];
}


    const participantesCompletos = Array.isArray(participantes) ? [...participantes] : [];
    
    // Asegurar que el creador esté en la lista
    if (!participantesCompletos.includes(usuarioQueReserva.rut)) {
      participantesCompletos.unshift(usuarioQueReserva.rut);
    }

    // 7. Validar número de participantes
    if (participantesCompletos.length !== capacidadMaxima) {
      await queryRunner.rollbackTransaction();
      return [null, `Esta cancha requiere exactamente ${capacidadMaxima} participantes. Tiene ${participantesCompletos.length} participante${participantesCompletos.length !== 1 ? 's' : ''}.`];
    }

    // 8. Validar RUTs únicos
    const rutUnicos = new Set(participantesCompletos);
    if (rutUnicos.size !== participantesCompletos.length) {
      await queryRunner.rollbackTransaction();
      return [null, 'No se pueden repetir participantes en la reserva'];
    }

    // 9. Verificar que todos los RUTs existan
    const usuariosExistentes = await usuarioRepo.find({
      where: participantesCompletos.map(rut => ({ rut }))
    });
    
    if (usuariosExistentes.length !== capacidadMaxima) {
      const rutsExist = usuariosExistentes.map(u => u.rut);
      const rutsNo = participantesCompletos.filter(rut => !rutsExist.includes(rut));
      await queryRunner.rollbackTransaction();
      return [null, `Los siguientes RUT no están registrados: ${rutsNo.join(', ')}`];
    }

    // 10. Verificar si realmente cambiaron los participantes
    const participantesActuales = reserva.participantes.map(p => p.rut).sort();
    const participantesNuevos = participantesCompletos.sort();
    const participantesCambiaron = JSON.stringify(participantesActuales) !== JSON.stringify(participantesNuevos);

    if (!participantesCambiaron) {
      await queryRunner.rollbackTransaction();
      return [null, 'No se detectaron cambios en los participantes'];
    }

    // 11. Eliminar participantes anteriores
    await partRepo.delete({ reservaId: reserva.id });

    // 12. Agregar nuevos participantes
    const participantesParaGuardar = usuariosExistentes.map(u => 
      partRepo.create({
        reservaId: reserva.id,
        usuarioId: u.id,
        rut: u.rut,
      })
    );
    await partRepo.save(participantesParaGuardar);

    // 13. Registrar en historial
    await histRepo.save(histRepo.create({
      reservaId: reserva.id,
      accion: 'editada',
      observacion: `Participantes actualizados (${participantesCompletos.length} participantes)`,
      usuarioId
    }));

    await queryRunner.commitTransaction();

    // 14. Retornar reserva actualizada
    const reservaActualizada = await AppDataSource.getRepository(ReservaCanchaSchema).findOne({
      where: { id: reserva.id },
      relations: ['usuario', 'cancha', 'participantes', 'participantes.usuario', 'historial', 'historial.usuario']
    });

    return [reservaActualizada, null];

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error editando participantes de reserva:', error);
    return [null, 'Error interno del servidor'];
  } finally {
    await queryRunner.release();
  }
}
