import api from './root.services.js';


export const crearAlineacion = async (datos) => {
  const response = await api.post('/alineaciones', datos);
  return response.data;
};


export const obtenerAlineacionPorSesion = async (sesionId) => {
  const response = await api.get(`/alineaciones/sesion/${sesionId}`);
  return response.data;
};


export const agregarJugadorAlineacion = async (datos) => {
  const response = await api.post('/alineaciones/jugador', datos);
  return response.data;
};


export const actualizarJugadorAlineacion = async (datos) => {
  const response = await api.patch('/alineaciones/jugador', datos);
  return response.data;
};

export const quitarJugadorAlineacion = async (alineacionId, jugadorId) => {
  const response = await api.delete(`/alineaciones/jugador/${alineacionId}/${jugadorId}`);
  return response.data;
};


export const eliminarAlineacion = async (id) => {
  const response = await api.delete(`/alineaciones/${id}`);
  return response.data;
};

export const actualizarPosicionesJugadores = async (alineacionId, jugadores) => {
  const response = await api.patch('/alineaciones/posiciones', {
    alineacionId,
    jugadores: jugadores.map(j => ({
      jugadorId: j.jugadorId,
      x: j.x,
      y: j.y
    }))
  });
  return response.data;
};

export async function exportarAlineacionExcel(sesionId) {
  try {
    const res = await api.get(`/alineaciones/excel/${sesionId}`, {
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

export async function exportarAlineacionPDF(sesionId) {
  try {
    const res = await api.get(`/alineaciones/pdf/${sesionId}`, {
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

export const generarAlineacionInteligente = async (datos) => {
  try {
    const response = await api.post('/alineaciones/inteligente', datos);
    return response.data;
  } catch (error) {
    console.log(error)
   // console.error("Error al generar la alineación inteligente:", error);
    throw error; // Puedes lanzar el error nuevamente si necesitas que se maneje en otro lugar
  }
};

// Obtener formaciones disponibles por tipo
export const obtenerFormacionesDisponibles = async (tipo) => {
  try {
    const response = await api.get(`/alineaciones/formaciones/${tipo}`);
    
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error('Error obteniendo formaciones:', error);
    throw error;
  }
};

