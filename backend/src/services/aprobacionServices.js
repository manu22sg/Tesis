import { AppDataSource } from '../config/config.db.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import HistorialReservaSchema from '../entity/HistorialReserva.js';
import UsuarioSchema from '../entity/Usuario.js';


 // Aprobar una reserva
 
export async function aprobarReserva(reservaId, entrenadorId, observacion = null) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const reservaRepo = queryRunner.manager.getRepository(ReservaCanchaSchema);
    const historialRepo = queryRunner.manager.getRepository(HistorialReservaSchema);

    // Buscar la reserva
    const reserva = await reservaRepo.findOne({
      where: { id: reservaId },
      relations: ['usuario', 'cancha']
    });

    if (!reserva) {
      return [null, 'Reserva no encontrada'];
    }

    // Verificar que esté en estado pendiente
    if (reserva.estado !== 'pendiente') {
      return [null, `No se puede aprobar una reserva en estado '${reserva.estado}'. Solo reservas pendientes pueden ser aprobadas.`];
    }

    // Actualizar estado a aprobada
    reserva.estado = 'aprobada';
    const reservaAprobada = await reservaRepo.save(reserva);

    // Registrar en historial
    await historialRepo.save(historialRepo.create({
      reservaId: reserva.id,
      accion: 'aprobada',
      observacion: observacion || 'Reserva aprobada por el entrenador',
      usuarioId: entrenadorId
    }));

    await queryRunner.commitTransaction();

    // Obtener reserva completa con relaciones actualizadas
    const reservaCompleta = await AppDataSource.getRepository(ReservaCanchaSchema).findOne({
      where: { id: reserva.id },
      relations: ['usuario', 'cancha', 'participantes', 'participantes.usuario', 'historial', 'historial.usuario']
    });

    return [reservaCompleta, null];

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error aprobando reserva:', error);
    return [null, 'Error interno del servidor'];
  } finally {
    await queryRunner.release();
  }
}

 // Rechazar una reserva
export async function rechazarReserva(reservaId, entrenadorId, motivoRechazo) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const reservaRepo = queryRunner.manager.getRepository(ReservaCanchaSchema);
    const historialRepo = queryRunner.manager.getRepository(HistorialReservaSchema);

    // Buscar la reserva
    const reserva = await reservaRepo.findOne({
      where: { id: reservaId },
      relations: ['usuario', 'cancha']
    });

    if (!reserva) {
      return [null, 'Reserva no encontrada'];
    }

    // Verificar que esté en estado pendiente
    if (reserva.estado !== 'pendiente') {
      return [null, `No se puede rechazar una reserva en estado '${reserva.estado}'. Solo reservas pendientes pueden ser rechazadas.`];
    }

    // Actualizar estado a rechazada
    reserva.estado = 'rechazada';
    const reservaRechazada = await reservaRepo.save(reserva);

    // Registrar en historial
    await historialRepo.save(historialRepo.create({
      reservaId: reserva.id,
      accion: 'rechazada',
      observacion: motivoRechazo,
      usuarioId: entrenadorId
    }));

    await queryRunner.commitTransaction();

    // Obtener reserva completa con relaciones actualizadas
    const reservaCompleta = await AppDataSource.getRepository(ReservaCanchaSchema).findOne({
      where: { id: reserva.id },
      relations: ['usuario', 'cancha', 'participantes', 'participantes.usuario', 'historial', 'historial.usuario']
    });

    return [reservaCompleta, null];

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error rechazando reserva:', error);
    return [null, 'Error interno del servidor'];
  } finally {
    await queryRunner.release();
  }
}

 // Obtener reservas pendientes de aprobación
