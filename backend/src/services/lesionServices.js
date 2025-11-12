import { AppDataSource } from '../config/config.db.js';
import LesionSchema from '../entity/Lesion.js';
import JugadorSchema from '../entity/Jugador.js';

export async function crearLesion(data) {
  try {
    const repo = AppDataSource.getRepository(LesionSchema);
    const jugadorRepo = AppDataSource.getRepository(JugadorSchema);

    const jugador = await jugadorRepo.findOne({ where: { id: data.jugadorId } });
    if (!jugador) return [null, 'Jugador no encontrado'];

    const lesion = repo.create(data);
    const saved = await repo.save(lesion);
    const completo = await repo.findOne({ where:{ id:saved.id }, relations:['jugador'] });
    return [completo, null];
  } catch (e) {
    console.error('Error creando lesión:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function obtenerLesiones({ pagina=1, limite=10, jugadorId, desde, hasta, q }) {
  try {
    const repo = AppDataSource.getRepository(LesionSchema);

    // ⚠️ Convierte params (vienen como string desde req.query)
    const page = Math.max(parseInt(pagina, 10) || 1, 1);
    const size = Math.min(Math.max(parseInt(limite, 10) || 10, 1), 100); // cap 100

    const qb = repo.createQueryBuilder('l')
      .leftJoinAndSelect('l.jugador','jugador')
      .leftJoinAndSelect('jugador.usuario','usuario')
      .orderBy('l.fechaInicio','DESC')
      .skip((page-1)*size)
      .take(size);

    if (jugadorId) qb.andWhere('l.jugadorId = :jugadorId', { jugadorId: Number(jugadorId) });
    if (desde) qb.andWhere('l.fechaInicio >= :desde', { desde });
    if (hasta) qb.andWhere('l.fechaInicio <= :hasta', { hasta });

    if (q && String(q).trim() !== '') {
      const term = `%${q.trim()}%`;
      // Postgres: ILIKE; si usas otro, cambia a LOWER(...)
      qb.andWhere(`
        (l.diagnostico ILIKE :term
         OR usuario.nombre ILIKE :term
         OR usuario.rut ILIKE :term)
      `, { term });
    }

    const [rows, total] = await qb.getManyAndCount();
    return [{ lesiones: rows, total, pagina: page, totalPaginas: Math.ceil(total/size) }, null];
  } catch (e) {
    console.error('Error listando lesiones:', e);
    return [null, 'Error interno del servidor'];
  }
}


export async function obtenerLesionPorId(id) {
  try {
    const repo = AppDataSource.getRepository(LesionSchema);
    const row = await repo.findOne({ where: { id }, relations:['jugador'] });
    if (!row) return [null,'Lesión no encontrada'];
    return [row, null];
  } catch (e) {
    console.error('Error obteniendo lesión:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function actualizarLesion(id, data) {
  try {
    const repo = AppDataSource.getRepository(LesionSchema);
    const row = await repo.findOne({ where: { id } });
    if (!row) return [null,'Lesión no encontrada'];
    Object.assign(row, data);
    const saved = await repo.save(row);
    const completo = await repo.findOne({ where:{ id:saved.id }, relations:['jugador'] });
    return [completo, null];
  } catch (e) {
    console.error('Error actualizando lesión:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function eliminarLesion(id) {
  try {
    const repo = AppDataSource.getRepository(LesionSchema);
    const row = await repo.findOne({ where: { id } });
    if (!row) return [null,'Lesión no encontrada'];
    await repo.remove(row);
    return [true, null];
  } catch (e) {
    console.error('Error eliminando lesión:', e);
    return [null, 'Error interno del servidor'];
  }
}
