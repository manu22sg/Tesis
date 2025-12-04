import api from './root.services.js';

export async function getDisponibilidadPorFecha(fecha, page = 1, limit = 10, extra = {}) {
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


export async function verificarDisponibilidadSesion(
  canchaId,
  fecha,
  horaInicio,
  horaFin,
  sesionIdExcluir = null,
  partidoIdExcluir = null
) {
  try {
    const params = { 
      canchaId, 
      fecha, 
      inicio: horaInicio, 
      fin: horaFin
    };

    if (sesionIdExcluir !== null) {
      params.sesionIdExcluir = sesionIdExcluir;
    }
    if(partidoIdExcluir !==null){
      params.partidoIdExcluir = partidoIdExcluir;
    }

    const response = await api.get('/horario/verificar-sesion', { params });
    console.log(response)
    return response.data;  
  } catch (error) {
    if (error.response?.status === 409) {
      return {
        disponible: false,
        message: error.response.data?.message || 'La cancha no está disponible',
      };
    }
    console.log(error);
    throw error;
  }
}

export async function verificarDisponibilidadReserva(
  canchaId,
  fecha,
  horaInicio,
  horaFin
) {
  try {
    const params = { canchaId, fecha, inicio: horaInicio, fin: horaFin };
    const response = await api.get('/horario/verificar-reserva', { params });
    
    // Si el servidor responde 200, significa que está disponible
    return {
      disponible: true,
      message: response.data?.message || 'Horario disponible',
      data: response.data
    };
  } catch (error) {
    console.log(error)
    // Si hay un error 409, significa que hay un conflicto (sesión u otra reserva)
    if (error.response?.status === 409) {
      return {
        disponible: false,
        message: error.response.data?.message || 'El horario no está disponible',
        motivo: error.response.data?.motivo || 'Conflicto de horario',
        conflictos: error.response.data?.conflictos || []
      };
    }
    
    // Si es error 400, hay un problema de validación
    if (error.response?.status === 400) {
      return {
        disponible: false,
        message: error.response.data?.message || 'Horario inválido',
        errores: error.response.data?.errores
      };
    }
    
    // Para otros errores, lanzar excepción
    throw error;
  }
}