export async function obtenerReservasPendientes(filtros = {}) {
  try {
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);

    const page = Math.max(1, filtros.page || 1);
    const limit = Math.min(50, Math.max(1, filtros.limit || 10));
    const skip = (page - 1) * limit;

    let whereConditions = {};

    // 🔹 Filtro por estado (opcional)
    if (filtros.estado) {
      whereConditions.estado = filtros.estado;
    }

    // Filtros opcionales
    if (filtros.fecha) {
      whereConditions.fechaSolicitud = filtros.fecha;
    }

    if (filtros.canchaId) {
      whereConditions.canchaId = filtros.canchaId;
    }

    const queryOptions = {
      where: whereConditions,
      relations: ['usuario', 'cancha', 'participantes', 'participantes.usuario'],
      order: { 
        fechaSolicitud: 'DESC',  // ⭐ Más recientes primero
        horaInicio: 'ASC'        // ⭐ Luego por hora
      },
      skip,
      take: limit
    };

    const [reservas, total] = await reservaRepository.findAndCount(queryOptions);

    const totalPages = Math.ceil(total / limit);
    const paginationMeta = {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    };

    return [{ reservas, pagination: paginationMeta }, null];

  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    return [null, 'Error interno del servidor'];
  }
}



 // Cambiar estado de una reserva (función genérica)
export async function cambiarEstadoReserva(reservaId, nuevoEstado, entrenadorId, observacion = null) {
  const estadosValidos = ['pendiente', 'aprobada', 'rechazada', 'cancelada', 'completada'];
  
  if (!estadosValidos.includes(nuevoEstado)) {
    return [null, `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`];
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const reservaRepo = queryRunner.manager.getRepository(ReservaCanchaSchema);
    const historialRepo = queryRunner.manager.getRepository(HistorialReservaSchema);

    const reserva = await reservaRepo.findOne({
      where: { id: reservaId },
      relations: ['usuario', 'cancha']
    });

    if (!reserva) {
      return [null, 'Reserva no encontrada'];
    }

    const estadoAnterior = reserva.estado;

    // Validaciones específicas según el cambio de estado
    if (nuevoEstado === 'aprobada' && estadoAnterior !== 'pendiente') {
      return [null, 'Solo se pueden aprobar reservas pendientes'];
    }

    if (nuevoEstado === 'rechazada' && estadoAnterior !== 'pendiente') {
      return [null, 'Solo se pueden rechazar reservas pendientes'];
    }

    if (nuevoEstado === 'completada' && estadoAnterior !== 'aprobada') {
      return [null, 'Solo se pueden completar reservas aprobadas'];
    }

    // Actualizar estado
    reserva.estado = nuevoEstado;
    const reservaActualizada = await reservaRepo.save(reserva);

    // Registrar en historial
    const accionMsg = observacion || `Reserva cambiada de '${estadoAnterior}' a '${nuevoEstado}'`;
    
    await historialRepo.save(historialRepo.create({
      reservaId: reserva.id,
      accion: nuevoEstado,
      observacion: accionMsg,
      usuarioId: entrenadorId
    }));

    await queryRunner.commitTransaction();

    // Obtener reserva completa
    const reservaCompleta = await AppDataSource.getRepository(ReservaCanchaSchema).findOne({
      where: { id: reserva.id },
      relations: ['usuario', 'cancha', 'participantes', 'participantes.usuario', 'historial', 'historial.usuario']
    });

    return [reservaCompleta, null];

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error cambiando estado de reserva:', error);
    return [null, 'Error interno del servidor'];
  } finally {
    await queryRunner.release();
  }
}
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

 // Obtener estadísticas de reservas para el dashboard del entrenador

export async function obtenerEstadisticasReservas() {
  try {
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);

    const estadisticas = await reservaRepository
      .createQueryBuilder('reserva')
      .select('reserva.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy('reserva.estado')
      .getRawMany();

    const stats = {
      pendiente: 0,
      aprobada: 0,
      rechazada: 0,
      cancelada: 0,
      completada: 0,
      total: 0
    };

    estadisticas.forEach(stat => {
      const cantidad = parseInt(stat.cantidad);
      if (stats.hasOwnProperty(stat.estado)) {
        stats[stat.estado] = cantidad;
        stats.total += cantidad;
      }
    });

    // Estadísticas adicionales - reservas de hoy
    const hoy = getLocalDate();
    const reservasHoy = await reservaRepository.count({
      where: { fechaSolicitud: hoy }
    });

    stats.reservasHoy = reservasHoy;

    return [stats, null];

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return [null, 'Error interno del servidor'];
  }
}