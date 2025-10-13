import {crearJugador, obtenerTodosJugadores, obtenerJugadorPorId, actualizarJugador, eliminarJugador, asignarJugadorAGrupo, removerJugadorDeGrupo} from '../services/jugadorServices.js';
import { success, error, notFound, conflict } from '../utils/responseHandler.js';

export async function crearJugadorController(req, res) {
  try {
    const [jugador, err] = await crearJugador(req.body);
    
    if (err) {
      if (err.includes("ya existe")) {
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
    const { pagina = 1, limite = 10, estado, carrera, anioIngreso } = req.query;
    const filtros = { estado, carrera, anioIngreso };
    
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
