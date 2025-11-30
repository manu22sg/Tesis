import api from './root.services.js';

export const partidoService = {

  // Listar partidos por campeonato
  listarPorCampeonato: async (campeonatoId, filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.ronda) params.append('ronda', filtros.ronda);

      const queryString = params.toString();
      const url = `/partidos/campeonato/${campeonatoId}${queryString ? `?${queryString}` : ''}`;

      const response = await api.get(url);
      return response.data;

    } catch (error) {
      console.error("Error al listar partidos:", error);
      throw error; // lo lanzas para manejarlo en el componente
    }
  },

  // Programar partido
  programar: async (partidoId, data) => {
    try {
      const response = await api.patch(`/partidos/${partidoId}/programar`, data);
      return response.data;

    } catch (error) {
      console.log(error)
      console.error("Error al programar partido:", error);
      throw error;
    }
  },

  // Registrar resultado
  registrarResultado: async (partidoId, data) => {
    try {
      const response = await api.post(`/partidos/${partidoId}/registrar-resultado`, {
        golesA: data.golesA,
        golesB: data.golesB,
        penalesA: data.penalesA,
        penalesB: data.penalesB
      });

      return response.data;

    } catch (error) {
      console.error("Error al registrar resultado:", error);
      throw error;
    }
  }
};