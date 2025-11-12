import { AppDataSource } from '../config/config.db.js';
import EntrenamientoSesionSchema from '../entity/EntrenamientoSesion.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';

// Crear un nuevo EntrenamientoSesion (bloque de entrenamiento)
export async function crearEntrenamiento(datos) {
  try {
    const entrenamientoRepo = AppDataSource.getRepository(EntrenamientoSesionSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    const { sesionId, titulo, descripcion, duracionMin, orden } = datos;

    // Validar título
    if (!titulo || titulo.trim() === '') {
      return [null, 'El título es obligatorio'];
    }

    if (sesionId) {
      const sesion = await sesionRepo.findOne({ where: { id: sesionId } });
      if (!sesion) return [null, 'Sesión no encontrada'];

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaSesion = new Date(sesion.fecha);
      fechaSesion.setHours(0, 0, 0, 0);

      if (fechaSesion < hoy) {
        return [null, 'No se pueden agregar entrenamientos a sesiones pasadas'];
      }

      // Validar orden duplicado solo si hay sesionId
      if (orden !== null && orden !== undefined) {
        const existeOrden = await entrenamientoRepo.findOne({
          where: { sesionId, orden }
        });
        if (existeOrden) {
          return [null, `Ya existe un entrenamiento con orden ${orden} en esta sesión`];
        }
      }
    }

    const entrenamiento = entrenamientoRepo.create({
      sesionId: sesionId || null,
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      duracionMin: duracionMin || null,
      orden: sesionId ? (orden || null) : null,
    });

    const guardado = await entrenamientoRepo.save(entrenamiento);

    const completo = await entrenamientoRepo.findOne({
      where: { id: guardado.id },
      relations: ['sesion'],
    });

    return [completo, null];
  } catch (error) {
    console.error('Error creando entrenamiento:', error);
    return [null, 'Error interno del servidor'];
  }
}


// Listar entrenamientos con filtros y paginación
export async function obtenerEntrenamientos(filtros = {}) {
  try {
    const entrenamientoRepo = AppDataSource.getRepository(EntrenamientoSesionSchema);

    const page = Math.max(1, filtros.page || 1);
    const limit = Math.min(50, Math.max(1, filtros.limit || 10));
    const skip = (page - 1) * limit;

    const q = (filtros.q || '').trim().toLowerCase();
    const sesionId = filtros.sesionId ? parseInt(filtros.sesionId) : null;

    const qb = entrenamientoRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.sesion', 's')
      .orderBy('e.orden', 'ASC')
      .addOrderBy('e.fechaCreacion', 'DESC')
      .skip(skip)
      .take(limit);

    // Búsqueda general por texto
    if (q) {
      qb.andWhere(`(LOWER(e.titulo) LIKE :q OR LOWER(e.descripcion) LIKE :q)`, { q: `%${q}%` });
    }

    // Filtro por sesión
    if (sesionId !== null) {
  qb.andWhere(`e.sesionId = :sesionId`, { sesionId });
}

    const [entrenamientos, total] = await qb.getManyAndCount();

    const pagination = {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };

    return [{ entrenamientos, pagination }, null];
  } catch (error) {
    console.error('Error obteniendo entrenamientos:', error);
    return [null, 'Error interno del servidor'];
  }
}

// Obtener entrenamiento por ID
export async function obtenerEntrenamientoPorId(id) {
  try {
    const entrenamientoRepo = AppDataSource.getRepository(EntrenamientoSesionSchema);

    const entrenamiento = await entrenamientoRepo.findOne({
      where: { id },
      relations: ['sesion'],
    });

    if (!entrenamiento) return [null, 'Entrenamiento no encontrado'];
    return [entrenamiento, null];
  } catch (error) {
    console.error('Error obteniendo entrenamiento por ID:', error);
    return [null, 'Error interno del servidor'];
  }
}

// Actualizar entrenamiento
export async function actualizarEntrenamiento(id, datos) {
  try {
    const entrenamientoRepo = AppDataSource.getRepository(EntrenamientoSesionSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    const entrenamiento = await entrenamientoRepo.findOne({ where: { id } });
    if (!entrenamiento) return [null, 'Entrenamiento no encontrado'];

    // Validar sesión si cambia
    if (datos.sesionId !== undefined && datos.sesionId !== null) {
  if (datos.sesionId !== entrenamiento.sesionId) {
    const sesion = await sesionRepo.findOne({ where: { id: datos.sesionId } });
    if (!sesion) return [null, 'Sesión no encontrada'];
  }
}

    // Validar título si cambia
    if (datos.titulo !== undefined && (!datos.titulo || datos.titulo.trim() === '')) {
      return [null, 'El título no puede estar vacío'];
    }

    if (datos.orden !== undefined && datos.orden !== entrenamiento.orden) {
  const existeOrden = await entrenamientoRepo.findOne({
    where: { 
      sesionId: datos.sesionId || entrenamiento.sesionId, 
      orden: datos.orden 
    }
  });
  
  if (existeOrden && existeOrden.id !== id) {
    return [null, `Ya existe un entrenamiento con orden ${datos.orden} en esta sesión`];
  }
}


    // Actualizar campos permitidos
    Object.keys(datos).forEach(k => {
      if (datos[k] !== undefined && k !== 'id' && k !== 'fechaCreacion') {
        entrenamiento[k] = datos[k];
      }
    });

    const actualizado = await entrenamientoRepo.save(entrenamiento);

    // Devolver con relación
    const completo = await entrenamientoRepo.findOne({
      where: { id: actualizado.id },
      relations: ['sesion'],
    });

    return [completo, null];
  } catch (error) {
    console.error('Error actualizando entrenamiento:', error);
    return [null, 'Error interno del servidor'];
  }
}

// Eliminar entrenamiento
export async function eliminarEntrenamiento(id) {
  try {
    const entrenamientoRepo = AppDataSource.getRepository(EntrenamientoSesionSchema);
    
    const entrenamiento = await entrenamientoRepo.findOne({ where: { id } });
    if (!entrenamiento) return [null, 'Entrenamiento no encontrado'];

    await entrenamientoRepo.remove(entrenamiento);
    return [{ message: 'Entrenamiento eliminado correctamente' }, null];
  } catch (error) {
    console.error('Error eliminando entrenamiento:', error);
    return [null, 'Error interno del servidor'];
  }
}

// Obtener todos los entrenamientos de una sesión específica
export async function obtenerEntrenamientosPorSesion(sesionId) {
  try {
    const entrenamientoRepo = AppDataSource.getRepository(EntrenamientoSesionSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    // Validar que la sesión exista
    const sesion = await sesionRepo.findOne({ where: { id: sesionId } });
    if (!sesion) return [null, 'Sesión no encontrada'];

    const entrenamientos = await entrenamientoRepo.find({
      where: { sesionId },
      relations: ['sesion'],
      order: { orden: 'ASC', fechaCreacion: 'DESC' },
    });

    return [entrenamientos, null];
  } catch (error) {
    console.error('Error obteniendo entrenamientos por sesión:', error);
    return [null, 'Error interno del servidor'];
  }
}

export async function reordenarEntrenamientos(sesionId, nuevosOrdenes) {
  try {
    const entrenamientoRepo = AppDataSource.getRepository(EntrenamientoSesionSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    // Validar sesión
    const sesion = await sesionRepo.findOne({ where: { id: sesionId } });
    if (!sesion) return [null, 'Sesión no encontrada'];

    // nuevosOrdenes: [{ id: 1, orden: 1 }, { id: 2, orden: 2 }, ...]
    const actualizados = [];
    
    for (const item of nuevosOrdenes) {
      const entrenamiento = await entrenamientoRepo.findOne({ 
        where: { id: item.id, sesionId } 
      });
      
      if (entrenamiento) {
        entrenamiento.orden = item.orden;
        await entrenamientoRepo.save(entrenamiento);
        actualizados.push(entrenamiento);
      }
    }

    return [actualizados, null];
  } catch (error) {
    console.error('Error reordenando entrenamientos:', error);
    return [null, 'Error interno del servidor'];
  }
}

export async function duplicarEntrenamiento(id, nuevaSesionId = null) {
  try {
    const entrenamientoRepo = AppDataSource.getRepository(EntrenamientoSesionSchema);
    
    const original = await entrenamientoRepo.findOne({ where: { id } });
    if (!original) return [null, 'Entrenamiento no encontrado'];

    const duplicado = entrenamientoRepo.create({
      sesionId: nuevaSesionId || original.sesionId,
      titulo: `${original.titulo} (Copia)`,
      descripcion: original.descripcion,
      duracionMin: original.duracionMin,
      orden: null, // Se asignará automáticamente al final
    });

    const guardado = await entrenamientoRepo.save(duplicado);
    
    const completo = await entrenamientoRepo.findOne({
      where: { id: guardado.id },
      relations: ['sesion'],
    });

    return [completo, null];
  } catch (error) {
    console.error('Error duplicando entrenamiento:', error);
    return [null, 'Error interno del servidor'];
  }
}

export async function obtenerEstadisticasEntrenamientos(sesionId = null) {
  try {
    const entrenamientoRepo = AppDataSource.getRepository(EntrenamientoSesionSchema);
    
    const query = entrenamientoRepo.createQueryBuilder('e');
    
    if (sesionId) {
      query.where('e.sesionId = :sesionId', { sesionId });
    }
    
    const total = await query.getCount();
    const conDuracion = await query
      .andWhere('e.duracionMin IS NOT NULL')
      .getCount();
    
    const result = await query
      .select('SUM(e.duracionMin)', 'duracionTotal')
      .addSelect('AVG(e.duracionMin)', 'duracionPromedio')
      .getRawOne();

    return [{
      totalEntrenamientos: total,
      entrenamientosConDuracion: conDuracion,
      duracionTotalMinutos: parseInt(result.duracionTotal) || 0,
      duracionPromedioMinutos: parseFloat(result.duracionPromedio) || 0,
    }, null];
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return [null, 'Error interno del servidor'];
  }
}

export async function asignarEntrenamientosASesion(sesionId, ids) {
  try {
    const repo = AppDataSource.getRepository(EntrenamientoSesionSchema);

    const result = await repo
      .createQueryBuilder()
      .update()
      .set({ sesionId: parseInt(sesionId) })
      .where("id IN (:...ids)", { ids })
      .execute();

    return [result, null];
  } catch (err) {
    return [null, err.message];
  }
}
