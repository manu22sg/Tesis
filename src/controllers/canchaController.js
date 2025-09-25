// controllers/canchaController.js
import { 
  crearCancha, 
  obtenerCanchas, 
  obtenerCanchaPorId, 
  actualizarCancha, 
  eliminarCancha,
  reactivarCancha 
} from '../services/canchaServices.js';
import { success, error, notFound, conflict } from '../utils/responseHandler.js';

/**
 * POST /api/canchas - Crear nueva cancha
 */
export async function postCrearCancha(req, res) {
  try {
    const datosCancha = req.body;

    const [cancha, err] = await crearCancha(datosCancha);

    if (err) {
      if (err.includes('Ya existe una cancha')) {
        return conflict(res, err);
      }
      return error(res, err, 500);
    }

    return success(res, cancha, 'Cancha creada exitosamente', 201);

  } catch (e) {
    console.error('postCrearCancha:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * GET /api/canchas - Obtener todas las canchas
 */
export async function getCanchas(req, res) {
  try {
    const filtros = req.body; // Filtros y parámetros de paginación

    const [result, err] = await obtenerCanchas(filtros);

    if (err) {
      return error(res, err, 500);
    }

    const { canchas, pagination } = result;

    const mensaje = canchas.length > 0 ? 
      `${canchas.length} cancha(s) encontrada(s) - Página ${pagination.currentPage} de ${pagination.totalPages}` : 
      'No se encontraron canchas';

    return success(res, { canchas, pagination }, mensaje);

  } catch (e) {
    console.error('getCanchas:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}


/**
 * POST /api/canchas/detalle - Obtener cancha por ID
 */
export async function getCanchaPorId(req, res) {
  try {
    const { id } = req.body; // Cambio: ahora viene del body

    const [cancha, err] = await obtenerCanchaPorId(id);

    if (err) {
      if (err === 'Cancha no encontrada') {
        return notFound(res, err);
      }
      return error(res, err, 500);
    }

    return success(res, cancha, 'Cancha encontrada');

  } catch (e) {
    console.error('getCanchaPorId:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * PUT /api/canchas - Actualizar cancha
 */
export async function putActualizarCancha(req, res) {
  try {
    const { id, ...datosActualizacion } = req.body; 

    const [cancha, err] = await actualizarCancha(id, datosActualizacion);

    if (err) {
      if (err === 'Cancha no encontrada') {
        return notFound(res, err);
      }
      if (err.includes('Ya existe una cancha')) {
        return conflict(res, err);
      }
      return error(res, err, 500);
    }

    return success(res, cancha, 'Cancha actualizada exitosamente');

  } catch (e) {
    console.error('putActualizarCancha:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * DELETE /api/canchas/eliminar - Eliminar cancha
 */
export async function deleteCancha(req, res) {
  try {
    const { id } = req.body; // Cambio: ID viene del body

    const [cancha, err] = await eliminarCancha(id);

    if (err) {
      if (err === 'Cancha no encontrada') {
        return notFound(res, err);
      }
      if (err.includes('reservas activas')) {
        return conflict(res, err);
      }
      return error(res, err, 500);
    }

    return success(res, cancha, 'Cancha eliminada exitosamente');

  } catch (e) {
    console.error('deleteCancha:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * PATCH /api/canchas/reactivar - Reactivar cancha
 */
export async function patchReactivarCancha(req, res) {
  try {
    const { id } = req.body; // Cambio: ID viene del body

    const [cancha, err] = await reactivarCancha(id);

    if (err) {
      if (err === 'Cancha no encontrada') {
        return notFound(res, err);
      }
      if (err.includes('Solo se pueden reactivar')) {
        return conflict(res, err);
      }
      return error(res, err, 500);
    }

    return success(res, cancha, 'Cancha reactivada exitosamente');

  } catch (e) {
    console.error('patchReactivarCancha:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}