import { AppDataSource } from '../config/config.db.js';
import AlineacionSchema from '../entity/Alineacion.js';
import AlineacionJugadorSchema from '../entity/AlineacionJugador.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';
import JugadorSchema from '../entity/Jugador.js';
import { 
  clasificarJugador, 
  separarTitularesSuplentes,
  validarTitular,
  obtenerEstadisticasAlineacion 
} from '../utils/alineacionUtils.js';

async function validarDorsalUnico(alineacionId, orden, jugadorIdExcluir = null) {
  if (!orden) return { valido: true };
  
  const ajRepo = AppDataSource.getRepository(AlineacionJugadorSchema);
  
  const query = ajRepo
    .createQueryBuilder('aj')
    .where('aj.alineacionId = :alineacionId', { alineacionId })
    .andWhere('aj.orden = :orden', { orden });
  
  // Si estamos editando, excluir el jugador actual
  if (jugadorIdExcluir) {
    query.andWhere('aj.jugadorId != :jugadorIdExcluir', { jugadorIdExcluir });
  }
  
  const existente = await query.getOne();
  
  if (existente) {
    return { 
      valido: false, 
      mensaje: `El dorsal #${orden} ya está asignado a otro jugador en esta alineación` 
    };
  }
  
  return { valido: true };
}


