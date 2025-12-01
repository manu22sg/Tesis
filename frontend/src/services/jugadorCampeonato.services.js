import api from './root.services.js';

const OJEADOR_BASE = '/ojeador';

export const ojeadorService = {

  buscarJugadores: async (params = {}) => {
    try {
      const response = await api.get(OJEADOR_BASE, { params });
      return response.data;
    } catch (error) {
      console.error('Error buscando jugadores:', error);
      throw error.response?.data || error;
    }
  },


  obtenerPerfil: async (usuarioId) => {
    try {
      const response = await api.get(`${OJEADOR_BASE}/${usuarioId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      throw error.response?.data || error;
    }
  },


  obtenerEstadisticasDetalladas: async (usuarioId, campeonatoId) => {
    try {
      const response = await api.get(
        `${OJEADOR_BASE}/${usuarioId}/campeonato/${campeonatoId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas detalladas:', error);
      throw error.response?.data || error;
    }
  },
  exportarPerfilExcel: async (usuarioId) => {
  try {
    const res = await api.get(`${OJEADOR_BASE}/${usuarioId}/exportar/excel`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No se pudo exportar el perfil a Excel");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `perfil_${Date.now()}.xlsx`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `perfil_${Date.now()}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando perfil a Excel:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar perfil a Excel');
      }
    }
    
    throw new Error(error.message || 'Error al exportar perfil a Excel');
  }
},

exportarPerfilPDF: async (usuarioId) => {
  try {
    const res = await api.get(`${OJEADOR_BASE}/${usuarioId}/exportar/pdf`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No se pudo exportar el perfil a PDF");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `perfil_${Date.now()}.pdf`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `perfil_${Date.now()}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando perfil a PDF:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar perfil a PDF');
      }
    }
    
    throw new Error(error.message || 'Error al exportar perfil a PDF');
  }
}

};




export default ojeadorService;