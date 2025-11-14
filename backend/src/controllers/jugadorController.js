import {
  crearJugador,
  obtenerTodosJugadores,
  obtenerJugadorPorId,
  actualizarJugador,
  eliminarJugador,
  asignarJugadorAGrupo,
  removerJugadorDeGrupo,
  obtenerEstadisticasPorCarrera
} from '../services/jugadorServices.js';
import { success, error, notFound, conflict } from '../utils/responseHandler.js';

export async function crearJugadorController(req, res) {
  try {
    const [jugador, err] = await crearJugador(req.body);
    
    if (err) {
      if (err.includes("ya existe") || err.includes("ya está registrado")) {
        return conflict(res, err);
      }
      return error(res, err, 400);
    }

    return success(res, jugador, "Jugador creado correctamente", 201);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function obtenerTodosJugadoresController(req, res) {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      estado, 
      carreraId,        // Filtro por ID de carrera (recomendado)
      carreraNombre,    // Filtro por nombre de carrera
      anioIngreso, 
      q,
      grupoId,
      posicion,         // Filtro por posición
      piernaHabil       // Filtro por pierna hábil
    } = req.query;

    const filtros = {};
    
    // Filtros básicos
    if (estado) filtros.estado = estado;
    if (q) filtros.q = q;
    if (anioIngreso) filtros.anioIngreso = parseInt(anioIngreso);
    if (grupoId) filtros.grupoId = parseInt(grupoId);
    
    // Filtros de carrera (usar carreraId preferentemente)
    if (carreraId) {
      filtros.carreraId = parseInt(carreraId);
    } else if (carreraNombre) {
      filtros.carreraNombre = carreraNombre;
    }
    
    // Filtros adicionales
    if (posicion) filtros.posicion = posicion;
    if (piernaHabil) filtros.piernaHabil = piernaHabil;

    const [resultado, err] = await obtenerTodosJugadores(
      parseInt(pagina),
      parseInt(limite),
      filtros
    );

    if (err) {
      return error(res, err);
    }

    return success(res, resultado, "Jugadores obtenidos correctamente");
  } catch (err) {
    console.error("Error en obtenerTodosJugadoresController:", err);
    return error(res, err.message);
  }
}

export async function obtenerJugadorPorIdController(req, res) {
  try {
    const [jugador, err] = await obtenerJugadorPorId(req.params.id);
    
    if (err) {
      if (err.includes("no encontrado")) {
        return notFound(res, err);
      }
      return error(res, err);
    }

    return success(res, jugador, "Jugador obtenido correctamente");
  } catch (err) {
    return error(res, err.message);
  }
}

export async function actualizarJugadorController(req, res) {
  try {
    const [jugador, err] = await actualizarJugador(req.params.id, req.body);
    
    if (err) {
      if (err.includes("no encontrado")) {
        return notFound(res, err);
      }
      return error(res, err, 400);
    }

    return success(res, jugador, "Jugador actualizado correctamente");
  } catch (err) {
    return error(res, err.message);
  }
}

export async function eliminarJugadorController(req, res) {
  try {
    const [mensaje, err] = await eliminarJugador(req.params.id);
    
    if (err) {
      if (err.includes("no encontrado")) {
        return notFound(res, err);
      }
      return error(res, err);
    }

    return success(res, null, mensaje);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function asignarJugadorAGrupoController(req, res) {
  try {
    const { id: jugadorId, grupoId } = req.params;
    const [resultado, err] = await asignarJugadorAGrupo(jugadorId, grupoId);
    
    if (err) {
      if (err.includes("ya está asignado")) {
        return conflict(res, err);
      }
      if (err.includes("no encontrado")) {
        return notFound(res, err);
      }
      return error(res, err, 400);
    }

    return success(res, resultado, "Jugador asignado al grupo correctamente", 201);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function removerJugadorDeGrupoController(req, res) {
  try {
    const { id: jugadorId, grupoId } = req.params;
    const [mensaje, err] = await removerJugadorDeGrupo(jugadorId, grupoId);
    
    if (err) {
      if (err.includes("no está asignado") || err.includes("no encontrado")) {
        return notFound(res, err);
      }
      return error(res, err, 400);
    }

    return success(res, null, mensaje);
  } catch (err) {
    return error(res, err.message);
  }
}

// Nuevo endpoint: Estadísticas por carrera
export async function obtenerEstadisticasPorCarreraController(req, res) {
  try {
    const [estadisticas, err] = await obtenerEstadisticasPorCarrera();
    
    if (err) {
      return error(res, err);
    }

    return success(res, estadisticas, "Estadísticas obtenidas correctamente");
  } catch (err) {
    console.error("Error en obtenerEstadisticasPorCarreraController:", err);
    return error(res, err.message);
  }
}