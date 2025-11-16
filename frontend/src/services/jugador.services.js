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
    const res = await api.get(`/jugadores/excel?${query}`, {
      responseType: "blob"
    });
    
    if (res.data.type === 'application/json') {
      const text = await res.data.text();
      const error = JSON.parse(text);
      throw new Error(error.message || 'Error al exportar Excel');
    }
    
    return res.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Error al exportar Excel');
      } catch {
        throw new Error('Error al exportar Excel');
      }
    }
    throw error;
  }
}

export async function exportarJugadoresPDF(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/jugadores/pdf?${query}`, {
      responseType: "blob"
    });
    
    if (res.data.type === 'application/json') {
      const text = await res.data.text();
      const error = JSON.parse(text);
      throw new Error(error.message || 'Error al exportar PDF');
    }
    
    return res.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Error al exportar PDF');
      } catch {
        throw new Error('Error al exportar PDF');
      }
    }
    throw error;
  }
}
