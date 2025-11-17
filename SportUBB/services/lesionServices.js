import api from './api';


export const crearLesion = async (data) => {
  try {
    const response = await api.post('/lesiones', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const obtenerLesiones = async (params = {}) => {
  try {
    const response = await api.get('/lesiones', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const obtenerMisLesiones = async (params = {}) => {
  try {
    const response = await api.get('/lesiones/mias', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const obtenerLesionesPorJugador = async (jugadorId, params = {}) => {
  try {
    const response = await api.get(`/lesiones/jugador/${jugadorId}`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const obtenerLesionPorId = async (id) => {
  try {
    const response = await api.get(`/lesiones/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const actualizarLesion = async (id, data) => {
  try {
    const response = await api.patch(`/lesiones/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};



export const eliminarLesion = async (id) => {
  try {
    const response = await api.delete(`/lesiones/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const exportarLesionesExcel = async (params = {}) => {
  try {
    const response = await api.get('/lesiones/excel', {
      params,
      responseType: 'blob' 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const exportarLesionesPDF = async (params = {}) => {
  try {
    const response = await api.get('/lesiones/pdf', {
      params,
      responseType: 'blob' 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
