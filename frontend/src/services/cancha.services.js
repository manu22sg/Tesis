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

export async function exportarCanchasExcel(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/canchas/excel?${query}`, {
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

export async function exportarCanchasPDF(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/canchas/pdf?${query}`, {
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
