
import api from './root.services.js';

//  Listar estadísticas con filtros
export const listarEstadisticas = async (filtros = {}) => {
  try {
    const params = {};

    if (filtros.partidoId) params.partidoId = filtros.partidoId;
    if (filtros.jugadorCampeonatoId) params.jugadorCampeonatoId = filtros.jugadorCampeonatoId;
    if (filtros.campeonatoId) params.campeonatoId = filtros.campeonatoId;
    
    if (filtros.equipoId) params.equipoId = filtros.equipoId;
    if (filtros.q) params.q = filtros.q;

    const res = await api.get('/estadisticaCampeonato', { params });
    console.log(res)
    return res.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al obtener estadísticas';
  }
};


//  Crear nueva estadística
export const crearEstadistica = async (payload) => {
  try {
    const res = await api.post('/estadisticaCampeonato', payload);
    return res.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al crear estadística';
  }
};

//  Actualizar estadística existente
export const actualizarEstadistica = async (id, payload) => {
  try {
    const res = await api.patch(`/estadisticaCampeonato/${id}`, payload);
    return res.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al actualizar estadística';
  }
};

//  Eliminar estadística
export const eliminarEstadistica = async (id) => {
  try {
    const res = await api.delete(`/estadisticaCampeonato/${id}`);
    return res.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al eliminar estadística';
  }
};
/*
//  Obtener estadística por ID
export const obtenerEstadisticaPorId = async (id) => {
  try {
    const res = await api.get(`/estadisticaCampeonato/${id}`);
    return res.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al obtener estadística';
  }
};
*/
//  Obtener estadísticas por jugador en campeonato
export const obtenerEstadisticasPorJugadorCampeonato = async (jugadorCampId, campeonatoId) => {
  try {
    const res = await api.get(`/estadisticaCampeonato/jugadorcampeonato/${jugadorCampId}/campeonato/${campeonatoId}`);
    return res.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al obtener estadísticas del jugador';
  }
};
/*
//  Obtener estadísticas por usuario en campeonato
export const obtenerEstadisticasPorUsuarioCampeonato = async (usuarioId, campeonatoId) => {
  try {
    const res = await api.get(`/estadisticaCampeonato/usuario/${usuarioId}/campeonato/${campeonatoId}`);
    return res.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al obtener estadísticas del usuario';
  }
};
*/

export const listarJugadoresPorEquipoYCampeonato = async (equipoId, campeonatoId) => {
  try {
    const res = await api.get(`/estadisticaCampeonato/equipo/${equipoId}/campeonato/${campeonatoId}`);
    return res.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al obtener jugadores';
  }
};



export const exportarExcel = async (campeonatoId, equipoId = null, busqueda = null) => {
  try {
    const params = new URLSearchParams();
    if (equipoId) params.append('equipoId', equipoId);
    if (busqueda) params.append('q', busqueda);
    
    const res = await api.get(`/estadisticaCampeonato/campeonato/${campeonatoId}/excel?${params.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay estadísticas para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `estadisticas_campeonato_${campeonatoId}_${Date.now()}.xlsx`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `estadisticas_campeonato_${campeonatoId}_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando estadísticas a Excel:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar estadísticas a Excel');
      }
    }
    
    throw new Error(error.message || 'Error al exportar estadísticas a Excel');
  }
};

export const exportarPDF = async (campeonatoId, equipoId = null, busqueda = null) => {
  try {
    const params = new URLSearchParams();
    if (equipoId) params.append('equipoId', equipoId);
    if (busqueda) params.append('q', busqueda);
    
    const res = await api.get(`/estadisticaCampeonato/campeonato/${campeonatoId}/pdf?${params.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay estadísticas para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `estadisticas_campeonato_${campeonatoId}_${Date.now()}.pdf`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `estadisticas_campeonato_${campeonatoId}_${new Date().toISOString().split('T')[0]}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando estadísticas a PDF:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar estadísticas a PDF');
      }
    }
    
    throw new Error(error.message || 'Error al exportar estadísticas a PDF');
  }
};