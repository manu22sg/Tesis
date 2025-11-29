import api from './root.services.js';

export async function crearReserva(data) {
  try {
    const res = await api.post('/reservas', data);
    return res.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

export async function obtenerMisReservas(filtros = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/reservas${query}`);
    
    return {
      reservas: res.data.data.reservas,
      pagination: res.data.data.pagination
    };
  } catch (error) {
    throw error.response?.data || error;
  }
}

export async function obtenerTodasLasReservas(filtros = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.fecha) params.append('fecha', filtros.fecha);
    if (filtros.canchaId) params.append('canchaId', filtros.canchaId);
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/reservas/todas${query}`);
    
    return {
      reservas: res.data.data.reservas,
      pagination: res.data.data.pagination
    };
  } catch (error) {
    throw error.response?.data || error;
  }
}

export async function obtenerReservaPorId(id) {
  try {
    const res = await api.post('/reservas/detalle', { id });
    return res.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

export async function cancelarReserva(id) {
  try {
    const res = await api.put(`/reservas/${id}/cancelar`);
    return res.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

export async function editarParticipantesReserva(id, participantes) {
  try {
    const res = await api.put(`/reservas/${id}/participantes`, { participantes });
    return res.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}
