import api from './root.services.js';


function limpiarPayload(data) {
  const limpio = {};
  for (const key in data) {
    const valor = data[key];
    if (valor !== null && valor !== undefined && valor !== '') {
      limpio[key] = valor;
    }
  }
  return limpio;
}


export async function marcarAsistenciaPorToken(data) {
  try {
    const payload = limpiarPayload(data);
    const response = await api.post('/asistencia/marcar-asistencia', payload);
    return response.data?.data;
  } catch (error) {
    console.error('Error marcando asistencia por token:', error);
    throw error;
  }
}


export async function actualizarAsistencia(asistenciaId, data) {
  try {
    const payload = limpiarPayload(data);
    const response = await api.patch(`/asistencia/${asistenciaId}`, payload);
    return response.data?.data;
  } catch (error) {
    console.error('Error actualizando asistencia:', error);
    throw error;
  }
}

export async function eliminarAsistencia(asistenciaId) {
  try {
    const response = await api.delete(`/asistencia/${asistenciaId}`);
    return response.data?.data;
  } catch (error) {
    console.error('Error eliminando asistencia:', error);
    throw error;
  }
}


export async function listarAsistenciasDeSesion(sesionId, params = {}) {
  try {
    const response = await api.get(`/asistencia/${sesionId}`, { params });
    return response.data?.data;
  } catch (error) {
    console.error('Error obteniendo asistencias:', error);
    throw error;
  }
}
