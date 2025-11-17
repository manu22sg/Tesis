import api from './api';

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

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


export async function exportarAsistenciasExcel(params = {}) {
  if (!params.sesionId) {
    throw new Error("sesionId es requerido");
  }

  try {
    const query = new URLSearchParams(params).toString();

    // EXPO → SIEMPRE pedimos JSON
    const res = await api.get(`/asistencia/excel?${query}`);

    if (!res.data.success) {
      console.log('Error en respuesta al exportar Excel:', res.data);
      throw new Error(res.data.message || "No hay asistencias");
    }

    // SI ES MOBILE: viene base64
    if (res.data.base64) {
      return res.data;
    }

    // En web devuelve BLOB
    return {
      base64: null,
      blob: res.data
    };

  } catch (error) {
    throw new Error(error.message || "Error al exportar Excel");
  }
}




export async function exportarAsistenciasPDF(params = {}) {
  if (!params.sesionId) {
    throw new Error("sesionId es requerido");
  }
  
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/asistencia/pdf?${query}`, {
      responseType: "blob"
    });
    
    // 🔥 Verificar si es un error JSON disfrazado de blob
    if (res.data.type === 'application/json') {
      const text = await res.data.text();
      const error = JSON.parse(text);
      throw new Error(error.message || 'No hay asistencias para exportar');
    }
    
    return res.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'No hay asistencias para exportar');
      } catch (parseError) {
        throw new Error('No hay asistencias para exportar');
      }
    }
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw new Error(error.message || 'Error al exportar PDF');
  }
}
