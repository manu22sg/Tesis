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
      return response.data;
    } catch (error) {
      console.log(error)
      throw error.response?.data || error;
    }
  },

  // Generar siguiente ronda
  generarSiguienteRonda: async (id) => {
    try {
      const response = await api.post(`${CAMPEONATOS_BASE}/${id}/siguiente-ronda`, {});
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
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
