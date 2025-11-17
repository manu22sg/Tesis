import api from './api';


export async function crearEntrenamiento(data) {
  const res = await api.post('/entrenamientos', data);
  return res.data.data;
}

export async function obtenerEntrenamientos(filtros = {}) {
  const params = new URLSearchParams();
  
  if (filtros.q) params.append('q', filtros.q);
  if (filtros.sesionId) params.append('sesionId', filtros.sesionId);
  if (filtros.page) params.append('page', filtros.page);
  if (filtros.limit) params.append('limit', filtros.limit);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await api.get(`/entrenamientos${query}`);
  
  return {
    entrenamientos: res.data.data.entrenamientos,
    pagination: res.data.data.pagination
  };
}

export async function obtenerEntrenamientoPorId(id) {
  const res = await api.get(`/entrenamientos/${id}`);
  return res.data.data;
}

export async function obtenerEntrenamientosPorSesion(sesionId) {
  const res = await api.get(`/entrenamientos/sesion/${sesionId}`);
  return res.data.data;
}

export async function actualizarEntrenamiento(id, datos) {
  const res = await api.patch(`/entrenamientos/${id}`, datos);
  return res.data.data;
}

export async function eliminarEntrenamiento(id) {
  const res = await api.delete(`/entrenamientos/${id}`);
  return res.data.data;
}

// ============================================
// NUEVAS FUNCIONES (Avanzadas)
// ============================================


export async function reordenarEntrenamientos(sesionId, entrenamientos) {
  const res = await api.post('/entrenamientos/reordenar', {
    sesionId,
    entrenamientos
  });
  return res.data.data;
}


export async function duplicarEntrenamiento(id, nuevaSesionId = null) {
  const payload = nuevaSesionId ? { nuevaSesionId } : {};
  const res = await api.post(`/entrenamientos/${id}/duplicar`, payload);
  return res.data.data;
}


export async function obtenerEstadisticas(sesionId = null) {
  const query = sesionId ? `?sesionId=${sesionId}` : '';
  const res = await api.get(`/entrenamientos/estadisticas${query}`);
  return res.data.data;
}
export async function asignarEntrenamientosASesion(sesionId, ids) {
  const res = await api.patch(`/entrenamientos/${sesionId}/asignar`, { ids });
  return res.data.data;
}