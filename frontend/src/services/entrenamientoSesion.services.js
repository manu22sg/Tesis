import api from './root.services.js';

// Crear entrenamiento
export async function crearEntrenamiento(data) {
  try {
    const res = await api.post('/entrenamientos', data);
    return res.data.data;
  } catch (error) {
    console.error("Error al crear entrenamiento:", error);
    throw error;
  }
}

// Obtener entrenamientos con filtros
export async function obtenerEntrenamientos(filtros = {}) {
  try {
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
  } catch (error) {
    console.error("Error al obtener entrenamientos:", error);
    throw error;
  }
}

// Obtener entrenamiento por ID
export async function obtenerEntrenamientoPorId(id) {
  try {
    const res = await api.get(`/entrenamientos/${id}`);
    return res.data.data;
  } catch (error) {
    console.error("Error al obtener entrenamiento por ID:", error);
    throw error;
  }
}

// Obtener entrenamientos por sesión
export async function obtenerEntrenamientosPorSesion(sesionId) {
  try {
    const res = await api.get(`/entrenamientos/sesion/${sesionId}`);
    return res.data.data;
  } catch (error) {
    console.error("Error al obtener entrenamientos por sesión:", error);
    throw error;
  }
}

// Actualizar entrenamiento
export async function actualizarEntrenamiento(id, datos) {
  try {
    const res = await api.patch(`/entrenamientos/${id}`, datos);
    return res.data.data;
  } catch (error) {
    console.error("Error al actualizar entrenamiento:", error);
    throw error;
  }
}

// Eliminar entrenamiento
export async function eliminarEntrenamiento(id) {
  try {
    const res = await api.delete(`/entrenamientos/${id}`);
    return res.data.data;
  } catch (error) {
    console.error("Error al eliminar entrenamiento:", error);
    throw error;
  }
}

// Reordenar entrenamientos
export async function reordenarEntrenamientos(sesionId, entrenamientos) {
  try {
    const res = await api.post('/entrenamientos/reordenar', {
      sesionId,
      entrenamientos
    });
    return res.data.data;
  } catch (error) {
    console.error("Error al reordenar entrenamientos:", error);
    throw error;
  }
}

// Duplicar entrenamiento
export async function duplicarEntrenamiento(id, nuevaSesionId = null) {
  try {
    const payload = nuevaSesionId ? { nuevaSesionId } : {};
    const res = await api.post(`/entrenamientos/${id}/duplicar`, payload);
    return res.data.data;
  } catch (error) {
    console.error("Error al duplicar entrenamiento:", error);
    throw error;
  }
}

// Obtener estadísticas
export async function obtenerEstadisticas(sesionId = null) {
  try {
    const query = sesionId ? `?sesionId=${sesionId}` : '';
    const res = await api.get(`/entrenamientos/estadisticas${query}`);
    return res.data.data;
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    throw error;
  }
}

// Asignar entrenamientos a una sesión
export async function asignarEntrenamientosASesion(sesionId, ids) {
  try {
    const res = await api.patch(`/entrenamientos/${sesionId}/asignar`, { ids });
    return res.data.data;
  } catch (error) {
    console.error("Error al asignar entrenamientos a sesión:", error);
    throw error;
  }
}

// ✅ NUEVAS FUNCIONES DE EXPORTACIÓN

// Exportar entrenamientos a Excel
export async function exportarEntrenamientosExcel(filtros = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filtros.q) params.append('q', filtros.q);
    if (filtros.sesionId) params.append('sesionId', filtros.sesionId);

    const res = await api.get(`/entrenamientos/export/excel?${params.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay entrenamientos para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `entrenamientos_${new Date().toISOString().split('T')[0]}.xlsx`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `entrenamientos_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando entrenamientos a Excel:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar entrenamientos a Excel');
      }
    }
    
    throw new Error(error.message || 'Error al exportar entrenamientos a Excel');
  }
}

// Exportar entrenamientos a PDF
export async function exportarEntrenamientosPDF(filtros = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filtros.q) params.append('q', filtros.q);
    if (filtros.sesionId) params.append('sesionId', filtros.sesionId);

    const res = await api.get(`/entrenamientos/export/pdf?${params.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay entrenamientos para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `entrenamientos_${new Date().toISOString().split('T')[0]}.pdf`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `entrenamientos_${new Date().toISOString().split('T')[0]}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando entrenamientos a PDF:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar entrenamientos a PDF');
      }
    }
    
    throw new Error(error.message || 'Error al exportar entrenamientos a PDF');
  }
}