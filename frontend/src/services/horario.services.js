import axios from './root.services.js';

export async function getDisponibilidadPorFecha(fecha, page = 1, limit = 5) {
  try {
    const response = await axios.get('/horario/disponibilidad', {
      params: { fecha, page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getDisponibilidadPorRango(fechaInicio, fechaFin, page = 1, limit = 10) {
  try {
    const response = await axios.get('/horario/disponibilidad/rango', {
      params: { fechaInicio, fechaFin, page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}


export async function verificarDisponibilidad(canchaId, fecha, horaInicio, horaFin) {
  try {
    const response = await axios.get('/horario/verificar', {
      params: { canchaId, fecha, horaInicio, horaFin }
    });
    return response.data; // { disponible: true }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('Cancha no disponible:', error.response.data);
      return {
        disponible: false,
        message: error.response.data?.message || 'La cancha no está disponible',
      };
    }

    console.log('Error verificando disponibilidad:', error);
    throw error;
  }
}
