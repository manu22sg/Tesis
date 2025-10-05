import Joi from 'joi';
import { ESTADOS_PARTIDO } from '../utils/campeonatoHelper.js';

export const asignarFechaPartidoSchema = Joi.object({
  fecha: Joi.date().iso().required().messages({
    'date.base': 'La fecha debe ser válida',
    'any.required': 'La fecha es obligatoria',
  }),
  horaInicio: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
    'string.pattern.base': 'Formato de hora inválido (HH:MM)',
    'any.required': 'La hora de inicio es obligatoria',
  }),
  horaFin: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
    'string.pattern.base': 'Formato de hora inválido (HH:MM)',
    'any.required': 'La hora de fin es obligatoria',
  }),
  canchaId: Joi.number().integer().positive().required().messages({
    'number.base': 'El ID de la cancha debe ser un número',
    'any.required': 'La cancha es obligatoria',
  }),
});

export const registrarResultadoSchema = Joi.object({
  golesEquipo1: Joi.number().integer().min(0).required(),
  golesEquipo2: Joi.number().integer().min(0).required(),
  //  Penales opcionales
  penalesEquipo1: Joi.number().integer().min(0).optional().allow(null),
  penalesEquipo2: Joi.number().integer().min(0).optional().allow(null),
  ganadorId: Joi.number().integer().positive().required(),
  observaciones: Joi.string().max(500).optional().allow(null, ''),
}).custom((value, helpers) => {
  // Si hay empate en tiempo regular, los penales son obligatorios
  if (value.golesEquipo1 === value.golesEquipo2) {
    if (value.penalesEquipo1 === undefined || value.penalesEquipo2 === undefined) {
      return helpers.error('any.custom', { 
        message: 'En caso de empate, debe registrar el resultado de los penales' 
      });
    }
    
    // Validar que no haya empate en penales
    if (value.penalesEquipo1 === value.penalesEquipo2) {
      return helpers.error('any.custom', { 
        message: 'No puede haber empate en la tanda de penales' 
      });
    }
    
    
  }
  
  return value;
});
