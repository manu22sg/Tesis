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

export async function exportarReservasExcel(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/aprobacion/excel?${query}`, {
      responseType: "blob"
    });
    
    if (res.data.type === 'application/json') {
      const text = await res.data.text();
      const error = JSON.parse(text);
      throw new Error(error.message || 'Error al exportar Excel');
    }
    
    return res.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Error al exportar Excel');
      } catch {
        throw new Error('Error al exportar Excel');
      }
    }
    throw error;
  }
}

export async function exportarReservasPDF(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/aprobacion/pdf?${query}`, {
      responseType: "blob"
    });
    
    if (res.data.type === 'application/json') {
      const text = await res.data.text();
      const error = JSON.parse(text);
      throw new Error(error.message || 'Error al exportar PDF');
    }
    
    return res.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Error al exportar PDF');
      } catch {
        throw new Error('Error al exportar PDF');
      }
    }
    throw error;
  }
}
