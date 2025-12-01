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
    console.log(error.response?.data?.message);
    throw error.response?.data?.message || 'Error al actualizar la cancha';
  }
}; 
//desactivar cancha
export const eliminarCancha = async (id) => {
  try {
    const response = await api.delete('/canchas/eliminar', { data: { id } });
    return response.data;
  } catch (error) {
    console.log(error.response?.data?.message);
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
    const queryParams = new URLSearchParams();
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.q) queryParams.append('q', params.q);

    const res = await api.get(`/canchas/excel?${queryParams.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay canchas para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `canchas_${new Date().toISOString().split('T')[0]}.xlsx`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `canchas_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando canchas a Excel:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar canchas a Excel');
      }
    }
    
    throw new Error(error.message || 'Error al exportar canchas a Excel');
  }
}

export async function exportarCanchasPDF(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.q) queryParams.append('q', params.q);

    const res = await api.get(`/canchas/pdf?${queryParams.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay canchas para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `canchas_${new Date().toISOString().split('T')[0]}.pdf`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `canchas_${new Date().toISOString().split('T')[0]}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando canchas a PDF:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar canchas a PDF');
      }
    }
    
    throw new Error(error.message || 'Error al exportar canchas a PDF');
  }
}