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

export async function obtenerEstadisticasPorJugador({ jugadorId, pagina=1, limite=50 }) {
  try {
    const repo = AppDataSource.getRepository(EstadisticaBasicaSchema);
    const skip = (pagina-1)*limite;
    const [items, total] = await repo.findAndCount({
      where: { jugadorId },
      relations: ['sesion'],
      order: { fechaRegistro: 'DESC' },
      skip, take: limite
    });
    return [{ estadisticas: items, total, pagina, totalPaginas: Math.ceil(total/limite) }, null];
  } catch (e) {
    console.error('obtenerEstadisticasPorJugador:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function obtenerEstadisticasPorSesion({ sesionId, pagina=1, limite=50 }) {
  try {
    const repo = AppDataSource.getRepository(EstadisticaBasicaSchema);
    const skip = (pagina-1)*limite;
    const [items, total] = await repo.findAndCount({
      where: { sesionId },
      relations: ['jugador','jugador.usuario'],
      order: { goles: 'DESC' }, // puedes ajustar el orden
      skip, take: limite
    });
    return [{ estadisticas: items, total, pagina, totalPaginas: Math.ceil(total/limite) }, null];
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
