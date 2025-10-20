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

export async function obtenerEvaluaciones({ pagina=1, limite=10, jugadorId, sesionId }) {
  try {
    const repo = AppDataSource.getRepository(EvaluacionSchema);
    const qb = repo.createQueryBuilder('e')
      .leftJoinAndSelect('e.jugador','jugador')
      .leftJoinAndSelect('e.sesion','sesion')
      .orderBy('e.fechaRegistro','DESC')
      .skip((pagina-1)*limite)
      .take(limite);

    if (jugadorId) qb.andWhere('e.jugadorId = :jugadorId', { jugadorId });
    if (sesionId) qb.andWhere('e.sesionId = :sesionId', { sesionId });

    const [rows, total] = await qb.getManyAndCount();
    return [{ evaluaciones: rows, total, pagina, totalPaginas: Math.ceil(total/limite) }, null];
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
