import api from './root.services.js';


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
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/lesiones/excel?${query}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay lesiones para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `lesiones_${Date.now()}.xlsx`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `lesiones_${Date.now()}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando lesiones Excel:", error);
    
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

export const exportarLesionesPDF = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/lesiones/pdf?${query}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay lesiones para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `lesiones_${Date.now()}.pdf`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `lesiones_${Date.now()}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando lesiones PDF:", error);
    
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