import api from './root.services.js';


export async function crearJugador(data) {
  try {
    const response = await api.post('/jugadores', data);
    return response.data.data;
  } catch (error) {
    console.error('Error creando jugador:', error);
    throw error;
  }
}


export async function obtenerJugadores(params = {}) {
  try {
    const response = await api.get('/jugadores', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo jugadores:', error);
    throw error;
  }
}


export async function obtenerJugadorPorId(id) {
  try {
    const response = await api.get(`/jugadores/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo jugador:', error);
    throw error;
  }
}


export async function actualizarJugador(id, data) {
  try {
    const response = await api.patch(`/jugadores/${id}`, data);
    return response.data.data;
  } catch (error) {
    console.error('Error actualizando jugador:', error);
    throw error;
  }
}


export async function eliminarJugador(id) {
  try {
    const response = await api.delete(`/jugadores/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando jugador:', error);
    throw error;
  }
}


export async function asignarJugadorAGrupo(jugadorId, grupoId) {
  try {
    const response = await api.post(`/jugadores/${jugadorId}/grupos/${grupoId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error asignando jugador a grupo:', error);
    throw error;
  }
}


export async function removerJugadorDeGrupo(jugadorId, grupoId) {
  try {
    const response = await api.delete(`/jugadores/${jugadorId}/grupos/${grupoId}`);
    return response.data;
  } catch (error) {
    console.error('Error removiendo jugador de grupo:', error);
    throw error;
  }
}

export async function exportarJugadoresExcel(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    
    // Primero intentamos obtener la respuesta
    const res = await api.get(`/jugadores/excel?${query}`, {
      responseType: 'blob', // Importante: decirle a axios que espere un blob
      // Pero axios aún puede recibir JSON si el servidor devuelve error
      validateStatus: (status) => status < 500 // Aceptar 404, 400, etc.
    });

    // Si recibimos un error JSON dentro de un blob, convertirlo
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay jugadores para exportar");
    }

    // 📱 Mobile → el servidor devuelve JSON con base64
    // Pero con responseType: 'blob', axios lo convierte en Blob
    // Entonces necesitamos leerlo como texto primero
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `jugadores_${Date.now()}.xlsx`
        };
      }
    }

    // 🖥️ Web → viene como blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `jugadores_${Date.now()}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando jugadores Excel:", error);
    
    // Manejar errores de red o del servidor
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error("Error al exportar Excel");
      }
    }
    
    throw new Error(error.message || "Error al exportar Excel");
  }
}

export async function exportarJugadoresPDF(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    
    const res = await api.get(`/jugadores/pdf?${query}`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    // Si recibimos un error JSON dentro de un blob
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay jugadores para exportar");
    }

    // 📱 Mobile → JSON con base64 (convertido a Blob por axios)
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `jugadores_${Date.now()}.pdf`
        };
      }
    }

    // 🖥️ Web → blob directo
    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `jugadores_${Date.now()}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando jugadores PDF:", error);
    
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      } catch {
        throw new Error("Error al exportar PDF");
      }
    }
    
    throw new Error(error.message || "Error al exportar PDF");
  }
}
