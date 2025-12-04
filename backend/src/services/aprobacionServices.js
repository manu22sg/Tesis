import { AppDataSource } from '../config/config.db.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import HistorialReservaSchema from '../entity/HistorialReserva.js';
import UsuarioSchema from '../entity/Usuario.js';
import CanchaSchema from '../entity/Cancha.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';
import PartidoCampeonatoSchema from '../entity/PartidoCampeonato.js';
import { In } from 'typeorm';
import { esCanchaPrincipal, obtenerCanchaPrincipal } from './canchaHierarchyservices.js';

function hayConflictoHorario(a, b) {
  const toMin = t => { 
    const [h, m] = t.split(':').map(Number); 
    return h * 60 + m; 
  };
  const i1 = toMin(a.horaInicio), f1 = toMin(a.horaFin);
  const i2 = toMin(b.horaInicio), f2 = toMin(b.horaFin);
  return !(f1 <= i2 || f2 <= i1);
}

 // Aprobar una reserva
 
export async function aprobarReserva(reservaId, entrenadorId, observacion = null) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const reservaRepo = queryRunner.manager.getRepository(ReservaCanchaSchema);
    const historialRepo = queryRunner.manager.getRepository(HistorialReservaSchema);
    const sesionRepo = queryRunner.manager.getRepository(SesionEntrenamientoSchema);
    const partidoRepo = queryRunner.manager.getRepository(PartidoCampeonatoSchema);
    const canchaRepo = queryRunner.manager.getRepository(CanchaSchema);

    // 1. Buscar la reserva
    const reserva = await reservaRepo.findOne({
      where: { id: reservaId },
      relations: ['usuario', 'cancha']
    });

    if (!reserva) {
      await queryRunner.rollbackTransaction();
      return [null, 'Reserva no encontrada'];
    }

    // 2. Verificar que esté en estado pendiente
    if (reserva.estado !== 'pendiente') {
      await queryRunner.rollbackTransaction();
      return [null, `No se puede aprobar una reserva en estado '${reserva.estado}'. Solo reservas pendientes pueden ser aprobadas.`];
    }

    // 🆕 3. VALIDAR que no haya conflictos con sesiones en la Principal
    const todasCanchas = await canchaRepo.find({ where: { estado: 'disponible' } });
    const canchaPrincipal = todasCanchas.find(c => esCanchaPrincipal(c));
    
    if (canchaPrincipal) {
      const sesiones = await sesionRepo.find({ 
        where: { canchaId: canchaPrincipal.id, fecha: reserva.fechaReserva } 
      });
      
      for (const s of sesiones) {
        if (hayConflictoHorario(reserva, s)) {
          await queryRunner.rollbackTransaction();
          return [null, `Hay una sesión programada en ese horario (${s.horaInicio} - ${s.horaFin})`];
        }
      }

      // Verificar partidos en la Principal
      const partidosPrincipal = await partidoRepo.find({
        where: { 
          canchaId: canchaPrincipal.id, 
          fecha: reserva.fechaReserva, 
          estado: In(['programado', 'en_juego']) 
        }
      });
      
      for (const p of partidosPrincipal) {
        if (hayConflictoHorario(reserva, p)) {
          await queryRunner.rollbackTransaction();
          return [null, `Hay un partido de campeonato en ese horario (${p.horaInicio || ''} - ${p.horaFin || ''})`];
        }
      }
    }

    // 🆕 4. VALIDAR que no haya partidos en NINGUNA cancha (bloquean TODO)
    for (const otraCancha of todasCanchas) {
      const partidos = await partidoRepo.find({
        where: { 
          canchaId: otraCancha.id, 
          fecha: reserva.fechaReserva, 
          estado: In(['programado', 'en_juego']) 
        }
      });
      
      for (const p of partidos) {
        if (hayConflictoHorario(reserva, p)) {
          await queryRunner.rollbackTransaction();
          return [null, `Hay un partido de campeonato en ${otraCancha.nombre} en el horario ${p.horaInicio || ''} - ${p.horaFin || ''}`];
        }
      }
    }

    // 🆕 5. VALIDAR que no haya conflicto con otra reserva YA APROBADA
    const reservasAprobadas = await reservaRepo.find({
      where: { 
        canchaId: reserva.canchaId, 
        fechaReserva: reserva.fechaReserva, 
        estado: 'aprobada' 
      }
    });
    
    for (const r of reservasAprobadas) {
      if (r.id !== reserva.id && hayConflictoHorario(reserva, r)) {
        await queryRunner.rollbackTransaction();
        return [null, `Ya existe otra reserva aprobada en ese horario`];
      }
    }

    // 6. Actualizar estado a aprobada
    reserva.estado = 'aprobada';
    const reservaAprobada = await reservaRepo.save(reserva);

    // 7. Registrar en historial
    await historialRepo.save(historialRepo.create({
      reservaId: reserva.id,
      accion: 'aprobada',
      observacion: observacion || 'Reserva aprobada por el entrenador',
      usuarioId: entrenadorId
    }));

    await queryRunner.commitTransaction();

    // 8. Obtener reserva completa con relaciones actualizadas
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
      whereConditions.fechaReserva = filtros.fecha;
    }

    if (filtros.canchaId) {
      whereConditions.canchaId = filtros.canchaId;
    }
    if (filtros.usuarioId) {
      whereConditions.usuarioId = filtros.usuarioId;
    }

    const queryOptions = {
      where: whereConditions,
      relations: ['usuario', 'cancha', 'participantes', 'participantes.usuario'],
      order: { 
        fechaReserva: 'DESC',  
        horaInicio: 'ASC'        
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
      where: { fechaReserva: hoy }
    });

    stats.reservasHoy = reservasHoy;

    return [stats, null];

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return [null, 'Error interno del servidor'];
  }
}