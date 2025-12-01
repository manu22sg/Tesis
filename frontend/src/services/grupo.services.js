import api from './root.services.js';

// Obtener todos los grupos
export const obtenerGrupos = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.nombre) params.append('nombre', filtros.nombre);
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);

    const response = await api.get(`/grupos?${params.toString()}`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Error al obtener grupos';
    console.error('Error en obtenerGrupos:', error.response?.data || error);
    throw errorMsg;
  }
};


// Crear grupo
export async function crearGrupo(datos) {
  try {
    const res = await api.post('/grupos', datos);
    return res.data.data;
  } catch (error) {
    console.error("Error al crear grupo:", error);
    throw error;
  }
}

// Obtener grupo por ID
export async function obtenerGrupoPorId(id) {
  try {
    const res = await api.get(`/grupos/${id}`);
    return res.data.data;
  } catch (error) {
    console.error("Error al obtener grupo por ID:", error);
    throw error;
  }
}

// Actualizar grupo
export async function actualizarGrupo(id, datos) {
  try {
    const res = await api.patch(`/grupos/${id}`, datos);
    return res.data.data;
  } catch (error) {
    console.error("Error al actualizar grupo:", error);
    throw error;
  }
}

// Eliminar grupo
export async function eliminarGrupo(id) {
  try {
    const res = await api.delete(`/grupos/${id}`);
    return res.data.data;
  } catch (error) {
    console.error("Error al eliminar grupo:", error);
    throw error;
  }
}

export async function exportarGruposExcel(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.nombre) params.append('nombre', filtros.nombre);
    if (filtros.q) params.append('q', filtros.q);

    const res = await api.get(`/grupos/export/excel?${params.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay grupos para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `grupos_${new Date().toISOString().split('T')[0]}.xlsx`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `grupos_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando grupos a Excel:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar grupos a Excel');
      }
    }
    
    throw new Error(error.message || 'Error al exportar grupos a Excel');
  }
}

export async function exportarGruposPDF(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.nombre) params.append('nombre', filtros.nombre);
    if (filtros.q) params.append('q', filtros.q);

    const res = await api.get(`/grupos/export/pdf?${params.toString()}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay grupos para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `grupos_${new Date().toISOString().split('T')[0]}.pdf`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `grupos_${new Date().toISOString().split('T')[0]}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error('Error exportando grupos a PDF:', error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Error al exportar grupos a PDF');
      }
    }
    
    throw new Error(error.message || 'Error al exportar grupos a PDF');
  }
}

export const obtenerEstadisticasEntrenador = async () => {
  try {
    const response = await api.get('/grupos/estadisticas');
    return response.data;
  } catch (error) {
    console.error('Error al obtener las estadísticas del entrenador:', error);
    throw error; 
  }
};

