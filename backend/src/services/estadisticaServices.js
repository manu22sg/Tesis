import { AppDataSource } from '../config/config.db.js';
import EstadisticaBasicaSchema from '../entity/EstadisticaBasica.js';
import JugadorSchema from '../entity/Jugador.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';

export async function upsertEstadistica(payload) {
  try {
    const repo = AppDataSource.getRepository(EstadisticaBasicaSchema);
    const jugRepo = AppDataSource.getRepository(JugadorSchema);
    const sesRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    const { jugadorId, sesionId } = payload;

    const jug = await jugRepo.findOne({ where: { id: jugadorId } });
    if (!jug) return [null, 'Jugador no encontrado'];

    const ses = await sesRepo.findOne({ where: { id: sesionId } });
    if (!ses) return [null, 'Sesión no encontrada'];

    let row = await repo.findOne({ where: { jugadorId, sesionId } });
    if (!row) {
      row = repo.create(payload);
    } else {
      Object.assign(row, payload);
    }
    const saved = await repo.save(row);

    const completa = await repo.findOne({
      where: { id: saved.id },
      relations: ['jugador', 'jugador.usuario', 'sesion']
    });
    return [completa, null];
  } catch (e) {
    console.error('upsertEstadistica:', e);
    return [null, 'Error interno del servidor'];
  }
}
export async function obtenerEstadisticasPorJugador({ jugadorId, page=1, limit=50, busqueda='', sesionId=null }) {
  try {
    const repo = AppDataSource.getRepository(EstadisticaBasicaSchema);
    const skip = (page-1)*limit;
    
    let queryBuilder = repo.createQueryBuilder('estadistica')
      .leftJoinAndSelect('estadistica.sesion', 'sesion')
      .leftJoinAndSelect('estadistica.jugador', 'jugador')
      .where('estadistica.jugadorId = :jugadorId', { jugadorId });

    // ✅ Filtrar por sesión específica si se proporciona
    if (sesionId) {
      queryBuilder = queryBuilder.andWhere('estadistica.sesionId = :sesionId', { sesionId });
    }

    // Búsqueda por nombre de sesión
    if (busqueda && busqueda.trim()) {
      queryBuilder = queryBuilder.andWhere(
        '(LOWER(sesion.nombre) LIKE LOWER(:busqueda) OR ' +
        'LOWER(sesion.tipoSesion) LIKE LOWER(:busqueda))',
        { busqueda: `%${busqueda.trim()}%` }
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('estadistica.fechaRegistro', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return [{ estadisticas: items, total, page, totalPaginas: Math.ceil(total/limit) }, null];
  } catch (e) {
    console.error('obtenerEstadisticasPorJugador:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function obtenerEstadisticasPorSesion({ sesionId, page=1, limit=50, busqueda='', jugadorId=null }) {
  try {
    const repo = AppDataSource.getRepository(EstadisticaBasicaSchema);
    const skip = (page-1)*limit;
    
    let queryBuilder = repo.createQueryBuilder('estadistica')
      .leftJoinAndSelect('estadistica.jugador', 'jugador')
      .leftJoinAndSelect('jugador.usuario', 'usuario')
      .leftJoinAndSelect('estadistica.sesion', 'sesion')
      .where('estadistica.sesionId = :sesionId', { sesionId });

    // ✅ Filtrar por jugador específico si se proporciona
    if (jugadorId) {
      queryBuilder = queryBuilder.andWhere('estadistica.jugadorId = :jugadorId', { jugadorId });
    }

    // Búsqueda por nombre de jugador o RUT
    if (busqueda && busqueda.trim()) {
      queryBuilder = queryBuilder.andWhere(
        '(LOWER(usuario.nombre) LIKE LOWER(:busqueda) OR ' +
        'LOWER(usuario.apellido) LIKE LOWER(:busqueda) OR ' +
        'LOWER(usuario.rut) LIKE LOWER(:busqueda))',
        { busqueda: `%${busqueda.trim()}%` }
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('estadistica.goles', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return [{ estadisticas: items, total, page, totalPaginas: Math.ceil(total/limit) }, null];
  } catch (e) {
    console.error('obtenerEstadisticasPorSesion:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function obtenerEstadisticaPorId(id) {
  try {
    const repo = AppDataSource.getRepository(EstadisticaBasicaSchema);
    const row = await repo.findOne({
      where: { id },
      relations: ['jugador','jugador.usuario','sesion']
    });
    if (!row) return [null, 'Estadística no encontrada'];
    return [row, null];
  } catch (e) {
    console.error('obtenerEstadisticaPorId:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function eliminarEstadistica(id) {
  try {
    const repo = AppDataSource.getRepository(EstadisticaBasicaSchema);
    const row = await repo.findOne({ where: { id } });
    if (!row) return [null, 'Estadística no encontrada'];
    await repo.remove(row);
    return [true, null];
  } catch (e) {
    console.error('eliminarEstadistica:', e);
    return [null, 'Error interno del servidor'];
  }
}
