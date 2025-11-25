import api from './root.services.js';

// Crear o actualizar estadística
export const upsertEstadistica = async (data) => {
  try {
    const response = await api.post('/estadisticas', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtener estadísticas por jugador
export const obtenerEstadisticasPorJugador = async (jugadorId, page = 1, limit = 50) => {
  try {
    const response = await api.get(`/estadisticas/jugador/${jugadorId}`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtener mis estadísticas (para estudiantes)
export const obtenerMisEstadisticas = async (page = 1, limit = 50) => {
  try {
    const response = await api.get('/estadisticas/mias', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtener estadísticas por sesión
export const obtenerEstadisticasPorSesion = async (sesionId, page = 1, limit = 50) => {
  try {
    const response = await api.get(`/estadisticas/sesion/${sesionId}`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtener una estadística por ID
export const obtenerEstadisticaPorId = async (id) => {
  try {
    const response = await api.get(`/estadisticas/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Eliminar estadística
export const eliminarEstadistica = async (id) => {
  try {
    const response = await api.delete(`/estadisticas/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


export const exportarEstadisticasExcel = async (params = {}) => {
  try {
    const response = await api.get('/estadisticas/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const exportarEstadisticasPDF = async (params = {}) => {
  try {
    const response = await api.get('/estadisticas/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
