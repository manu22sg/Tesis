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
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error obteniendo asistencias:', error);
    throw error;
  }
}



export async function exportarAsistenciasExcel(params = {}) {
  if (!params.sesionId && !params.jugadorId) {
    throw new Error("Debe proporcionar sesionId o jugadorId");
  }

  try {
    // Detectar si es móvil
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    params.mobile = isMobile;

    const query = new URLSearchParams(params).toString();

    const res = await api.get(`/asistencia/excel?${query}`, {
      responseType: isMobile ? "json" : "blob"
    });

    // Si es móvil → backend manda { base64, fileName }
    if (isMobile) {
      if (!res.data?.success) {
        throw new Error(res.data?.message || "No hay asistencias para exportar");
      }

      // Convertir base64 → Blob
      const byteChars = atob(res.data.base64);
      const byteNumbers = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);

      return new Blob([byteArray], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });
    }

    // Si es PC → se devuelve blob directo
    return res.data;

  } catch (error) {
    console.error(error);
    throw new Error(error.message || "Error al exportar Excel");
  }
}


export async function exportarAsistenciasPDF(params = {}) {
  if (!params.sesionId && !params.jugadorId) {
    throw new Error("Debe proporcionar sesionId o jugadorId");
  }

  try {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    params.mobile = isMobile;

    const query = new URLSearchParams(params).toString();

    const res = await api.get(`/asistencia/pdf?${query}`, {
      responseType: isMobile ? "json" : "blob"
    });

    if (isMobile) {
      if (!res.data?.success) {
        throw new Error(res.data?.message || "No hay asistencias para exportar");
      }

      const byteChars = atob(res.data.base64);
      const byteNumbers = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);

      return new Blob([byteArray], { type: "application/pdf" });
    }

    return res.data;

  } catch (error) {
    console.error(error);

    throw new Error(error.message || "Error al exportar PDF");
  }
}



export async function registrarAsistenciaManual(data) {
  try {
    const payload = limpiarPayload(data);
    const response = await api.post('/asistencia/registrar-manual', payload);
    return response.data?.data;
  } catch (error) {
    console.error('Error registrando asistencia manual:', error);
    throw error;
  }
}

export async function obtenerAsistenciasPorJugador(jugadorId, params = {}) {
  try {
    const response = await api.get(`/asistencia/jugador/${jugadorId}`, { params });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error obteniendo asistencias del jugador:', error);
    throw error;
  }
}

export async function obtenerEstadisticasAsistenciaJugador(jugadorId) {
  try {
    const response = await api.get(`/asistencia/jugador/${jugadorId}/estadisticas`);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error obteniendo estadísticas de asistencia:', error);
    throw error;
  }
}