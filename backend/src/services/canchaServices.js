import { AppDataSource } from '../config/config.db.js';
import CanchaSchema from '../entity/Cancha.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';
import { In, MoreThanOrEqual } from 'typeorm';


const hoyYMD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

 // Crear una nueva cancha
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

 // Obtener todas las canchas con paginación
export async function obtenerCanchas(filtros = {}) {
  try {
    const canchaRepository = AppDataSource.getRepository(CanchaSchema);

    const page = Math.max(1, filtros.page || 1);
    const limit = Math.min(100, Math.max(1, filtros.limit || 10));
    const skip = (page - 1) * limit;

    const qb = canchaRepository
      .createQueryBuilder('cancha')
      .orderBy('cancha.nombre', 'ASC')
      .skip(skip)
      .take(limit);

    // 🔹 Filtro por estado (si viene)
    if (filtros.estado) {
      qb.andWhere('cancha.estado = :estado', { estado: filtros.estado });
    }

    // 🔹 Filtro de búsqueda (por nombre o descripción)
    if (filtros.q && filtros.q.trim() !== '') {
      const q = `%${filtros.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(cancha.nombre) LIKE :q OR LOWER(cancha.descripcion) LIKE :q)',
        { q }
      );
    }

    // 🔹 Ejecutar consulta y contar
    const [canchas, total] = await qb.getManyAndCount();

    // 🔹 Paginar
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

    return [{ canchas, pagination: paginationMeta }, null];
  } catch (error) {
    console.error('Error obteniendo canchas:', error);
    return [null, 'Error interno del servidor'];
  }
}
 // Obtener una cancha por ID
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

 //Actualizar una cancha
export async function actualizarCancha(id, datosActualizacion) {
  try {
    const canchaRepository  = AppDataSource.getRepository(CanchaSchema);
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);
    const sesionRepository  = AppDataSource.getRepository(SesionEntrenamientoSchema);

    // 1) Verificar que la cancha existe
    const cancha = await canchaRepository.findOne({ where: { id } });
    if (!cancha) return [null, 'Cancha no encontrada'];

    // 2) Si se quiere cambiar el nombre, verificar que no esté en uso por otra
    if (datosActualizacion.nombre && datosActualizacion.nombre !== cancha.nombre) {
      const canchaConNombre = await canchaRepository.findOne({
        where: { nombre: datosActualizacion.nombre }
      });
      if (canchaConNombre) return [null, 'Ya existe una cancha con ese nombre'];
    }

    // 3) Endurecer cambio de estado: si va a mantenimiento o fuera_servicio, no permitir si hay:
    
    if (
      datosActualizacion.estado &&
      datosActualizacion.estado !== cancha.estado &&
      ['mantenimiento', 'fuera_servicio'].includes(datosActualizacion.estado)
    ) {
      // reservas activas
      const reservasActivas = await reservaRepository.count({
        where: { canchaId: id, estado: In(['aprobada']) }
      });
      if (reservasActivas > 0) {
        return [null, 'No se puede cambiar el estado: la cancha tiene reservas activas'];
      }

      // sesiones futuras (incluye hoy)
      const hoy = hoyYMD();
      const sesionesFuturas = await sesionRepository.count({
        where: { canchaId: id, fecha: MoreThanOrEqual(hoy) }
      });
      if (sesionesFuturas > 0) {
        return [null, 'No se puede cambiar el estado: la cancha tiene sesiones de entrenamiento programadas'];
      }
    }

    // 4) Actualizar campos permitidos
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
// Eliminar una cancha (cambiar estado a fuera_servicio)
export async function eliminarCancha(id) {
  try {
    const canchaRepository  = AppDataSource.getRepository(CanchaSchema);
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);
    const sesionRepository  = AppDataSource.getRepository(SesionEntrenamientoSchema);

    // 1) Verificar que la cancha existe
    const cancha = await canchaRepository.findOne({ where: { id } });
    if (!cancha) return [null, 'Cancha no encontrada'];

    // 2) Bloquear si tiene reservas activas (/aprobada)
    const reservasActivas = await reservaRepository.count({
      where: { canchaId: id, estado: In([ 'aprobada']) } // cambiar lo de  si es necesario
    });
    if (reservasActivas > 0) {
      return [null, 'No se puede eliminar la cancha porque tiene reservas activas'];
    }

    // 3) Bloquear si tiene sesiones de entrenamiento programadas (desde hoy en adelante)
    const hoy = hoyYMD();
    const sesionesFuturas = await sesionRepository.count({
      where: { canchaId: id, fecha: MoreThanOrEqual(hoy) }
    });
    if (sesionesFuturas > 0) {
      return [null, 'No se puede eliminar la cancha porque tiene sesiones de entrenamiento programadas'];
    }

    // 4) Soft-delete: poner fuera de servicio
    cancha.estado = 'fuera_servicio';
    const canchaEliminada = await canchaRepository.save(cancha);
    return [canchaEliminada, null];

  } catch (error) {
    console.error('Error eliminando cancha:', error);
    return [null, 'Error interno del servidor'];
  }
}


 // Reactivar una cancha (cambiar de fuera_servicio a disponible)
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