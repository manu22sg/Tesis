import api from './root.services.js';

export async function obtenerCanchas(filtros = {}) {
  const params = {};
  if (filtros.estado) params.estado = filtros.estado;
  if (filtros.page) params.page = filtros.page;
  if (filtros.limit) params.limit = filtros.limit;

  const res = await api.get('/canchas', { params });
  return res.data.data?.canchas || res.data.data || []; // según formato
}
