import { 
  crearEntrenamiento,
  obtenerEntrenamientos,
  obtenerEntrenamientoPorId,
  actualizarEntrenamiento,
  eliminarEntrenamiento,
  crearEntrenamientosRecurrentes
} from '../services/entrenamientoServices.js';
import { success, error, notFound, conflict } from '../utils/responseHandler.js';

/**
 * POST /api/entrenamientos - Crear nuevo entrenamiento
 */
export async function postCrearEntrenamiento(req, res) {
  try {
    const datosEntrenamiento = req.body;

    const [entrenamiento, err] = await crearEntrenamiento(datosEntrenamiento);

    if (err) {
      if (err.includes('no encontrada') || err.includes('no disponible')) {
        return error(res, err, 400);
      }

      if (err.includes('Ya existe') || err.includes('Hay una reserva')) {
        return conflict(res, err);
      }

      return error(res, err, 500);
    }

    return success(res, entrenamiento, 'Entrenamiento creado exitosamente', 201);

  } catch (e) {
    console.error('postCrearEntrenamiento:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * GET /api/entrenamientos - Obtener entrenamientos con filtros
 */
export async function getEntrenamientos(req, res) {
  try {
    const filtros = req.body;

    const [result, err] = await obtenerEntrenamientos(filtros);

    if (err) {
      return error(res, err, 500);
    }

    const { entrenamientos, pagination } = result;

    const mensaje = entrenamientos.length > 0 ? 
      `${entrenamientos.length} entrenamiento(s) encontrado(s) - Página ${pagination.currentPage} de ${pagination.totalPages}` : 
      'No se encontraron entrenamientos';

    return success(res, { entrenamientos, pagination }, mensaje);

  } catch (e) {
    console.error('getEntrenamientos:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * POST /api/entrenamientos/detalle - Obtener entrenamiento por ID
 */
export async function getEntrenamientoPorId(req, res) {
  try {
    const { id } = req.body;

    const [entrenamiento, err] = await obtenerEntrenamientoPorId(id);

    if (err) {
      if (err === 'Entrenamiento no encontrado') {
        return notFound(res, err);
      }
      return error(res, err, 500);
    }

    return success(res, entrenamiento, 'Entrenamiento encontrado');

  } catch (e) {
    console.error('getEntrenamientoPorId:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * PATCH /api/entrenamientos - Actualizar entrenamiento
 */
export async function patchActualizarEntrenamiento(req, res) {
  try {
    const { id, ...datosActualizacion } = req.body;

    const [entrenamiento, err] = await actualizarEntrenamiento(id, datosActualizacion);

    if (err) {
      if (err === 'Entrenamiento no encontrado') {
        return notFound(res, err);
      }

      if (err.includes('Conflicto')) {
        return conflict(res, err);
      }

      return error(res, err, 500);
    }

    return success(res, entrenamiento, 'Entrenamiento actualizado exitosamente');

  } catch (e) {
    console.error('patchActualizarEntrenamiento:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * DELETE /api/entrenamientos/eliminar - Eliminar entrenamiento
 */
export async function deleteEntrenamiento(req, res) {
  try {
    const { id } = req.body;

    const [resultado, err] = await eliminarEntrenamiento(id);

    if (err) {
      if (err === 'Entrenamiento no encontrado') {
        return notFound(res, err);
      }
      return error(res, err, 500);
    }

    return success(res, resultado, 'Entrenamiento eliminado exitosamente');

  } catch (e) {
    console.error('deleteEntrenamiento:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * POST /api/entrenamientos/recurrente - Crear entrenamientos recurrentes
 */
export async function postCrearEntrenamientosRecurrentes(req, res) {
  try {
    const datosRecurrentes = req.body;

    const [resultado, err] = await crearEntrenamientosRecurrentes(datosRecurrentes);

    if (err) {
      return error(res, err, 500);
    }

    const { entrenamientosCreados, entrenamientos, errores } = resultado;

    let mensaje = `${entrenamientosCreados} entrenamiento(s) creado(s) exitosamente`;
    if (errores && errores.length > 0) {
      mensaje += `. ${errores.length} fecha(s) tuvieron conflictos`;
    }

    return success(res, resultado, mensaje, 201);

  } catch (e) {
    console.error('postCrearEntrenamientosRecurrentes:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}