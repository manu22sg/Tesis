import api from './root.services.js';

const CAMPEONATOS_BASE = '/campeonatos';

export const campeonatoService = {

  // Crear campeonato
  crear: async (payload) => {
    try {
      const response = await api.post(CAMPEONATOS_BASE, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Listar todos los campeonatos
  listar: async () => {
    try {
      const response = await api.get(CAMPEONATOS_BASE);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener un campeonato por ID
  obtener: async (id) => {
    try {
      const response = await api.get(`${CAMPEONATOS_BASE}/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Actualizar campeonato
  actualizar: async (id, payload) => {
    try {
      const response = await api.patch(`${CAMPEONATOS_BASE}/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Eliminar campeonato
  eliminar: async (id) => {
    try {
      const response = await api.delete(`${CAMPEONATOS_BASE}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Sortear primera ronda
  sortearPrimeraRonda: async (id) => {
    try {
      const response = await api.post(`${CAMPEONATOS_BASE}/${id}/sortear`);
      return response.data.data;
    } catch (error) {
      console.log(error)
      throw error.response?.data || error;
    }
  },

  // Generar siguiente ronda
  generarSiguienteRonda: async (id) => {
    try {
      const response = await api.post(`${CAMPEONATOS_BASE}/${id}/siguiente-ronda`, {});
      return response.data.data;
    } catch (error) {
      throw error.response?.data|| error;
    }
  },

exportarExcel: async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.formato) queryParams.append('formato', params.formato);
    if (params.genero) queryParams.append('genero', params.genero);
    if (params.anio) queryParams.append('anio', params.anio);
    if (params.semestre) queryParams.append('semestre', params.semestre);
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.tipoCampeonato) queryParams.append('tipoCampeonato', params.tipoCampeonato);

    const res = await api.get(`${CAMPEONATOS_BASE}/excel?${queryParams.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay campeonatos para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `campeonatos_${new Date().toISOString().split('T')[0]}.xlsx`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `campeonatos_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando campeonatos a Excel:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar campeonatos a Excel');
      }
    }
    
    throw new Error(error.message || 'Error al exportar campeonatos a Excel');
  }
},

exportarPDF: async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.formato) queryParams.append('formato', params.formato);
    if (params.genero) queryParams.append('genero', params.genero);
    if (params.anio) queryParams.append('anio', params.anio);
    if (params.semestre) queryParams.append('semestre', params.semestre);
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.tipoCampeonato) queryParams.append('tipoCampeonato', params.tipoCampeonato);

    const res = await api.get(`${CAMPEONATOS_BASE}/pdf?${queryParams.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay campeonatos para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `campeonatos_${new Date().toISOString().split('T')[0]}.pdf`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `campeonatos_${new Date().toISOString().split('T')[0]}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando campeonatos a PDF:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar campeonatos a PDF');
      }
    }
    
    throw new Error(error.message || 'Error al exportar campeonatos a PDF');
  }
},
  exportarFixtureExcel: async (id) => {
  try {
    const res = await api.get(`${CAMPEONATOS_BASE}/${id}/fixture/excel`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay partidos para exportar");
    }

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `fixture_${Date.now()}.xlsx`
        };
      }
    }

    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `fixture_${Date.now()}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando fixture Excel:", error);
    
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
},

exportarFixturePDF: async (id) => {
  try {
    const res = await api.get(`${CAMPEONATOS_BASE}/${id}/fixture/pdf`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay partidos para exportar");
    }

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `fixture_${Date.now()}.pdf`
        };
      }
    }

    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `fixture_${Date.now()}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando fixture PDF:", error);
    
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
}


};
