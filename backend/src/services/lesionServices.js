import { AppDataSource } from '../config/config.db.js';
import LesionSchema from '../entity/Lesion.js';
import JugadorSchema from '../entity/Jugador.js';
import dayjs from 'dayjs';

// 🔥 Helper para actualizar estado del jugador según lesiones activas
async function actualizarEstadoJugador(jugadorId) {
  try {
    const jugadorRepo = AppDataSource.getRepository(JugadorSchema);
    const lesionRepo = AppDataSource.getRepository(LesionSchema);

    const jugador = await jugadorRepo.findOne({ where: { id: jugadorId } });
    if (!jugador) return;

    const hoy = dayjs().format('YYYY-MM-DD');

    // Buscar si tiene alguna lesión activa
    // Una lesión está activa si:
    // - Ya comenzó (fechaInicio <= hoy)
    // - Y aún no tiene alta real, O el alta real es futura
    const lesionActiva = await lesionRepo
      .createQueryBuilder('l')
      .where('l.jugadorId = :jugadorId', { jugadorId })
      .andWhere('l.fechaInicio <= :hoy', { hoy })
      .andWhere('(l.fechaAltaReal IS NULL OR l.fechaAltaReal > :hoy)', { hoy })
      .getOne();

    // Actualizar estado del jugador
    if (lesionActiva) {
      // Si tiene lesión activa, marcar como lesionado
      if (jugador.estado !== 'lesionado') {
        jugador.estado = 'lesionado';
        await jugadorRepo.save(jugador);
        console.log(`✅ Jugador ${jugadorId} marcado como lesionado`);
      }
    } else {
      // Si no tiene lesión activa y estaba lesionado, volver a activo
      if (jugador.estado === 'lesionado') {
        jugador.estado = 'activo';
        await jugadorRepo.save(jugador);
        console.log(`✅ Jugador ${jugadorId} recuperado de lesión`);
      }
    }
  } catch (e) {
    console.error('Error actualizando estado jugador:', e);
  }
}

export async function crearLesion(data) {
  try {
    const repo = AppDataSource.getRepository(LesionSchema);
    const jugadorRepo = AppDataSource.getRepository(JugadorSchema);

    const jugador = await jugadorRepo.findOne({ where: { id: data.jugadorId } });
    if (!jugador) return [null, 'Jugador no encontrado'];

    const lesion = repo.create(data);
    const saved = await repo.save(lesion);

    // 🔥 Actualizar estado del jugador
    await actualizarEstadoJugador(data.jugadorId);

    const completo = await repo.findOne({ 
      where: { id: saved.id }, 
      relations: ['jugador', 'jugador.usuario'] 
    });
    
    return [completo, null];
  } catch (e) {
    console.error('Error creando lesión:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function obtenerLesiones({ pagina=1, limite=10, jugadorId, desde, hasta, q }) {
  try {
    const repo = AppDataSource.getRepository(LesionSchema);

    const page = Math.max(parseInt(pagina, 10) || 1, 1);
    const size = Math.min(Math.max(parseInt(limite, 10) || 10, 1), 100);

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
      qb.andWhere(`
        (l.diagnostico ILIKE :term
         OR usuario.nombre ILIKE :term
         OR usuario.rut ILIKE :term)
      `, { term });
    }

    const [rows, total] = await qb.getManyAndCount();
    return [{ 
      lesiones: rows, 
      total, 
      pagina: page, 
      totalPaginas: Math.ceil(total/size) 
    }, null];
  } catch (e) {
    console.error('Error listando lesiones:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function obtenerLesionPorId(id) {
  try {
    const repo = AppDataSource.getRepository(LesionSchema);
    const row = await repo.findOne({ 
      where: { id }, 
      relations: ['jugador', 'jugador.usuario'] 
    });
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
    
    const jugadorId = row.jugadorId;
    
    Object.assign(row, data);
    const saved = await repo.save(row);

    // 🔥 Actualizar estado del jugador
    await actualizarEstadoJugador(jugadorId);

    const completo = await repo.findOne({ 
      where: { id: saved.id }, 
      relations: ['jugador', 'jugador.usuario'] 
    });
    
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
    
    const jugadorId = row.jugadorId;
    
    await repo.remove(row);

    // 🔥 Actualizar estado del jugador después de eliminar
    await actualizarEstadoJugador(jugadorId);

    return [true, null];
  } catch (e) {
    console.error('Error eliminando lesión:', e);
    return [null, 'Error interno del servidor'];
  }
}