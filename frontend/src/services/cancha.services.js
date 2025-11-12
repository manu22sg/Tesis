import api from './root.services.js';



export const crearCancha = async (datosCancha) => {
  try {
    const response = await api.post('/canchas', datosCancha);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al crear la cancha';
  }
};
export const obtenerCanchaPorId = async (id) => {
  try {
    const response = await api.post('/canchas/detalle', { id });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al obtener la cancha';
  }
};

export const actualizarCancha = async (id, datosActualizacion) => {
  try {
    const response = await api.patch('/canchas', { id, ...datosActualizacion });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al actualizar la cancha';
  }
}; 
//desactivar cancha
export const eliminarCancha = async (id) => {
  try {
    const response = await api.delete('/canchas/eliminar', { data: { id } });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al eliminar la cancha';
  }
};

export const reactivarCancha = async (id) => {
  try {
    const response = await api.patch('/canchas/reactivar', { id });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al reactivar la cancha';
  }
};


export async function obtenerCanchas(filtros = {}) {
  const params = {};
  if (filtros.estado) params.estado = filtros.estado;
  if (filtros.page) params.page = filtros.page;
  if (filtros.limit) params.limit = filtros.limit;
  if (filtros.q) params.q= filtros.q;

  const res = await api.get('/canchas', { params });
  
  // Devolver tanto las canchas como la información de paginación
  return {
    canchas: res.data.data?.canchas || [],
    pagination: res.data.data?.pagination || {}
  };
}