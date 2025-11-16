import { AppDataSource } from '../config/config.db.js';
import AlineacionSchema from '../entity/Alineacion.js';
import AlineacionJugadorSchema from '../entity/AlineacionJugador.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';
import JugadorSchema from '../entity/Jugador.js';

export async function crearAlineacion({ sesionId, generadaAuto = false, jugadores = [] }) {
  try {
    const alinRepo = AppDataSource.getRepository(AlineacionSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const jugRepo = AppDataSource.getRepository(JugadorSchema);
    const alinJugRepo = AppDataSource.getRepository(AlineacionJugadorSchema);

    const sesion = await sesionRepo.findOne({ where: { id: sesionId } });
    if (!sesion) return [null, 'Sesión no encontrada'];

    // si usas único por sesión:
    const ya = await alinRepo.findOne({ where: { sesionId } });
    if (ya) return [null, 'Ya existe una alineación para esta sesión'];

    const alineacion = alinRepo.create({ sesionId, generadaAuto });
    const alineacionGuardada = await alinRepo.save(alineacion);

    // jugadores iniciales (opcional)
    if (Array.isArray(jugadores) && jugadores.length) {
      // validar existencias de jugadores
      const ids = jugadores.map(j => j.jugadorId);
      const existentes = await jugRepo.findBy({ id: ids.length ? ids : [-1] });
      const setExist = new Set(existentes.map(j => j.id));
      const faltantes = ids.filter(id => !setExist.has(id));
      if (faltantes.length) return [null, `Jugador(es) inexistente(s): ${faltantes.join(', ')}`];

      const filas = jugadores.map(j => alinJugRepo.create({
        alineacionId: alineacionGuardada.id,
        jugadorId: j.jugadorId,
        posicion: j.posicion,
        orden: j.orden ?? null,
        comentario: j.comentario ?? null,
      }));
      await alinJugRepo.save(filas);
    }

    const completa = await alinRepo.findOne({
      where: { id: alineacionGuardada.id },
      relations: ['sesion', 'jugadores', 'jugadores.jugador', 'jugadores.jugador.usuario'],
    });
    return [completa, null];
  } catch (e) {
    console.error('crearAlineacion:', e);
    // manejar violación de único
    if (e?.code === '23505') return [null, 'No se puede repetir jugador en la misma alineación o ya existe una alineación para esta sesión'];
    return [null, 'Error interno del servidor'];
  }
}

export async function obtenerAlineacionPorSesion(sesionId) {
  try {
    const repo = AppDataSource.getRepository(AlineacionSchema);
    const alineacion = await repo.findOne({
      where: { sesionId },
      relations: [
        'sesion', 
        'sesion.grupo',      
        'sesion.cancha',     
        'jugadores', 
        'jugadores.jugador', 
        'jugadores.jugador.usuario'
      ],
      order: { jugadores: { orden: 'ASC' } },
    });
    if (!alineacion) return [null, 'Alineación no encontrada para la sesión'];
    return [alineacion, null];
  } catch (e) {
    console.error('obtenerAlineacionPorSesion:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function agregarJugadorAlineacion({ 
  alineacionId, 
  jugadorId, 
  posicion, 
  orden, 
  comentario,
  posicionX,
  posicionY 
}) {
  try {
    const alinRepo = AppDataSource.getRepository(AlineacionSchema);
    const jugRepo  = AppDataSource.getRepository(JugadorSchema);
    const ajRepo   = AppDataSource.getRepository(AlineacionJugadorSchema);

    const alin = await alinRepo.findOne({ where: { id: alineacionId } });
    if (!alin) return [null, 'Alineación no encontrada'];
    const jug = await jugRepo.findOne({ where: { id: jugadorId } });
    if (!jug) return [null, 'Jugador no encontrado'];

    const fila = ajRepo.create({
      alineacionId, 
      jugadorId, 
      posicion,
      orden: orden ?? null,
      comentario: comentario ?? null,
      posicionX: posicionX ?? null,
      posicionY: posicionY ?? null,
    });
    const guardada = await ajRepo.save(fila);
    return [guardada, null];
  } catch (e) {
    console.error('agregarJugadorAlineacion:', e);
    if (e?.code === '23505') return [null, 'El jugador ya está en la alineación'];
    return [null, 'Error interno del servidor'];
  }
}


export async function actualizarAlineacionJugador({ 
  alineacionId, 
  jugadorId, 
  posicion, 
  orden, 
  comentario,
  posicionX,
  posicionY 
}) {
  try {
    const ajRepo = AppDataSource.getRepository(AlineacionJugadorSchema);
    const fila = await ajRepo.findOne({ where: { alineacionId, jugadorId } });
    if (!fila) return [null, 'Registro de alineación/jugador no encontrado'];

    if (posicion !== undefined)  fila.posicion = posicion;
    if (orden !== undefined)     fila.orden = orden;
    if (comentario !== undefined) fila.comentario = comentario;
    if (posicionX !== undefined) fila.posicionX = posicionX;
    if (posicionY !== undefined) fila.posicionY = posicionY;

    const up = await ajRepo.save(fila);
    return [up, null];
  } catch (e) {
    console.error('actualizarAlineacionJugador:', e);
    return [null, 'Error interno del servidor'];
  }
}


export async function quitarJugadorDeAlineacion(alineacionId, jugadorId) {
  try {
    const ajRepo = AppDataSource.getRepository(AlineacionJugadorSchema);
    const fila = await ajRepo.findOne({ where: { alineacionId, jugadorId } });

    if (!fila) return [null, 'Registro de alineación/jugador no encontrado'];
    await ajRepo.remove(fila);
    return [true, null];
  } catch (e) {
    console.error('quitarJugadorDeAlineacion:', e);
    return [null, 'Error interno del servidor'];
  }
}

export async function eliminarAlineacion(id) {
  try {
    const repo = AppDataSource.getRepository(AlineacionSchema);
    const alineacion = await repo.findOne({ where: { id } });
    if (!alineacion) return [null, 'Alineación no encontrada'];
    await repo.remove(alineacion);
    return [true, null];
  } catch (e) {
    console.error('eliminarAlineacion:', e);
    return [null, 'Error interno del servidor'];
  }
}


export async function actualizarPosicionesJugadores(alineacionId, jugadores) {
  try {
    const ajRepo = AppDataSource.getRepository(AlineacionJugadorSchema);
    
    // Actualizar cada jugador
    for (const jugador of jugadores) {
      const fila = await ajRepo.findOne({ 
        where: { 
          alineacionId, 
          jugadorId: jugador.jugadorId 
        } 
      });
      
      if (fila) {
        fila.posicionX = jugador.x;
        fila.posicionY = jugador.y;
        await ajRepo.save(fila);
      }
    }
    
    // Retornar la alineación actualizada con todas las relaciones
    const alinRepo = AppDataSource.getRepository(AlineacionSchema);
    const completa = await alinRepo.findOne({
      where: { id: alineacionId },
      relations: ['sesion', 'jugadores', 'jugadores.jugador', 'jugadores.jugador.usuario'],
    });
    
    return [completa, null];
  } catch (e) {
    console.error('actualizarPosicionesJugadores:', e);
    return [null, 'Error interno del servidor'];
  }
}
