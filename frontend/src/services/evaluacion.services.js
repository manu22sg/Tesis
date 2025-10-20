import api from './root.services.js';


export const crearEvaluacion = async (data) => {
  try {
    const response = await api.post('/evaluaciones', data);
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const obtenerEvaluaciones = async (params = {}) => {
  try {
    const response = await api.get('/evaluaciones', { params });
    console.log('Respuesta de obtenerEvaluaciones:', response.data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const obtenerEvaluacionPorId = async (id) => {
  try {
    const response = await api.get(`/evaluaciones/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export async function actualizarEvaluacion({ id, ...payload }) {
  const response = await api.patch(`/evaluaciones/${id}`, payload);
  return response.data.data;
}


export const eliminarEvaluacion = async (id) => {
  try {
    const response = await api.delete(`/evaluaciones/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const obtenerEvaluacionesPorJugador = async (jugadorId, params = {}) => {
  try {
    const response = await api.get(`/evaluaciones/jugador/${jugadorId}`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const obtenerMisEvaluaciones = async (params = {}) => {
  try {
    const response = await api.get('/evaluaciones/mias', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};