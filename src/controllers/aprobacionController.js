// controllers/aprobacionController.js
import { 
  aprobarReserva,
  rechazarReserva,
  obtenerReservasPendientes,
  cambiarEstadoReserva,
  obtenerEstadisticasReservas
} from '../services/aprobacionServices.js';
import { success, error, notFound, conflict } from '../utils/responseHandler.js';

/**
 * PATCH /api/reservas/aprobar - Aprobar una reserva
 */
export async function patchAprobarReserva(req, res) {
  try {
    const { id, observacion } = req.body;
    const entrenadorId = req.user?.id; // Viene del middleware de autenticación
    
    // Para testing sin auth, usar ID fijo
    const userId = entrenadorId || 1; // Cambiar cuando tengas auth

    const [reserva, err] = await aprobarReserva(id, userId, observacion);

    if (err) {
      if (err === 'Reserva no encontrada') {
        return notFound(res, err);
      }
      
      if (err.includes('No se puede aprobar') || err.includes('estado')) {
        return conflict(res, err);
      }
      
      return error(res, err, 500);
    }

    return success(res, reserva, 'Reserva aprobada exitosamente');

  } catch (e) {
    console.error('patchAprobarReserva:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * PATCH /api/reservas/rechazar - Rechazar una reserva
 */
export async function patchRechazarReserva(req, res) {
  try {
    const { id, motivoRechazo } = req.body;
    const entrenadorId = req.user?.id; // Viene del middleware de autenticación
    
    // Para testing sin auth, usar ID fijo
    const userId = entrenadorId || 1; // Cambiar cuando tengas auth

    const [reserva, err] = await rechazarReserva(id, userId, motivoRechazo);

    if (err) {
      if (err === 'Reserva no encontrada') {
        return notFound(res, err);
      }
      
      if (err.includes('No se puede rechazar') || err.includes('estado')) {
        return conflict(res, err);
      }
      
      return error(res, err, 500);
    }

    return success(res, reserva, 'Reserva rechazada exitosamente');

  } catch (e) {
    console.error('patchRechazarReserva:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * GET /api/reservas/pendientes - Obtener reservas pendientes de aprobación
 */
export async function getReservasPendientes(req, res) {
  try {
    const filtros = req.body;

    const [result, err] = await obtenerReservasPendientes(filtros);

    if (err) {
      return error(res, err, 500);
    }

    const { reservas, pagination } = result;

    const mensaje = reservas.length > 0 ? 
      `${reservas.length} reserva(s) pendiente(s) - Página ${pagination.currentPage} de ${pagination.totalPages}` : 
      'No hay reservas pendientes de aprobación';

    return success(res, { reservas, pagination }, mensaje);

  } catch (e) {
    console.error('getReservasPendientes:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * PATCH /api/reservas/cambiar-estado - Cambiar estado de reserva (función genérica)
 */
export async function patchCambiarEstadoReserva(req, res) {
  try {
    const { id, nuevoEstado, observacion } = req.body;
    const entrenadorId = req.user?.id; // Viene del middleware de autenticación
    
    // Para testing sin auth, usar ID fijo
    const userId = entrenadorId || 1; // Cambiar cuando tengas auth

    const [reserva, err] = await cambiarEstadoReserva(id, nuevoEstado, userId, observacion);

    if (err) {
      if (err === 'Reserva no encontrada') {
        return notFound(res, err);
      }
      
      if (err.includes('Estado inválido') || 
          err.includes('Solo se pueden') || 
          err.includes('No se puede')) {
        return conflict(res, err);
      }
      
      return error(res, err, 500);
    }

    return success(res, reserva, `Estado de reserva cambiado a '${nuevoEstado}' exitosamente`);

  } catch (e) {
    console.error('patchCambiarEstadoReserva:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * POST /api/reservas/estadisticas - Obtener estadísticas para dashboard
 */
export async function getEstadisticasReservas(req, res) {
  try {
    const [estadisticas, err] = await obtenerEstadisticasReservas();

    if (err) {
      return error(res, err, 500);
    }

    return success(res, estadisticas, 'Estadísticas de reservas obtenidas');

  } catch (e) {
    console.error('getEstadisticasReservas:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}
