import api from './api';

// CRUD de Equipos
export const equipoService = {
  // Crear equipo
  crear: async (data) => {
    const response = await api.post('/equipos', data);
    return response.data;
  },

  // Actualizar equipo
  actualizar: async (equipoId, data) => {
    const response = await api.patch(`/equipos/${equipoId}`, data);
    return response.data;
  },

  // Eliminar equipo
  eliminar: async (equipoId) => {
    const response = await api.delete(`/equipos/${equipoId}`);
    return response.data;
  },

  // Listar equipos por campeonato
  listarPorCampeonato: async (campeonatoId) => {
    const response = await api.get(`/equipos/campeonato/${campeonatoId}`);
    return response.data;
  },

  // Listar jugadores de un equipo
  listarJugadores: async (equipoId) => {
    const res = await api.get(`/equipos/${equipoId}/jugadores`);
    const jugadores = res.data?.data?.jugadores;
    return Array.isArray(jugadores) ? jugadores : [];
  },

  // Agregar usuario a equipo
  agregarJugador: async (data) => {
    const response = await api.post('/equipos/agregar-usuario', data);
    return response.data;
  },

  // Quitar usuario de equipo
  quitarJugador: async (campeonatoId, equipoId, usuarioId) => {
    const response = await api.delete(`/equipos/${campeonatoId}/${equipoId}/${usuarioId}`);
    return response.data;
  },
  exportarExcel: async (campeonatoId, incluirJugadores = true) => {
    try {
      const response = await api.get(`/equipos/${campeonatoId}/excel`, {
        params: { incluirJugadores: incluirJugadores.toString() },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
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
      throw error.response?.data || error;
    }
  }

};