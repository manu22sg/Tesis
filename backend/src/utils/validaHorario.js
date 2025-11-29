// utils/validaHorario.js

const toMin = t => { 
  const [h, m] = t.split(':').map(Number); 
  return h * 60 + m; 
};

/**
 * Valida horarios según configuración
 * @param {Object} value - Objeto con horaInicio y horaFin
 * @param {Object} helpers - Helpers de Joi para errores
 * @param {Object} cfg - Configuración del horario
 * @param {string} cfg.inicio - Hora de inicio (ej: '08:00')
 * @param {string} cfg.fin - Hora de fin (ej: '17:00' o '24:00')
 * @param {number} [cfg.duracionBloque] - Si se especifica, duración exacta requerida
 * @param {number} [cfg.duracionMinima] - Duración mínima (por defecto 30)
 * @param {number} [cfg.duracionMaxima] - Duración máxima (por defecto 180)
 * @param {boolean} [cfg.validarBloques] - Si true, valida bloques de reserva (08:00, 09:10, etc.)
 */
export default function validaHorario(value, helpers, cfg) {
  const { 
    inicio, 
    fin, 
    duracionBloque, 
    duracionMinima = 30, 
    duracionMaxima = 180,
    validarBloques = false 
  } = cfg;
  
  const i = toMin(value.horaInicio);
  const f = toMin(value.horaFin);
  const minInicio = toMin(inicio);
  const minFin = toMin(fin);

  // Validación: dentro del horario de funcionamiento
  if (i < minInicio || f > minFin) {
    const finDisplay = fin === '24:00' ? '00:00 (medianoche)' : fin;
    return helpers.error('any.invalid', { 
      message: `Horario fuera del funcionamiento (${inicio} - ${finDisplay})` 
    });
  }

  // Validación: hora fin mayor a hora inicio
  if (f <= i) {
    return helpers.error('any.invalid', { 
      message: 'La hora fin debe ser mayor a la hora inicio' 
    });
  }

  const dur = f - i;

  // Si se especifica duración exacta (RESERVAS)
  if (duracionBloque) {
    if (dur !== duracionBloque) {
      return helpers.error('any.invalid', { 
        message: `La duración debe ser exactamente ${duracionBloque} minutos` 
      });
    }

    // Validar bloques específicos de reserva (08:00, 09:10, 10:20, etc.)
    if (validarBloques) {
      const minutosDesdeLas8 = i - toMin('08:00');
      // Bloques válidos: 0, 70, 140, 210, 280, 350, 420, 490 (08:00, 09:10, 10:20, 11:30, 12:40, 13:50, 15:00, 16:10)
      if (minutosDesdeLas8 < 0 || minutosDesdeLas8 % 70 !== 0) {
        return helpers.error('any.invalid', { 
          message: 'Horarios válidos: 08:00, 09:10, 10:20, 11:30, 12:40, 13:50, 15:00, 16:10' 
        });
      }
    }
  } 
  // Si no hay duración exacta, validar min/max (SESIONES)
  else {
    if (dur < duracionMinima) {
      return helpers.error('any.invalid', { 
        message: `La sesión debe durar al menos ${duracionMinima} minutos` 
      });
    }

    if (dur > duracionMaxima) {
      return helpers.error('any.invalid', { 
        message: `La sesión no puede durar más de ${duracionMaxima} minutos` 
      });
    }
  }

  return true;
}