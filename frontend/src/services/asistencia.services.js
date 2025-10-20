import api from './root.services.js';


export async function marcarAsistencia(sesionId, data) {
  try {
    const response = await api.post(`/asistencia/${sesionId}`, data);
    return response.data.data;
  } catch (error) {
    console.error('Error marcando asistencia:', error);
    throw error;
  }
}


export async function actualizarAsistencia(asistenciaId, data) {
  try {
    const response = await api.patch(`/asistencia/${asistenciaId}`, data);
    return response.data.data;
  } catch (error) {
    console.error('Error actualizando asistencia:', error);
    throw error;
  }
}


export async function eliminarAsistencia(asistenciaId) {
  try {
    const response = await api.delete(`/asistencia/${asistenciaId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error eliminando asistencia:', error);
    throw error;
  }
}


export async function listarAsistenciasDeSesion(sesionId, params = {}) {
  try {
    const response = await api.get(`/asistencia/${sesionId}`, { params });
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo asistencias:', error);
    throw error;
  }
}