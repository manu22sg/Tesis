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
export async function obtenerReservasPendientes(filtros = {}) {
  const params = {};
  
  if (filtros.fecha) params.fecha = filtros.fecha;
  if (filtros.canchaId) params.canchaId = filtros.canchaId;
  if (filtros.estado) params.estado = filtros.estado;
  if (filtros.usuarioId) params.usuarioId = filtros.usuarioId;
  if (filtros.page) params.page = filtros.page;
  if (filtros.limit) params.limit = filtros.limit;

  const res = await api.get('/aprobacion/pendientes', { params });
  return [res.data, null];
}

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