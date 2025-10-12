import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

// patrones básicos con mensajes en español
const NUM_POSITIVE = Joi.number().integer().positive().messages({
  'number.base': 'Debe ser un número',
  'number.integer': 'Debe ser un número entero',
  'number.positive': 'Debe ser un número positivo',
});

const NUM_MIN_ZERO = Joi.number().integer().min(0).messages({
  'number.base': 'Debe ser un número',
  'number.integer': 'Debe ser un número entero',
  'number.min': 'No puede ser negativo',
});

const ESTADISTICAS_VALIDAS = [
  'goles', 'asistencias', 'amarillas', 'rojas',
  'tiros', 'faltas', 'atajadas', 'minutosJugados',
];

/**
 * POST /api/estadisticas
 * Asigna estadísticas a un jugador en un partido.
 */
export const crearEstadisticaBody = Joi.object({
  partidoId: NUM_POSITIVE.required().messages({
    'any.required': 'El ID del partido es requerido',
  }),
  jugadorCampeonatoId: NUM_POSITIVE.required().messages({
    'any.required': 'El ID del jugador es requerido',
  }),
  goles: NUM_MIN_ZERO.default(0),
  asistencias: NUM_MIN_ZERO.default(0),
  amarillas: Joi.number().integer().min(0).max(2).default(0).messages({
    'number.base': 'Debe ser un número',
    'number.integer': 'Debe ser un número entero',
    'number.min': 'No puede ser negativo',
    'number.max': 'No puede tener más de 2 tarjetas amarillas',
  }),
  rojas: Joi.number().integer().min(0).max(1).default(0).messages({
    'number.base': 'Debe ser un número',
    'number.integer': 'Debe ser un número entero',
    'number.min': 'No puede ser negativo',
    'number.max': 'No puede tener más de 1 tarjeta roja',
  }),
  tiros: NUM_MIN_ZERO.optional(),
  faltas: NUM_MIN_ZERO.optional(),
  atajadas: NUM_MIN_ZERO.optional(),
  minutosJugados: Joi.number().integer().min(0).max(120).optional().messages({
    'number.base': 'Debe ser un número',
    'number.integer': 'Debe ser un número entero',
    'number.min': 'No puede ser negativo',
    'number.max': 'No puede exceder 120 minutos',
  }),
}).custom((value, helpers) => {
  // si tiene roja, no puede tener más de 1 amarilla
  if (value.rojas > 0 && value.amarillas > 1) {
    return helpers.error('any.invalid', {
      message: 'Un jugador expulsado no puede tener más de una amarilla',
    });
  }
  return value;
});

/**
 *  PATCH   /api/estadisticas/:id
 * Actualiza estadísticas de un jugador.
 */
export const actualizarEstadisticaBody = Joi.object({
  goles: NUM_MIN_ZERO.optional(),
  asistencias: NUM_MIN_ZERO.optional(),
  amarillas: Joi.number().integer().min(0).max(2).optional().messages({
    'number.base': 'Debe ser un número',
    'number.integer': 'Debe ser un número entero',
    'number.min': 'No puede ser negativo',
    'number.max': 'No puede tener más de 2 tarjetas amarillas',
  }),
  rojas: Joi.number().integer().min(0).max(1).optional().messages({
    'number.base': 'Debe ser un número',
    'number.integer': 'Debe ser un número entero',
    'number.min': 'No puede ser negativo',
    'number.max': 'No puede tener más de 1 tarjeta roja',
  }),
  tiros: NUM_MIN_ZERO.optional(),
  faltas: NUM_MIN_ZERO.optional(),
  atajadas: NUM_MIN_ZERO.optional(),
  minutosJugados: Joi.number().integer().min(0).max(120).optional().messages({
    'number.base': 'Debe ser un número',
    'number.integer': 'Debe ser un número entero',
    'number.min': 'No puede ser negativo',
    'number.max': 'No puede exceder 120 minutos',
  }),
}).custom((value, helpers) => {
  if (value.rojas > 0 && value.amarillas > 1) {
    return helpers.error('any.invalid', {
      message: 'No puede tener más de una amarilla si fue expulsado',
    });
  }
  return value;
});

/**
 * GET /api/estadisticas
 * Filtra por partido, jugador, o ambos.
 */
export const obtenerEstadisticasQuery = Joi.object({
  partidoId: NUM_POSITIVE.optional(),
  jugadorCampeonatoId: NUM_POSITIVE.optional(),
  equipoId: NUM_POSITIVE.optional(),
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Debe ser un número',
    'number.integer': 'Debe ser un número entero',
    'number.min': 'La página debe ser mayor a 0',
  }),
  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    'number.base': 'Debe ser un número',
    'number.integer': 'Debe ser un número entero',
    'number.min': 'El límite debe ser mayor a 0',
    'number.max': 'El límite no puede exceder 50',
  }),
});

/**
 *  DELETE /api/estadisticas/:id
 */
export const eliminarEstadisticaBody = Joi.object({
  id: NUM_POSITIVE.required().messages({
    'any.required': 'El ID es requerido',
  }),
});

// middleware genérico
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return validationError(res, formatErrors(error));
  req.body = value;
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return validationError(res, formatErrors(error));
  Object.assign(req.query, value);
  next();
};

// formateador
function formatErrors(error) {
  return error.details.reduce((acc, d) => {
    acc[d.path.join('.')] = d.context?.message || d.message;
    return acc;
  }, {});
}