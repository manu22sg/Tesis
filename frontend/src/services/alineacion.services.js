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
      responseType: "blob",
      validateStatus: (status) => status < 500
    });

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay jugadores en la alineación");
    }

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `alineacion_sesion_${sesionId}.xlsx`
        };
      }
    }

    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `alineacion_sesion_${sesionId}.xlsx`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando alineación Excel:", error);
    
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

export async function exportarAlineacionPDF(sesionId) {
  try {
    const res = await api.get(`/alineaciones/pdf/${sesionId}`, {
      responseType: "blob",
      validateStatus: (status) => status < 500
    });

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "No hay jugadores en la alineación");
    }

    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.success && jsonData.base64) {
        return {
          modo: "mobile",
          base64: jsonData.base64,
          nombre: jsonData.fileName || `alineacion_sesion_${sesionId}.pdf`
        };
      }
    }

    if (res.data instanceof Blob) {
      return {
        modo: "web",
        blob: res.data,
        nombre: `alineacion_sesion_${sesionId}.pdf`
      };
    }

    throw new Error("Respuesta inesperada del servidor");

  } catch (error) {
    console.error("Error exportando alineación PDF:", error);
    
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

