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
  }
};

export default ojeadorService;