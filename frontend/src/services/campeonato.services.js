import api from './root.services.js';

const CAMPEONATOS_BASE = '/campeonatos';

export const campeonatoService = {
  // Crear campeonato
  crear: async (payload) => {
    const response = await api.post(CAMPEONATOS_BASE, payload);
    return response.data;
  },

  // Listar todos los campeonatos
  listar: async () => {
    const response = await api.get(CAMPEONATOS_BASE);
    return response.data;
  },

  // Obtener un campeonato por ID
  obtener: async (id) => {
    const response = await api.get(`${CAMPEONATOS_BASE}/${id}`);
    return response.data;
  },

  // Actualizar campeonato
  actualizar: async (id, payload) => {
    const response = await api.patch(`${CAMPEONATOS_BASE}/${id}`, payload);
    return response.data;
  },

  // Eliminar campeonato
  eliminar: async (id) => {
    const response = await api.delete(`${CAMPEONATOS_BASE}/${id}`);
    return response.data;
  },

  // Sortear primera ronda
  sortearPrimeraRonda: async (id) => {
    const response = await api.post(`${CAMPEONATOS_BASE}/${id}/sortear`);
    return response.data;
  },

  // Generar siguiente ronda
  generarSiguienteRonda: async (id) => {
    const response = await api.post(`${CAMPEONATOS_BASE}/${id}/siguiente-ronda`, {});
    return response.data;
  },
  exportarExcel: async (params = {}) => {
    try {
      const response = await api.get(`${CAMPEONATOS_BASE}/excel`, {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  exportarPDF: async (params = {}) => {
    try {
      const response = await api.get(`${CAMPEONATOS_BASE}/pdf`, {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  exportarFixtureExcel: async (id) => {
    try {
      const response = await api.get(`${CAMPEONATOS_BASE}/${id}/fixture/excel`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Exportar fixture a PDF
  exportarFixturePDF: async (id) => {
    try {
      const response = await api.get(`${CAMPEONATOS_BASE}/${id}/fixture/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }


  
};