import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

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

// ✅ Reglas comunes
const tarjetasSchema = {
  tarjetasAmarillas: Joi.number().integer().min(0).max(2).default(0).messages({
    'number.max': 'No puede tener más de 2 tarjetas amarillas',
  }),
  tarjetasRojas: Joi.number().integer().min(0).max(1).default(0).messages({
    'number.max': 'No puede tener más de 1 tarjeta roja',
  }),
};

// ✅ Crear estadística
export const crearEstadisticaBody = Joi.object({
  partidoId: NUM_POSITIVE.required().messages({
    'any.required': 'El ID del partido es requerido',
  }),
  jugadorCampeonatoId: NUM_POSITIVE.required().messages({
    'any.required': 'El ID del jugador es requerido',
  }),
  goles: NUM_MIN_ZERO.default(0),
  asistencias: NUM_MIN_ZERO.default(0),
  atajadas: NUM_MIN_ZERO.default(0),
  ...tarjetasSchema,
  minutosJugados: Joi.number().integer().min(0).max(120).default(90).messages({
    'number.max': 'No puede exceder 120 minutos',
  }),
}).custom((value, helpers) => {
  const y = value.tarjetasAmarillas;
  const r = value.tarjetasRojas;

  // ✅ Lógica futbolística
  if (y === 2 && r !== 1) {
    return helpers.message('Con 2 amarillas debe haber 1 roja (expulsión por doble amarilla)');
  }
  if (r === 1 && !(y === 0 || y === 2)) {
    return helpers.message('Si hay roja, las amarillas deben ser 0 o 2');
  }

  return value;
});

// ✅ Actualizar estadística (valores opcionales)
export const actualizarEstadisticaBody = Joi.object({
  goles: NUM_MIN_ZERO.optional(),
  asistencias: NUM_MIN_ZERO.optional(),
  atajadas: NUM_MIN_ZERO.optional(),
  tarjetasAmarillas: tarjetasSchema.tarjetasAmarillas.optional(),
  tarjetasRojas: tarjetasSchema.tarjetasRojas.optional(),
  minutosJugados: Joi.number().integer().min(0).max(120).optional().messages({
    'number.max': 'No puede exceder 120 minutos',
  }),
}).custom((value, helpers) => {
  const y = value.tarjetasAmarillas;
  const r = value.tarjetasRojas;

  // Solo validar si ambos vienen informados
  if (y !== undefined && r !== undefined) {
    if (y === 2 && r !== 1) {
      return helpers.message('Con 2 amarillas debe haber 1 roja (expulsión por doble amarilla)');
    }
    if (r === 1 && !(y === 0 || y === 2)) {
      return helpers.message('Si hay roja, las amarillas deben ser 0 o 2');
    }
  }

  return value;
});

export const eliminarEstadisticaBody = Joi.object({
  id: NUM_POSITIVE.required().messages({
    'any.required': 'El ID es requerido',
  }),
});

export const obtenerEstadisticasQuery = Joi.object({
  partidoId: NUM_POSITIVE.optional(),
  jugadorCampeonatoId: NUM_POSITIVE.optional(),
  equipoId: NUM_POSITIVE.optional(),
});

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

function formatErrors(error) {
  return error.details.reduce((acc, d) => {
    acc[d.path.join('.')] = d.context?.message || d.message;
    return acc;
  }, {});
}
