import {
  crearSesion,
  obtenerSesiones,
  obtenerSesionPorId,
  actualizarSesion,
  eliminarSesion,
  crearSesionesRecurrentes,
  obtenerSesionesPorEstudiante
} from '../services/sesionServices.js';
import { success, error, notFound, conflict } from '../utils/responseHandler.js';

export async function postCrearSesion(req, res) {
  try {
    const [sesion, err] = await crearSesion(req.body);
    if (err) {
      if (err.includes('Cancha no encontrada') || 
          err.includes('Grupo no encontrado') ||
          err.includes('Debe especificar una cancha o una ubicación externa')) {
        return error(res, err, 400);
      }
      if (err.includes('Ya existe') || 
          err.includes('Conflicto') || 
          err.includes('Hay una reserva') ||
          err.includes('partido de campeonato')) {
        return conflict(res, err);
      }
      return error(res, err, 500);
    }
    return success(res, sesion, 'Sesión creada exitosamente', 201);
  } catch (e) {
    console.error('postCrearSesion:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/** GET /api/sesiones */
export async function getSesiones(req, res) {
  try {
    const filtros = {
      q: req.query.q || '',
      fecha: req.query.fecha || null,
      canchaId: req.query.canchaId || null,
      grupoId: req.query.grupoId || null,
      tipoSesion: req.query.tipoSesion || null,
      horaInicio: req.query.horaInicio || null,
      horaFin: req.query.horaFin || null,
      page: req.query.page,
      limit: req.query.limit,
    };

    if (req.query.jugadorId) {
      filtros.jugadorId = parseInt(req.query.jugadorId);
    }

    const [result, err] = await obtenerSesiones(filtros);
    if (err) return error(res, err, 500);

    const { sesiones, pagination } = result;
    const msg = sesiones.length
      ? `${sesiones.length} sesión(es) — Página ${pagination.currentPage}/${pagination.totalPages}`
      : 'No se encontraron sesiones';

    return success(res, { sesiones, pagination }, msg);
  } catch (e) {
    console.error('getSesiones:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function getSesionPorId(req, res) {
  try {
    const { id } = req.body;
    const [sesion, err] = await obtenerSesionPorId(id);
    if (err) {
      if (err === 'Sesión no encontrada') return notFound(res, err);
      return error(res, err, 500);
    }
    return success(res, sesion, 'Sesión encontrada');
  } catch (e) {
    console.error('getSesionPorId:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function patchActualizarSesion(req, res) {
  try {
    const { id, ...rest } = req.body;
    const [sesion, err] = await actualizarSesion(id, rest);
    if (err) {
      if (err === 'Sesión no encontrada') return notFound(res, err);
      if (err.includes('Conflicto') || 
          err.includes('Grupo no encontrado') ||
          err.includes('partido de campeonato') ||
          err.includes('reserva') ||
          err.includes('Debe especificar una cancha o una ubicación externa') ||
          err.includes('No se puede cambiar el grupo')) {
        return conflict(res, err);
      }
      return error(res, err, 500);
    }
    return success(res, sesion, 'Sesión actualizada exitosamente');
  } catch (e) {
    console.error('patchActualizarSesion:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function deleteSesion(req, res) {
  try {
    const { id } = req.body;
    const [out, err] = await eliminarSesion(id);
    if (err) {
      if (err === 'Sesión no encontrada') return notFound(res, err);
      return error(res, err, 500);
    }
    return success(res, out, 'Sesión eliminada exitosamente');
  } catch (e) {
    console.error('deleteSesion:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function postSesionesRecurrentes(req, res) {
  try {
    const [resultado, err] = await crearSesionesRecurrentes(req.body);
    if (err) {
      if (err.includes('Debe especificar una cancha o una ubicación externa') ||
          err.includes('Grupo no encontrado') ||
          err.includes('Cancha no encontrada')) {
        return error(res, err, 400);
      }
      return error(res, err, 500);
    }

    const { sesionesCreadas, errores } = resultado;
    let msg = `${sesionesCreadas} sesión(es) creada(s)`;
    if (errores) msg += `. ${errores.length} fecha(s) con conflicto`;
    return success(res, resultado, msg, 201);
  } catch (e) {
    console.error('postSesionesRecurrentes:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function getSesionesPorEstudiante(req, res) {
  try {
    const usuarioId = req.user.id;
    const { page, limit } = req.query;

    const [result, err] = await obtenerSesionesPorEstudiante(usuarioId, { page, limit });

    if (err) return error(res, err, 400);

    const { sesiones, pagination } = result;
    const msg = sesiones.length
      ? `${sesiones.length} sesión(es) — Página ${pagination?.currentPage}/${pagination?.totalPages}`
      : 'No tienes sesiones registradas';

    return success(res, result, msg);
  } catch (e) {
    console.error('getSesionesPorEstudiante:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}