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
