import {
  crearSesion,
  obtenerSesiones,
  obtenerSesionPorId,
  actualizarSesion,
  eliminarSesion,
  crearSesionesRecurrentes
} from '../services/sesionServices.js';
import { success, error, notFound, conflict } from '../utils/responseHandler.js';

/** POST /api/sesiones */
export async function postCrearSesion(req, res) {
  try {
    const [sesion, err] = await crearSesion(req.body);
    if (err) {
      if (err.includes('Grupo no encontrado')) return error(res, err, 400);
      if (err.includes('Ya existe') || err.includes('Conflicto')) return conflict(res, err);
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
    const [result, err] = await obtenerSesiones(req.body);
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

/** POST /api/sesiones/detalle */
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

/** PATCH /api/sesiones */
export async function patchActualizarSesion(req, res) {
  try {
    const { id, ...rest } = req.body;
    const [sesion, err] = await actualizarSesion(id, rest);
    if (err) {
      if (err === 'Sesión no encontrada') return notFound(res, err);
      if (err.includes('Conflicto') || err.includes('Grupo no encontrado')) return conflict(res, err);
      return error(res, err, 500);
    }
    return success(res, sesion, 'Sesión actualizada exitosamente');
  } catch (e) {
    console.error('patchActualizarSesion:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/** DELETE /api/sesiones/eliminar */
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

/** POST /api/sesiones/recurrente */
export async function postSesionesRecurrentes(req, res) {
  try {
    const [resultado, err] = await crearSesionesRecurrentes(req.body);
    if (err) return error(res, err, 500);

    const { sesionesCreadas, errores } = resultado;
    let msg = `${sesionesCreadas} sesión(es) creada(s)`;
    if (errores) msg += `. ${errores.length} fecha(s) con conflicto`;
    return success(res, resultado, msg, 201);
  } catch (e) {
    console.error('postSesionesRecurrentes:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}
