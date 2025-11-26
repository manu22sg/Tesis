
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
    const params = {};
    if (equipoId) params.equipoId = equipoId;
    if (busqueda) params.q = busqueda;
    
    const response = await api.get(`/estadisticaCampeonato/campeonato/${campeonatoId}/excel`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const exportarPDF = async (campeonatoId, equipoId = null, busqueda = null) => {
  try {
    const params = {};
    if (equipoId) params.equipoId = equipoId;
    if (busqueda) params.q = busqueda;
    
    const response = await api.get(`/estadisticaCampeonato/campeonato/${campeonatoId}/pdf`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
