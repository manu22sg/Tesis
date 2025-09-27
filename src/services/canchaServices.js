// services/canchaServices.js
import { AppDataSource } from '../config/config.db.js';
import CanchaSchema from '../entity/Cancha.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';

/**
 * Crear una nueva cancha
 */
export async function crearCancha(datosCancha) {
  try {
    const canchaRepository = AppDataSource.getRepository(CanchaSchema);

    // Verificar que el nombre no esté en uso
    const canchaExistente = await canchaRepository.findOne({
      where: { nombre: datosCancha.nombre }
    });

    if (canchaExistente) {
      return [null, 'Ya existe una cancha con ese nombre'];
    }

    // Crear la cancha
    const nuevaCancha = canchaRepository.create({
      nombre: datosCancha.nombre,
      descripcion: datosCancha.descripcion || null,
      capacidadMaxima: datosCancha.capacidadMaxima ,
      estado: datosCancha.estado || 'disponible'
    });
      
    const canchaGuardada = await canchaRepository.save(nuevaCancha);
    return [canchaGuardada, null];

  } catch (error) {
    console.error('Error creando cancha:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Obtener todas las canchas con paginación
 */
export async function obtenerCanchas(filtros = {}) {
  try {
    const canchaRepository = AppDataSource.getRepository(CanchaSchema);

    // Parámetros de paginación
    const page = Math.max(1, filtros.page || 1);
    const limit = Math.min(100, Math.max(1, filtros.limit || 10));
    const skip = (page - 1) * limit;

    const queryOptions = {
      order: { nombre: 'ASC' },
      skip,
      take: limit
    };

    // Aplicar filtro por estado si se proporciona
    if (filtros.estado) {
      queryOptions.where = { estado: filtros.estado };
    }

    // Obtener canchas y total para la paginación
    const [canchas, total] = await canchaRepository.findAndCount(queryOptions);

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const paginationMeta = {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null
    };

    return [{ canchas, pagination: paginationMeta }, null];

  } catch (error) {
    console.error('Error obteniendo canchas:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Obtener una cancha por ID
 */
export async function obtenerCanchaPorId(id) {
  try {
    const canchaRepository = AppDataSource.getRepository(CanchaSchema);

    const cancha = await canchaRepository.findOne({
      where: { id }
    });

    if (!cancha) {
      return [null, 'Cancha no encontrada'];
    }

    return [cancha, null];

  } catch (error) {
    console.error('Error obteniendo cancha por ID:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Actualizar una cancha
 */
export async function actualizarCancha(id, datosActualizacion) {
  try {
    const canchaRepository = AppDataSource.getRepository(CanchaSchema);

    // Verificar que la cancha existe
    const cancha = await canchaRepository.findOne({
      where: { id }
    });

    if (!cancha) {
      return [null, 'Cancha no encontrada'];
    }

    // Si se quiere cambiar el nombre, verificar que no esté en uso
    if (datosActualizacion.nombre && datosActualizacion.nombre !== cancha.nombre) {
      const canchaConNombre = await canchaRepository.findOne({
        where: { nombre: datosActualizacion.nombre }
      });

      if (canchaConNombre) {
        return [null, 'Ya existe una cancha con ese nombre'];
      }
    }

    // Actualizar campos
    Object.keys(datosActualizacion).forEach(key => {
      if (datosActualizacion[key] !== undefined) {
        cancha[key] = datosActualizacion[key];
      }
    });

    const canchaActualizada = await canchaRepository.save(cancha);
    return [canchaActualizada, null];

  } catch (error) {
    console.error('Error actualizando cancha:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Eliminar una cancha (cambiar estado a fuera_servicio)
 */
export async function eliminarCancha(id) {
  try {
    const canchaRepository = AppDataSource.getRepository(CanchaSchema);
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);

    // Verificar que la cancha existe
    const cancha = await canchaRepository.findOne({
      where: { id }
    });

    if (!cancha) {
      return [null, 'Cancha no encontrada'];
    }

    // Verificar que no tenga reservas activas (pendientes o aprobadas)
    const reservasActivas = await reservaRepository.count({
      where: {
        canchaId: id,
        estado: ['pendiente', 'aprobada']
      }
    });

    if (reservasActivas > 0) {
      return [null, 'No se puede eliminar la cancha porque tiene reservas activas'];
    }

    // Cambiar estado a fuera_servicio en lugar de eliminar físicamente
    cancha.estado = 'fuera_servicio';
    const canchaEliminada = await canchaRepository.save(cancha);

    return [canchaEliminada, null];

  } catch (error) {
    console.error('Error eliminando cancha:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Reactivar una cancha (cambiar de fuera_servicio a disponible)
 */
export async function reactivarCancha(id) {
  try {
    const canchaRepository = AppDataSource.getRepository(CanchaSchema);

    const cancha = await canchaRepository.findOne({
      where: { id }
    });

    if (!cancha) {
      return [null, 'Cancha no encontrada'];
    }

    if (cancha.estado !== 'fuera_servicio') {
      return [null, 'Solo se pueden reactivar canchas fuera de servicio'];
    }

    cancha.estado = 'disponible';
    const canchaReactivada = await canchaRepository.save(cancha);

    return [canchaReactivada, null];

  } catch (error) {
    console.error('Error reactivando cancha:', error);
    return [null, 'Error interno del servidor'];
  }
}