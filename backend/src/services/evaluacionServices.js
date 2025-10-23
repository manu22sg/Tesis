import { AppDataSource } from '../config/config.db.js';
import EvaluacionSchema from '../entity/Evaluacion.js';
import JugadorSchema from '../entity/Jugador.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';

export async function crearEvaluacion(data) {
  try {
    const repo = AppDataSource.getRepository(EvaluacionSchema);
    const jugadorRepo = AppDataSource.getRepository(JugadorSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    const jugador = await jugadorRepo.findOne({ where: { id: data.jugadorId } });
    if (!jugador) return [null, 'Jugador no encontrado'];

    const sesion = await sesionRepo.findOne({ where: { id: data.sesionId } });
    if (!sesion) return [null, 'Sesión no encontrada'];

    const nuevo = repo.create(data);
    const saved = await repo.save(nuevo);
    const completo = await repo.findOne({
      where: { id: saved.id },
      relations: ['jugador', 'sesion'],
    });
    return [completo, null];
  } catch (e) {
    console.error('Error creando evaluación:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function obtenerEvaluaciones({ page = 1, limit = 10, jugadorId, sesionId, desde, hasta, q }) {
  try {
    const repo = AppDataSource.getRepository(EvaluacionSchema);
    const qb = repo.createQueryBuilder('e')
      .leftJoinAndSelect('e.jugador', 'jugador')
      .leftJoinAndSelect('jugador.usuario', 'usuario')  // 🔥 JOIN con usuario para obtener nombre
      .leftJoinAndSelect('e.sesion', 'sesion')
      .orderBy('e.fechaRegistro', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // 🔍 Búsqueda por nombre de jugador
    if (q) {
      const busqueda = q.trim().toLowerCase();
      qb.andWhere('LOWER(usuario.nombre) LIKE :q', { q: `%${busqueda}%` });
    }

    if (jugadorId) qb.andWhere('e.jugadorId = :jugadorId', { jugadorId });
    if (sesionId) qb.andWhere('e.sesionId = :sesionId', { sesionId });
    
    // Filtros de fecha
    if (desde) {
      qb.andWhere('sesion.fecha >= :desde', { desde });
    }
    if (hasta) {
      qb.andWhere('sesion.fecha <= :hasta', { hasta });
    }

    const [evaluaciones, totalItems] = await qb.getManyAndCount();
    
    // Estructura de paginación estandarizada
    return [{
      evaluaciones,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    }, null];
  } catch (e) {
    console.error('Error listando evaluaciones:', e);
    return [null, 'Error interno del servidor'];
  }
}



export async function obtenerEvaluacionPorId(id) {
  try {
    const repo = AppDataSource.getRepository(EvaluacionSchema);
    const row = await repo.findOne({ where: { id }, relations:['jugador','sesion'] });
    if (!row) return [null,'Evaluación no encontrada'];
    return [row, null];
  } catch (e) {
    console.error('Error obteniendo evaluación:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function actualizarEvaluacion(id, data) {
  try {
    const repo = AppDataSource.getRepository(EvaluacionSchema);
    const row = await repo.findOne({ where: { id } });
    if (!row) return [null,'Evaluación no encontrada'];

    Object.assign(row, data);
    const saved = await repo.save(row);

    const completo = await repo.findOne({
      where: { id: saved.id },
      relations: ['jugador', 'sesion'],
    });

    return [completo, null];
  } catch (e) {
    console.error('Error actualizando evaluación:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function eliminarEvaluacion(id) {
  try {
    const repo = AppDataSource.getRepository(EvaluacionSchema);
    const row = await repo.findOne({ where: { id } });
    if (!row) return [null,'Evaluación no encontrada'];
    await repo.remove(row);
    return [true, null];
  } catch (e) {
    console.error('Error eliminando evaluación:', e);
    return [null, 'Error interno del servidor'];
  }
}
