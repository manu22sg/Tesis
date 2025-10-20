import api from './root.services';

// Obtener estadísticas de reservas
export const obtenerEstadisticas = async () => {
  try {
    const response = await api.post('/aprobacion/estadisticas');
    return [response.data, null];
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return [null, error.response?.data?.message || 'Error al obtener estadísticas'];
  }
};

// Obtener reservas pendientes
export const obtenerReservasPendientes = async (filtros = {}) => {
  try {
    const body = {
      fecha: filtros.fecha,
      canchaId: filtros.canchaId,
      page: filtros.page || 1,
      limit: filtros.limit || 10
    };
    console.log('Cuerpo de la solicitud de reservas pendientes:', body);
    const response = await api.get('/aprobacion/pendientes', { data: body });
    return [response.data, null];
  } catch (error) {
    console.error('Error obteniendo reservas pendientes:', error);
    return [null, error.response?.data?.message || 'Error al obtener reservas'];
  }
};

// Aprobar una reserva
export const aprobarReserva = async (reservaId, observacion = null) => {
  try {
    const response = await api.patch('/aprobacion/aprobar', {
      id: reservaId,
      observacion: observacion || undefined
    });
    return [response.data, null];
  } catch (error) {
    console.error('Error aprobando reserva:', error);
    return [null, error.response?.data?.message || 'Error al aprobar la reserva'];
  }
};

// Rechazar una reserva
export const rechazarReserva = async (reservaId, motivoRechazo) => {
  try {
    const response = await api.patch('/aprobacion/rechazar', {
      id: reservaId,
      motivoRechazo: motivoRechazo
    });
    return [response.data, null];
  } catch (error) {
    console.error('Error rechazando reserva:', error);
    return [null, error.response?.data?.message || 'Error al rechazar la reserva'];
  }
};

// Cambiar estado de reserva (función genérica)
export const cambiarEstadoReserva = async (reservaId, nuevoEstado, observacion = null) => {
  try {
    const response = await api.patch('/aprobacion/cambiar-estado', {
      id: reservaId,
      nuevoEstado: nuevoEstado,
      observacion: observacion || undefined
    });
    return [response.data, null];
  } catch (error) {
    console.error('Error cambiando estado:', error);
    return [null, error.response?.data?.message || 'Error al cambiar estado de la reserva'];
  }
};