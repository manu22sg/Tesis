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
export const obtenerEstadisticasPorJugador = async (jugadorId, pagina = 1, limite = 10) => {
  try {
    const response = await api.get(`/estadisticas/jugador/${jugadorId}`, {
      params: { pagina, limite }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtener mis estadísticas (para estudiantes)
export const obtenerMisEstadisticas = async (pagina = 1, limite = 10) => {
  try {
    const response = await api.get('/estadisticas/mias', {
      params: { pagina, limite }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtener estadísticas por sesión
export const obtenerEstadisticasPorSesion = async (sesionId, pagina = 1, limite = 10) => {
  try {
    const response = await api.get(`/estadisticas/sesion/${sesionId}`, {
      params: { pagina, limite }
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