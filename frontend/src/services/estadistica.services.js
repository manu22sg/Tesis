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
export const obtenerEstadisticasPorJugador = async (jugadorId, page = 1, limit = 50, busqueda = '', sesionId = null) => {
  try {
    const params = { page, limit, busqueda };
    if (sesionId) params.sesionId = sesionId; // ✅ Filtro opcional de sesión
    
    const response = await api.get(`/estadisticas/jugador/${jugadorId}`, { params });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtener mis estadísticas (para estudiantes)
export const obtenerMisEstadisticas = async (page = 1, limit = 50, busqueda = '', sesionId = null) => {
  try {
    const params = { page, limit, busqueda };
    if (sesionId) params.sesionId = sesionId; // ✅ Filtro opcional de sesión
    
    const response = await api.get('/estadisticas/mias', { params });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtener estadísticas por sesión
export const obtenerEstadisticasPorSesion = async (sesionId, page = 1, limit = 50, busqueda = '', jugadorId = null) => {
  try {
    const params = { page, limit, busqueda };
    if (jugadorId) params.jugadorId = jugadorId; // ✅ Filtro opcional de jugador
    
    const response = await api.get(`/estadisticas/sesion/${sesionId}`, { params });
    return response.data.data;
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

// Exportar a Excel
export const exportarEstadisticasExcel = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/estadisticas/excel?${query}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay estadísticas para exportar");
    }

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `estadisticas_${Date.now()}.xlsx`
        };
      }
    }

    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `estadisticas_${Date.now()}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando estadísticas Excel:", error);
    
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

// Exportar a PDF
export const exportarEstadisticasPDF = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/estadisticas/pdf?${query}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay estadísticas para exportar");
    }

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `estadisticas_${Date.now()}.pdf`
        };
      }
    }

    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `estadisticas_${Date.now()}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando estadísticas PDF:", error);
    
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