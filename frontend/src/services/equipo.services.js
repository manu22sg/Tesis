import api from './root.services.js';

// CRUD de Equipos
export const equipoService = {

  // Crear equipo
  crear: async (data) => {
    try {
      const response = await api.post('/equipos', data);
      return response.data;
    } catch (error) {
      console.error("Error al crear equipo:", error);
      throw error;
    }
  },

  // Actualizar equipo
  actualizar: async (equipoId, data) => {
    try {
      const response = await api.patch(`/equipos/${equipoId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar equipo:", error);
      throw error;
    }
  },

  // Eliminar equipo
  eliminar: async (equipoId) => {
    try {
      const response = await api.delete(`/equipos/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error("Error al eliminar equipo:", error);
      throw error;
    }
  },

  // Listar equipos por campeonato
  listarPorCampeonato: async (campeonatoId) => {
    try {
      const response = await api.get(`/equipos/campeonato/${campeonatoId}`);
      return response.data;
    } catch (error) {
      console.error("Error al listar equipos del campeonato:", error);
      throw error;
    }
  },

  // Listar jugadores de un equipo
  listarJugadores: async (equipoId) => {
    try {
      const res = await api.get(`/equipos/${equipoId}/jugadores`);
      const jugadores = res.data?.data?.jugadores;
      return Array.isArray(jugadores) ? jugadores : [];
    } catch (error) {
      console.error("Error al listar jugadores del equipo:", error);
      throw error;
    }
  },

  // Agregar usuario a equipo
  agregarJugador: async (data) => {
    try {
      const response = await api.post('/equipos/agregar-usuario', data);
      return response.data;
    } catch (error) {
      console.error("Error al agregar jugador al equipo:", error);
      throw error;
    }
  },

  // Quitar usuario de equipo
  quitarJugador: async (campeonatoId, equipoId, usuarioId) => {
    try {
      const response = await api.delete(`/equipos/${campeonatoId}/${equipoId}/${usuarioId}`);
      return response.data;
    } catch (error) {
      console.error("Error al quitar jugador del equipo:", error);
      throw error;
    }
  },

  // Exportar equipos a Excel
  exportarExcel: async (campeonatoId, incluirJugadores = true) => {
    try {
      const response = await api.get(`/equipos/${campeonatoId}/excel`, {
        params: { incluirJugadores: incluirJugadores.toString() },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error("Error al exportar equipos a Excel:", error);
      throw error.response?.data || error;
    }
  },

  // Exportar equipos a PDF
  exportarPDF: async (campeonatoId, incluirJugadores = true) => {
    try {
      const response = await api.get(`/equipos/${campeonatoId}/pdf`, {
        params: { incluirJugadores: incluirJugadores.toString() },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error("Error al exportar equipos a PDF:", error);
      throw error.response?.data || error;
    }
  }

};
