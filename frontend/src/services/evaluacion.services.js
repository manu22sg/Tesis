import api from './root.services.js';


export const crearEvaluacion = async (data) => {
  try {
    const response = await api.post('/evaluaciones', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message
  }
};


export async function obtenerEvaluaciones(filtros = {}) {
  const params = {};
  
  if (filtros.page) params.page = filtros.page;
  if (filtros.limit) params.limit = filtros.limit;
  if (filtros.q) params.q = filtros.q; 
  if (filtros.jugadorId) params.jugadorId = filtros.jugadorId;
  if (filtros.sesionId) params.sesionId = filtros.sesionId;
  if (filtros.desde) params.desde = filtros.desde;
  if (filtros.hasta) params.hasta = filtros.hasta;

  const res = await api.get('/evaluaciones', { params });
  
  return {
    evaluaciones: res.data.data?.evaluaciones || [],
    pagination: res.data.data?.pagination || {}
  };
}




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


export const obtenerEvaluacionesPorJugador = async (jugadorId, filtros = {}) => {
  try {
    const params = {};
    
    if (filtros.page) params.page = filtros.page;
    if (filtros.limit) params.limit = filtros.limit;
    if (filtros.sesionId) params.sesionId = filtros.sesionId;
    if (filtros.desde) params.desde = filtros.desde;
    if (filtros.hasta) params.hasta = filtros.hasta;

    const response = await api.get(`/evaluaciones/jugador/${jugadorId}`, { params });
    
    return {
      evaluaciones: response.data.data?.evaluaciones || [],
      pagination: response.data.data?.pagination || {}
    };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const obtenerMisEvaluaciones = async (filtros = {}) => {
  try {
    const params = {};
    
    if (filtros.page) params.page = filtros.page;
    if (filtros.limit) params.limit = filtros.limit;
    if (filtros.sesionId) params.sesionId = filtros.sesionId;
    if (filtros.desde) params.desde = filtros.desde;
    if (filtros.hasta) params.hasta = filtros.hasta;

    const response = await api.get('/evaluaciones/mias', { params });
    
    // La respuesta viene así: { success: true, data: { evaluaciones: [...], pagination: {...} } }
    const apiData = response.data.data || {};
    
    return {
      evaluaciones: apiData.evaluaciones || [],
      pagination: apiData.pagination || {}
    };
  } catch (error) {
    throw error.response?.data || error;
  }
};



export const exportarEvaluacionesExcel = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/evaluaciones/excel?${query}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay evaluaciones para exportar");
    }

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `evaluaciones_${Date.now()}.xlsx`
        };
      }
    }

    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `evaluaciones_${Date.now()}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando evaluaciones Excel:", error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error("Error al exportar Excel");
      }
    }
    
    throw new Error(error.message || "Error al exportar Excel");
  }
};

export const exportarEvaluacionesPDF = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/evaluaciones/pdf?${query}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay evaluaciones para exportar");
    }

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `evaluaciones_${Date.now()}.pdf`
        };
      }
    }

    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `evaluaciones_${Date.now()}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando evaluaciones PDF:", error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error("Error al exportar PDF");
      }
    }
    
    throw new Error(error.message || "Error al exportar PDF");
  }
};
