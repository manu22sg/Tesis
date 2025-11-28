import api from './root.services.js';

export async function getDisponibilidadPorFecha(fecha, page = 1, limit = 5, extra = {}) {
  try {
    const response = await api.get('/horario/disponibilidad', {
      params: { fecha, page, limit, ...extra } 
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}


export async function verificarDisponibilidad(
  canchaId,
  fecha,
  horaInicio,
  horaFin,
  sesionIdExcluir = null
) {
  try {
    const params = { canchaId, fecha, inicio: horaInicio, fin: horaFin };

    if (sesionIdExcluir !== null) {
      params.sesionIdExcluir = sesionIdExcluir;
    }

    const response = await api.get('/horario/verificar', { params });

    return response.data;  
  } catch (error) {
    if (error.response?.status === 409) {
      return {
        disponible: false,
        message: error.response.data?.message || 'La cancha no está disponible',
      };
    }

    throw error;
  }
}
