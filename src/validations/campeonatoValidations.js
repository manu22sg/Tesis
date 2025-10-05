import Joi from 'joi';
import { ESTADOS_CAMPEONATO, MODALIDADES, obtenerFormatosJuego } from '../utils/campeonatoHelper.js';

export const crearCampeonatoSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'El nombre del campeonato es obligatorio',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede exceder 100 caracteres',
  }), 
  descripcion: Joi.string().max(500).optional().allow(null, ''),
  fechaInicio: Joi.date().iso().required().messages({
    'date.base': 'La fecha de inicio debe ser válida',
    'any.required': 'La fecha de inicio es obligatoria',
  }),
  fechaFin: Joi.date().iso().greater(Joi.ref('fechaInicio')).optional().allow(null).messages({
    'date.greater': 'La fecha de fin debe ser posterior a la fecha de inicio',
  }),
  modalidad: Joi.string().valid(...Object.values(MODALIDADES)).required().messages({
    'any.only': `La modalidad debe ser una de: ${Object.values(MODALIDADES).join(', ')}`,
    'any.required': 'La modalidad es obligatoria',
  }),
  formatoJuego: Joi.string().valid(...obtenerFormatosJuego()).required().messages({
    'any.only': `El formato debe ser uno de: ${obtenerFormatosJuego().join(', ')}`,
    'any.required': 'El formato de juego es obligatorio',
  }),
});

export const actualizarCampeonatoSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).optional(),
  descripcion: Joi.string().max(500).optional().allow(null, ''),
  fechaInicio: Joi.date().iso().optional(),
  fechaFin: Joi.date().iso().optional().allow(null),
  estado: Joi.string().valid(...Object.values(ESTADOS_CAMPEONATO)).optional(),
  campeonId: Joi.number().integer().positive().optional().allow(null),
});