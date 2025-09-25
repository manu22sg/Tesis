import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

// Estados válidos para las canchas
const ESTADOS_CANCHA = ['disponible', 'mantenimiento', 'fuera_servicio'];

// === Schemas ===

// POST /api/canchas - Crear cancha
export const crearCanchaBody = Joi.object({
  nombre: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': 'El nombre debe ser texto',
      'string.empty': 'El nombre es requerido',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres'
    }),

  descripcion: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.base': 'La descripción debe ser texto',
      'string.max': 'La descripción no puede exceder 500 caracteres'
    }),

  capacidadMaxima: Joi.number()
    .integer()
    .min(2)
    .max(30)
    .optional()
    .default(12)
    .messages({
      'number.base': 'La capacidad debe ser un número',
      'number.integer': 'La capacidad debe ser un número entero',
      'number.min': 'La capacidad mínima es 2 jugadores',
      'number.max': 'La capacidad máxima es 30 jugadores'
    }),

  estado: Joi.string()
    .valid(...ESTADOS_CANCHA)
    .optional()
    .default('disponible')
    .messages({
      'any.only': `El estado debe ser uno de: ${ESTADOS_CANCHA.join(', ')}`
    })
});

// PUT /api/canchas - Actualizar cancha (incluye ID en body)
export const actualizarCanchaBody = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID debe ser un número',
      'number.integer': 'El ID debe ser un número entero',
      'number.positive': 'El ID debe ser mayor a 0',
      'any.required': 'El ID es requerido'
    }),

  nombre: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.base': 'El nombre debe ser texto',
      'string.empty': 'El nombre no puede estar vacío',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres'
    }),

  descripcion: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.base': 'La descripción debe ser texto',
      'string.max': 'La descripción no puede exceder 500 caracteres'
    }),

  capacidadMaxima: Joi.number()
    .integer()
    .min(2)
    .max(30)
    .optional()
    .messages({
      'number.base': 'La capacidad debe ser un número',
      'number.integer': 'La capacidad debe ser un número entero',
      'number.min': 'La capacidad mínima es 2 jugadores',
      'number.max': 'La capacidad máxima es 30 jugadores'
    }),

  estado: Joi.string()
    .valid(...ESTADOS_CANCHA)
    .optional()
    .messages({
      'any.only': `El estado debe ser uno de: ${ESTADOS_CANCHA.join(', ')}`
    })
});

// GET /api/canchas - Obtener canchas (incluye filtros y paginación en body)
export const obtenerCanchasBody = Joi.object({
  estado: Joi.string()
    .valid(...ESTADOS_CANCHA)
    .optional()
    .messages({
      'any.only': `El estado debe ser uno de: ${ESTADOS_CANCHA.join(', ')}`
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
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'El límite debe ser un número',
      'number.integer': 'El límite debe ser un número entero',
      'number.min': 'El límite debe ser mayor a 0',
      'number.max': 'El límite no puede ser mayor a 100'
    })
});

// GET /api/canchas/detalle - Obtener cancha por ID
export const obtenerCanchaPorIdBody = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID debe ser un número',
      'number.integer': 'El ID debe ser un número entero',
      'number.positive': 'El ID debe ser mayor a 0',
      'any.required': 'El ID es requerido'
    })
});

// DELETE /api/canchas/eliminar - Eliminar cancha
export const eliminarCanchaBody = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID debe ser un número',
      'number.integer': 'El ID debe ser un número entero',
      'number.positive': 'El ID debe ser mayor a 0',
      'any.required': 'El ID es requerido'
    })
});

// PATCH /api/canchas/reactivar - Reactivar cancha
export const reactivarCanchaBody = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID debe ser un número',
      'number.integer': 'El ID debe ser un número entero',
      'number.positive': 'El ID debe ser mayor a 0',
      'any.required': 'El ID es requerido'
    })
});

// === Middleware de validación ===
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { 
    abortEarly: false, 
    stripUnknown: true 
  });

  if (error) {
    const errores = error.details.reduce((acc, detail) => {
      const field = detail.path.join('.');
      acc[field] = detail.message;
      return acc;
    }, {});

    return validationError(res, errores);
  }

  req.body = value;
  next();
};