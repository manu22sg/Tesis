import api from './root.services.js';


export async function crearSesion(data) {
  try {
    
    const res = await api.post('/sesion', data);
    
    
    return res.data.data;
  } catch (error) {
    console.error('❌ Error en crearSesion:', error);
    
    // Logging detallado del error
    if (error.response) {
     
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      
    } else {
      // Algo pasó al configurar la petición
      console.error('📋 Error al configurar la petición:', error.message);
    }
    
    // Re-lanzar el error para que lo maneje el componente
    throw error;
  }
}

export async function obtenerSesiones(filtros = {}) {
  
  const params = new URLSearchParams();

  if (filtros.q) params.append('q', filtros.q);
  if (filtros.fecha) params.append('fecha', filtros.fecha);
  if (filtros.canchaId) params.append('canchaId', filtros.canchaId);
  if (filtros.grupoId) params.append('grupoId', filtros.grupoId);
  if (filtros.tipoSesion) params.append('tipoSesion', filtros.tipoSesion);
  if (filtros.page) params.append('page', filtros.page);
  if (filtros.limit) params.append('limit', filtros.limit);
  if (filtros.horaInicio) params.append('horaInicio', filtros.horaInicio);
  if (filtros.horaFin) params.append('horaFin', filtros.horaFin);

  if (filtros.jugadorId) params.append('jugadorId', filtros.jugadorId);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await api.get(`/sesion${query}`);

  return {
    sesiones: res.data.data.sesiones,
    pagination: res.data.data.pagination,
  };
}


/**
 * Obtener detalle de una sesión por ID
 */
export async function obtenerSesionPorId(id) {
  try {
    const res = await api.post('/sesion/detalle', { id });
    
   
    
    return res.data.data;
  } catch (error) {
    console.error('Error obteniendo sesión por ID:', error);
    throw error;
  }
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


export async function crearSesionesRecurrentes(data) {
  const res = await api.post('/sesion/recurrente', data);
  return res.data.data;
}

export async function activarTokenSesion(sesionId, params = {}) {
  try {
    const payload = limpiarPayload({
      ttlMin: params.ttlMin || 30,
      tokenLength: params.tokenLength || 6,
      requiereUbicacion: params.requiereUbicacion ?? false,
      latitudToken: params.latitudToken ?? null,
      longitudToken: params.longitudToken ?? null,
    });

    const response = await api.post(`/sesionToken/activar/${sesionId}`, payload);
    return response.data?.data;
  } catch (error) {
    console.error('Error activando token:', error);
    throw error;
  }
}


export async function desactivarTokenSesion(sesionId) {
  try {
    const response = await api.patch(`/sesionToken/desactivar/${sesionId}`, {});
    return response.data?.data;
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


export async function exportarSesionesExcel(filtros = {}, mobile = false) {
  try {
    // Agregar el parámetro mobile a los filtros
    const params = { ...filtros };
    if (mobile) {
      params.mobile = 'true';
    }
    
    const queryString = new URLSearchParams(params).toString();
    const res = await api.get(`/sesion/excel?${queryString}`, {
      responseType: mobile ? 'json' : 'blob'
    });
    
    // Si es mobile y viene base64, decodificar
    if (mobile && res.data.base64) {
      const base64 = res.data.base64;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
    }
    
    return res.data;
  } catch (error) {
    console.error('Error exportando Excel:', error);
    throw error.response?.data?.message || 'Error al exportar Excel';
  }
}

export async function exportarSesionesPDF(filtros = {}, mobile = false) {
  try {
    // Agregar el parámetro mobile a los filtros
    const params = { ...filtros };
    if (mobile) {
      params.mobile = 'true';
    }
    
    const queryString = new URLSearchParams(params).toString();
    const res = await api.get(`/sesion/pdf?${queryString}`, {
      responseType: mobile ? 'json' : 'blob'
    });
    
    // Si es mobile y viene base64, decodificar
    if (mobile && res.data.base64) {
      const base64 = res.data.base64;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: 'application/pdf' });
    }
    
    return res.data;
  } catch (error) {
    console.error('Error exportando PDF:', error);
    throw error.response?.data?.message || 'Error al exportar PDF';
  }
}