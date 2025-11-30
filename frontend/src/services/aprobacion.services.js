import api from './root.services';

// Obtener estadísticas de reservas

export const obtenerEstadisticas = async () => {
  try {
    const response = await api.post('/aprobacion/estadisticas');
    return [response.data, null];
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return [null, error.response?.data?.message || 'Error al obtener estadísticas'];
  }
};

// Obtener reservas pendientes
export async function obtenerReservasPendientes(filtros = {}) {
  const params = {};
  
  if (filtros.fecha) params.fecha = filtros.fecha;
  if (filtros.canchaId) params.canchaId = filtros.canchaId;
  if (filtros.estado) params.estado = filtros.estado;
  if (filtros.usuarioId) params.usuarioId = filtros.usuarioId;
  if (filtros.page) params.page = filtros.page;
  if (filtros.limit) params.limit = filtros.limit;

  const res = await api.get('/aprobacion/pendientes', { params });
  return [res.data, null];
}

// Aprobar una reserva
export const aprobarReserva = async (reservaId, observacion = null) => {
  try {
    const response = await api.patch('/aprobacion/aprobar', {
      id: reservaId,
      observacion: observacion || undefined
    });
    return [response.data, null];
  } catch (error) {
    console.error('Error aprobando reserva:', error);
    return [null, error.response?.data?.message || 'Error al aprobar la reserva'];
  }
};

// Rechazar una reserva
export const rechazarReserva = async (reservaId, motivoRechazo) => {
  try {
    const response = await api.patch('/aprobacion/rechazar', {
      id: reservaId,
      motivoRechazo: motivoRechazo
    });
    return [response.data, null];
  } catch (error) {
    console.error('Error rechazando reserva:', error);
    return [null, error.response?.data?.message || 'Error al rechazar la reserva'];
  }
};

export async function exportarReservasExcel(params = {}) {
  try {
    // Detectar móvil
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    params.mobile = isMobile;

    const query = new URLSearchParams(params).toString();

    const res = await api.get(`/aprobacion/excel?${query}`, {
      responseType: isMobile ? "json" : "blob"
    });

    // Si es móvil → retorna base64
    if (isMobile) {
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Error al exportar Excel");
      }

      // Convertir base64 → Blob para poder descargar igual
      const byteChars = atob(res.data.base64);
      const byteNumbers = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);

      return new Blob([byteArray], { type: 
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
    }

    // En PC → viene blob directo
    return res.data;

  } catch (error) {
    console.error(error);
    throw new Error(error.message || "Error al exportar Excel");
  }
}


export async function exportarReservasPDF(params = {}) {
  try {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    params.mobile = isMobile;

    const query = new URLSearchParams(params).toString();

    const res = await api.get(`/aprobacion/pdf?${query}`, {
      responseType: isMobile ? "json" : "blob"
    });

    // Móvil → base64
    if (isMobile) {
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Error exportando PDF");
      }

      const byteChars = atob(res.data.base64);
      const byteNumbers = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);

      return new Blob([byteArray], { type: "application/pdf" });
    }

    // PC → Blob
    return res.data;

  } catch (error) {
    console.error(error);
    throw new Error(error.message || "Error al exportar PDF");
  }
}

