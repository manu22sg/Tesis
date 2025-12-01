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
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay equipos para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `equipos_campeonato_${campeonatoId}_${Date.now()}.xlsx`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `equipos_campeonato_${campeonatoId}_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando equipos a Excel:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar equipos a Excel');
      }
    }
    
    throw new Error(error.message || 'Error al exportar equipos a Excel');
  }
},

exportarPDF: async (campeonatoId, incluirJugadores = true) => {
  try {
    const res = await api.get(`/equipos/${campeonatoId}/pdf`, {
      params: { incluirJugadores: incluirJugadores.toString() },
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay equipos para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `equipos_campeonato_${campeonatoId}_${Date.now()}.pdf`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `equipos_campeonato_${campeonatoId}_${new Date().toISOString().split('T')[0]}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando equipos a PDF:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar equipos a PDF');
      }
    }
    
    throw new Error(error.message || 'Error al exportar equipos a PDF');
  }
}

};