export async function crearAlineacion({ sesionId, generadaAuto = false, jugadores = [] }) {
  try {
    const alinRepo = AppDataSource.getRepository(AlineacionSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const jugRepo = AppDataSource.getRepository(JugadorSchema);
    const alinJugRepo = AppDataSource.getRepository(AlineacionJugadorSchema);

    const sesion = await sesionRepo.findOne({ where: { id: sesionId } });
    if (!sesion) return [null, 'Sesión no encontrada'];

    // Validar que no exista ya una alineación para esta sesión
    const ya = await alinRepo.findOne({ where: { sesionId } });
    if (ya) return [null, 'Ya existe una alineación para esta sesión'];

    const alineacion = alinRepo.create({ sesionId, generadaAuto });
    const alineacionGuardada = await alinRepo.save(alineacion);

    // Agregar jugadores iniciales (opcional)
    if (Array.isArray(jugadores) && jugadores.length) {
      const ids = jugadores.map(j => j.jugadorId);
      const existentes = await jugRepo.findBy({ id: ids.length ? ids : [-1] });
      const setExist = new Set(existentes.map(j => j.id));
      const faltantes = ids.filter(id => !setExist.has(id));


      const dorsales = jugadores
        .map(j => j.orden)
        .filter(o => o != null);
      
      const dorsalesSet = new Set();
      const duplicados = [];
      
      for (const dorsal of dorsales) {
        if (dorsalesSet.has(dorsal)) {
          duplicados.push(dorsal);
        } else {
          dorsalesSet.add(dorsal);
        }
      }
      
      if (duplicados.length > 0) {
        return [null, `Dorsales duplicados: ${[...new Set(duplicados)].join(', ')}`];
      }

      
      if (faltantes.length) {
        return [null, `Jugador(es) inexistente(s): ${faltantes.join(', ')}`];
      }

      // Validar que no haya más de 11 titulares
      const titulares = jugadores.filter(j => 
        (j.posicionX !== null && j.posicionY !== null) || (j.orden >= 1 && j.orden <= 11)
      );
      
      if (titulares.length > 11) {
        return [null, 'No puedes agregar más de 11 jugadores titulares'];
      }

      const filas = jugadores.map(j => alinJugRepo.create({
        alineacionId: alineacionGuardada.id,
        jugadorId: j.jugadorId,
        posicion: j.posicion,
        orden: j.orden ?? null,
        comentario: j.comentario ?? null,
        posicionX: j.posicionX ?? null,
        posicionY: j.posicionY ?? null,
      }));
      
      await alinJugRepo.save(filas);
    }

    const completa = await obtenerAlineacionCompleta(alineacionGuardada.id);
    return [completa, null];
  } catch (e) {
    console.error('crearAlineacion:', e);
    if (e?.code === '23505') {
      return [null, 'No se puede repetir jugador en la misma alineación'];
    }
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
    
    // Enriquecer con clasificación y estadísticas
    const jugadoresClasificados = alineacion.jugadores.map(j => ({
      ...j,
      tipo: clasificarJugador(j)
    }));
    
    const separados = separarTitularesSuplentes(alineacion.jugadores);
    const estadisticas = obtenerEstadisticasAlineacion(alineacion.jugadores);
    
    return [{
      ...alineacion,
      jugadores: jugadoresClasificados,
      titulares: separados.titulares,
      suplentes: separados.suplentes,
      sinDefinir: separados.sinDefinir,
      estadisticas
    }, null];
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
    const jugRepo = AppDataSource.getRepository(JugadorSchema);
    const ajRepo = AppDataSource.getRepository(AlineacionJugadorSchema);

    const alin = await alinRepo.findOne({ 
      where: { id: alineacionId },
      relations: ['jugadores']
    });
    if (!alin) return [null, 'Alineación no encontrada'];
    
    const jug = await jugRepo.findOne({ where: { id: jugadorId } });
    if (!jug) return [null, 'Jugador no encontrado'];

      const validacionDorsal = await validarDorsalUnico(alineacionId, orden);
    if (!validacionDorsal.valido) {
      return [null, validacionDorsal.mensaje];
    }

    // Validar si será titular
    const jugadorTemp = { posicionX, posicionY, orden };
    if (clasificarJugador(jugadorTemp) === 'titular') {
      const validacion = validarTitular(alin.jugadores, orden);
      if (!validacion.valido) {
        return [null, validacion.mensaje];
      }
    }

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
    
    // Agregar clasificación
    return [{
      ...guardada,
      tipo: clasificarJugador(guardada)
    }, null];
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
    const alinRepo = AppDataSource.getRepository(AlineacionSchema);
    
    const fila = await ajRepo.findOne({ where: { alineacionId, jugadorId } });
    if (!fila) return [null, 'Registro de alineación/jugador no encontrado'];

    if (orden !== undefined && orden !== fila.orden) {
      const validacionDorsal = await validarDorsalUnico(alineacionId, orden, jugadorId);
      if (!validacionDorsal.valido) {
        return [null, validacionDorsal.mensaje];
      }
    }


    // Si cambia a titular, validar
    const nuevosDatos = { 
      posicionX: posicionX !== undefined ? posicionX : fila.posicionX,
      posicionY: posicionY !== undefined ? posicionY : fila.posicionY,
      orden: orden !== undefined ? orden : fila.orden
    };
    
    const tipoActual = clasificarJugador(fila);
    const tipoNuevo = clasificarJugador(nuevosDatos);
    
    if (tipoActual !== 'titular' && tipoNuevo === 'titular') {
      const alin = await alinRepo.findOne({ 
        where: { id: alineacionId },
        relations: ['jugadores']
      });
      
      const validacion = validarTitular(alin.jugadores, nuevosDatos.orden);
      if (!validacion.valido) {
        return [null, validacion.mensaje];
      }
    }

    if (posicion !== undefined) fila.posicion = posicion;
    if (orden !== undefined) fila.orden = orden;
    if (comentario !== undefined) fila.comentario = comentario;
    if (posicionX !== undefined) fila.posicionX = posicionX;
    if (posicionY !== undefined) fila.posicionY = posicionY;

    const up = await ajRepo.save(fila);
    
    return [{
      ...up,
      tipo: clasificarJugador(up)
    }, null];
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
    const alinRepo = AppDataSource.getRepository(AlineacionSchema);
    
    // Obtener alineación actual para validar
    const alin = await alinRepo.findOne({ 
      where: { id: alineacionId },
      relations: ['jugadores']
    });
    
    if (!alin) return [null, 'Alineación no encontrada'];
    
    // Validar que no se exceda el límite de titulares
    const titularesNuevos = jugadores.filter(j => {
      const jugadorActual = alin.jugadores.find(aj => aj.jugadorId === j.jugadorId);
      return jugadorActual && (j.x !== null && j.y !== null);
    });
    
    if (titularesNuevos.length > 11) {
      return [null, 'No puedes tener más de 11 jugadores con posición en la cancha'];
    }
    
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
    
    // Retornar la alineación actualizada
    const completa = await obtenerAlineacionCompleta(alineacionId);
    return [completa, null];
  } catch (e) {
    console.error('actualizarPosicionesJugadores:', e);
    return [null, 'Error interno del servidor'];
  }
}

// Función auxiliar para obtener alineación completa con todas las relaciones
async function obtenerAlineacionCompleta(alineacionId) {
  const alinRepo = AppDataSource.getRepository(AlineacionSchema);
  const alineacion = await alinRepo.findOne({
    where: { id: alineacionId },
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
  
  if (!alineacion) return null;
  
  // Enriquecer con clasificación y estadísticas
  const jugadoresClasificados = alineacion.jugadores.map(j => ({
    ...j,
    tipo: clasificarJugador(j)
  }));
  
  const separados = separarTitularesSuplentes(alineacion.jugadores);
  const estadisticas = obtenerEstadisticasAlineacion(alineacion.jugadores);
  
  return {
    ...alineacion,
    jugadores: jugadoresClasificados,
    titulares: separados.titulares,
    suplentes: separados.suplentes,
    sinDefinir: separados.sinDefinir,
    estadisticas
  };
}