import api from './root.services.js';

const normalizar = (res) => res?.data?.data ?? res?.data ?? res;

/* ---------------------------------------------------
   SERVICIO EQUIPOS
--------------------------------------------------- */
export const equipoService = {

  // Crear equipo
  crear: async (data) => {
    try {
      const res = await api.post('/equipos', data);
      return normalizar(res);
    } catch (error) {
      console.error("Error al crear equipo:", error);
      throw error;
    }
  },

  // Actualizar equipo
  actualizar: async (equipoId, data) => {
    try {
      const res = await api.patch(`/equipos/${equipoId}`, data);
      return normalizar(res);
    } catch (error) {
      console.error("Error al actualizar equipo:", error);
      throw error;
    }
  },

  // Eliminar equipo
  eliminar: async (equipoId) => {
    try {
      const res = await api.delete(`/equipos/${equipoId}`);
      return normalizar(res);
    } catch (error) {
      console.error("Error al eliminar equipo:", error);
      throw error;
    }
  },

  // Listar equipos por campeonato
  listarPorCampeonato: async (campeonatoId) => {
    try {
      const res = await api.get(`/equipos/campeonato/${campeonatoId}`);
      return normalizar(res);
    } catch (error) {
      console.error("Error al listar equipos del campeonato:", error);
      throw error;
    }
  },

  // Listar jugadores de un equipo
  listarJugadores: async (equipoId) => {
    try {
      const res = await api.get(`/equipos/${equipoId}/jugadores`);
      const data = normalizar(res);

      /** 
       * Backend retorna:
       * {
       *   equipo: {...},
       *   totalJugadores: number,
       *   jugadores: [...]
       * }
       */
      return {
        equipo: data.equipo ?? {},
        totalJugadores: data.totalJugadores ?? 0,
        jugadores: Array.isArray(data.jugadores) ? data.jugadores : []
      };

    } catch (error) {
      console.error("Error al listar jugadores del equipo:", error);
      throw error;
    }
  },

  // Agregar usuario a equipo
  agregarJugador: async (data) => {
    try {
      const res = await api.post('/equipos/agregar-usuario', data);
      return normalizar(res);
    } catch (error) {
      console.error("Error al agregar jugador al equipo:", error);
      throw error;
    }
  },

  // Quitar jugador de equipo
  quitarJugador: async (campeonatoId, equipoId, usuarioId) => {
    try {
      const res = await api.delete(`/equipos/${campeonatoId}/${equipoId}/${usuarioId}`);
      return normalizar(res);
    } catch (error) {
      console.error("Error al quitar jugador del equipo:", error);
      throw error;
    }
  },

  // Exportar a Excel
  exportarExcel: async (campeonatoId, incluirJugadores = true) => {
    try {
      const res = await api.get(`/equipos/${campeonatoId}/excel`, {
        params: { incluirJugadores: incluirJugadores.toString() },
        responseType: 'blob'
      });
      return res.data; // aquí no normalizamos porque es archivo
    } catch (error) {
      console.error("Error al exportar equipos a Excel:", error);
      throw error.response?.data || error;
    }
  },

  // Exportar a PDF
  exportarPDF: async (campeonatoId, incluirJugadores = true) => {
    try {
      const res = await api.get(`/equipos/${campeonatoId}/pdf`, {
        params: { incluirJugadores: incluirJugadores.toString() },
        responseType: 'blob'
      });
      return res.data;
    } catch (error) {
      console.error("Error al exportar equipos a PDF:", error);
      throw error.response?.data || error;
    }
  }
};
