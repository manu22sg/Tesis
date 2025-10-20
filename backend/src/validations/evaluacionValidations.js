import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

// ----------------------------------------------------
// Validaciones base
// ----------------------------------------------------
const idNum = Joi.number().integer().positive().required().prefs({ convert: true });

// ----------------------------------------------------
// Crear evaluación
// ----------------------------------------------------
export const crearEvaluacionBody = Joi.object({
  jugadorId: idNum.label('jugadorId'),
  sesionId: Joi.number().integer().positive().required().messages({
    'any.required': 'sesionId es requerido',
  }),
  tecnica: Joi.number().integer().min(1).max(10).optional().allow(null),
  tactica: Joi.number().integer().min(1).max(10).optional().allow(null),
  actitudinal: Joi.number().integer().min(1).max(10).optional().allow(null),
  fisica: Joi.number().integer().min(1).max(10).optional().allow(null),
  observaciones: Joi.string().trim().max(2000).optional().allow(''),
})
  .custom((v, h) => {
    // al menos uno de los aspectos o una observación
    if (
      (v.tecnica ?? v.tactica ?? v.actitudinal ?? v.fisica) == null &&
      (!v.observaciones || !v.observaciones.trim())
    ) {
      return h.error('any.invalid', {
        message: 'Debe evaluar al menos un aspecto o escribir observaciones',
      });
    }
    return v;
  });

// ----------------------------------------------------
// Actualizar evaluación (ya no incluye id en el body)
// ----------------------------------------------------
export const actualizarEvaluacionBody = Joi.object({
  tecnica: Joi.number().integer().min(1).max(10).optional().allow(null),
  tactica: Joi.number().integer().min(1).max(10).optional().allow(null),
  actitudinal: Joi.number().integer().min(1).max(10).optional().allow(null),
  fisica: Joi.number().integer().min(1).max(10).optional().allow(null),
  observaciones: Joi.string().trim().max(2000).optional().allow(''),
})
  .min(1)
  .prefs({ convert: true })
  .messages({
    'object.min': 'Debe enviar al menos un campo para actualizar',
  });

// ----------------------------------------------------
// Query params para listar evaluaciones
// ----------------------------------------------------
export const obtenerEvaluacionesQuery = Joi.object({
  pagina: Joi.number().integer().min(1).default(1),
  limite: Joi.number().integer().min(1).max(50).default(10),
  desde: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({ 'string.pattern.base': 'desde debe ser YYYY-MM-DD' }),
  hasta: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({ 'string.pattern.base': 'hasta debe ser YYYY-MM-DD' }),
  sesionId: Joi.number().integer().positive().optional(),
});

// ----------------------------------------------------
// Validación de params (para id en URL)
// ----------------------------------------------------
export const idParamSchema = Joi.object({
  id: idNum.label('id'),
});

// ----------------------------------------------------
// Middlewares genéricos
// ----------------------------------------------------
export const validarBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return validationError(res, errors);
  }
  req.body = value;
  next();
};

export const validarQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return validationError(res, errors);
  }
  Object.assign(req.query, value);
  next();
};

export const validarParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return validationError(res, errors);
  }
  req.params = value;
  next();
};
