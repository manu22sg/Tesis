// validations/aprobacionValidations.js
import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

const DATE_YYYY_MM_DD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ESTADOS_RESERVA = ['pendiente', 'aprobada', 'rechazada', 'cancelada', 'completada'];

// === Schemas ===

// PATCH /api/reservas/aprobar - Aprobar reserva
export const aprobarReservaBody = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID debe ser un número',
      'number.integer': 'El ID debe ser un número entero',
      'number.positive': 'El ID debe ser mayor a 0',
      'any.required': 'El ID de la reserva es requerido'
    }),

  observacion: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.base': 'La observación debe ser texto',
      'string.max': 'La observación no puede exceder 500 caracteres'
    })
});

// PATCH /api/reservas/rechazar - Rechazar reserva
export const rechazarReservaBody = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID debe ser un número',
      'number.integer': 'El ID debe ser un número entero',
      'number.positive': 'El ID debe ser mayor a 0',
      'any.required': 'El ID de la reserva es requerido'
    }),

  motivoRechazo: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.base': 'El motivo de rechazo debe ser texto',
      'string.empty': 'El motivo de rechazo es obligatorio',
      'string.min': 'El motivo de rechazo debe tener al menos 10 caracteres',
      'string.max': 'El motivo de rechazo no puede exceder 500 caracteres',
      'any.required': 'El motivo de rechazo es obligatorio'
    })
});

// GET /api/reservas/pendientes - Obtener reservas pendientes
export const obtenerReservasPendientesBody = Joi.object({
  fecha: Joi.string()
    .pattern(DATE_YYYY_MM_DD)
    .optional()
    .messages({
      'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD'
    }),

  canchaId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'canchaId debe ser un número',
      'number.integer': 'canchaId debe ser un número entero',
      'number.positive': 'canchaId debe ser mayor a 0'
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'La página debe ser un número',
      'number.integer': 'La página debe ser un número entero',
      'number.min': 'La página debe ser mayor a 0'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .messages({
      'number.base': 'El límite debe ser un número',
      'number.integer': 'El límite debe ser un número entero',
      'number.min': 'El límite debe ser mayor a 0',
      'number.max': 'El límite no puede ser mayor a 50'
    })
});

// PATCH /api/reservas/cambiar-estado - Cambiar estado de reserva (función genérica)
export const cambiarEstadoReservaBody = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID debe ser un número',
      'number.integer': 'El ID debe ser un número entero',
      'number.positive': 'El ID debe ser mayor a 0',
      'any.required': 'El ID de la reserva es requerido'
    }),

  nuevoEstado: Joi.string()
    .valid(...ESTADOS_RESERVA)
    .required()
    .messages({
      'any.only': `El estado debe ser uno de: ${ESTADOS_RESERVA.join(', ')}`,
      'any.required': 'El nuevo estado es requerido'
    }),

  observacion: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.base': 'La observación debe ser texto',
      'string.max': 'La observación no puede exceder 500 caracteres'
    })
});

// POST /api/reservas/estadisticas - Obtener estadísticas (sin body, solo endpoint)
export const obtenerEstadisticasBody = Joi.object({
  // Endpoint sin parámetros requeridos, pero puede expandirse en el futuro
}).optional();

// === Middleware de validación ===
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { 
    abortEarly: false, 
    stripUnknown: true 
  });
  
  if (error) {
    const errores = error.details.reduce((acc, detail) => {
      const field = detail.path.join('.');
      const message = detail.context?.message || detail.message;
      acc[field] = message;
      return acc;
    }, {});

    return validationError(res, errores);
  }
  
  req.body = value;
  next();
};