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
    console.error(error.response?.data.message);
    throw error.response?.data.message;
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


export async function exportarSesionesExcel(filtros = {}) {
  try {
    const params = new URLSearchParams();
    
    // Agregar todos los filtros
    if (filtros.q) params.append('q', filtros.q);
    if (filtros.fecha) params.append('fecha', filtros.fecha);
    if (filtros.horaInicio) params.append('horaInicio', filtros.horaInicio);
    if (filtros.horaFin) params.append('horaFin', filtros.horaFin);
    if (filtros.canchaId) params.append('canchaId', filtros.canchaId);
    if (filtros.grupoId) params.append('grupoId', filtros.grupoId);
    if (filtros.tipoSesion) params.append('tipoSesion', filtros.tipoSesion);

    const res = await api.get(`/sesion/excel?${params.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay sesiones para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `sesiones_${Date.now()}.xlsx`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `sesiones_${Date.now()}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando sesiones a Excel:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar sesiones a Excel');
      }
    }
    
    throw new Error(error.message || 'Error al exportar sesiones a Excel');
  }
}

export async function exportarSesionesPDF(filtros = {}) {
  try {
    const params = new URLSearchParams();
    
    // Agregar todos los filtros
    if (filtros.q) params.append('q', filtros.q);
    if (filtros.fecha) params.append('fecha', filtros.fecha);
    if (filtros.horaInicio) params.append('horaInicio', filtros.horaInicio);
    if (filtros.horaFin) params.append('horaFin', filtros.horaFin);
    if (filtros.canchaId) params.append('canchaId', filtros.canchaId);
    if (filtros.grupoId) params.append('grupoId', filtros.grupoId);
    if (filtros.tipoSesion) params.append('tipoSesion', filtros.tipoSesion);

    const res = await api.get(`/sesion/pdf?${params.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay sesiones para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `sesiones_${Date.now()}.pdf`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `sesiones_${Date.now()}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando sesiones a PDF:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar sesiones a PDF');
      }
    }
    
    throw new Error(error.message || 'Error al exportar sesiones a PDF');
  }
}
