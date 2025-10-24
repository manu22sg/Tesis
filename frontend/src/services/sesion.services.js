import api from './root.services.js';


export async function crearSesion(data) {
  const res = await api.post('/sesion', data);
  return res.data.data;
}


export async function obtenerSesiones(filtros = {}) {
  const params = new URLSearchParams();
  
  if (filtros.q)     params.append('q', filtros.q);
  if (filtros.fecha) params.append('fecha', filtros.fecha);      
  if (filtros.canchaId) params.append('canchaId', filtros.canchaId); 
  if (filtros.grupoId) params.append('grupoId', filtros.grupoId);    
  if (filtros.tipoSesion) params.append('tipoSesion', filtros.tipoSesion); 
  if (filtros.page)  params.append('page', filtros.page);
  if (filtros.limit) params.append('limit', filtros.limit);
  if (filtros.horaInicio) params.append('horaInicio', filtros.horaInicio);
  if (filtros.horaFin) params.append('horaFin', filtros.horaFin);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await api.get(`/sesion${query}`);
  
  return {
    sesiones: res.data.data.sesiones,
    pagination: res.data.data.pagination
  };
}

/**
 * Obtener detalle de una sesión por ID
 */
export async function obtenerSesionPorId(id) {
  const res = await api.post('/sesion/detalle', { id });
  return res.data.data;
}

/**
 * Actualizar una sesión existente
 */
export async function actualizarSesion(id, datos) {
  const res = await api.patch('/sesion', { id, ...datos });
  return res.data.data;
}

/**
 * Eliminar una sesión
 */
export async function eliminarSesion(id) {
  const res = await api.delete('/sesion/eliminar', { data: { id } });
  return res.data.data;
}

/**
 * Crear sesiones recurrentes
 */
export async function crearSesionesRecurrentes(data) {
  const res = await api.post('/sesion/recurrente', data);
  return res.data.data;
}

export async function activarTokenSesion(sesionId, params = {}) {
  try {
    const payload = {
      ttlMin: params.ttlMin || 30,
      tokenLength: params.tokenLength || 6
    };
    
    const response = await api.post(`/sesionToken/activar/${sesionId}`, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error activando token:', error);
    throw error;
  }
}


export async function desactivarTokenSesion(sesionId) {
  try {
    const response = await api.patch(`/sesionToken/desactivar/${sesionId}`, {});
    return response.data.data;
  } catch (error) {
    console.error('Error desactivando token:', error);
    throw error;
  }
}

export async function obtenerSesionesEstudiante({ page = 1, limit = 10 } = {}) {
  try {
    const query = `?page=${page}&limit=${limit}`;
    const res = await api.get(`/sesion/estudiante${query}`);
    
    
    return {
      sesiones: res.data.data.sesiones,
      pagination: res.data.data.pagination
    };
  } catch (error) {
    console.error('Error obteniendo sesiones del estudiante:', error);
    throw error;
  }
}