import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';
export const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID debe ser un número',
      'number.integer': 'ID debe ser un número entero',
      'number.positive': 'ID debe ser positivo',
      'any.required': 'ID es requerido'
    })
});

export const paginacionSchema = Joi.object({
  pagina: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'pagina debe ser un número',
      'number.integer': 'pagina debe ser un número entero',
      'number.min': 'pagina debe ser mayor a 0'
    }),

  limite: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'limite debe ser un número',
      'number.integer': 'limite debe ser un número entero',
      'number.min': 'limite debe ser mayor a 0',
      'number.max': 'limite debe ser menor o igual a 100'
    }),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido')
    .optional()
    .messages({
      'any.only': 'estado debe ser: activo, inactivo o suspendido'
    }),

  carrera: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'carrera no puede tener más de 100 caracteres'
    }),

  anioIngreso: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .optional()
    .messages({
      'number.base': 'anioIngreso debe ser un número',
      'number.integer': 'anioIngreso debe ser un número entero',
      'number.min': 'anioIngreso debe ser mayor a 1900',
      'number.max': `anioIngreso debe ser menor a ${new Date().getFullYear() + 10}`
    })
});

export const grupoParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID debe ser un número',
      'number.integer': 'ID debe ser un número entero',
      'number.positive': 'ID debe ser positivo',
      'any.required': 'ID es requerido'
    }),
  grupoId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'grupoId debe ser un número',
      'number.integer': 'grupoId debe ser un número entero',
      'number.positive': 'grupoId debe ser positivo',
      'any.required': 'grupoId es requerido'
    })
});

export const validarBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return validationError(res, errors);
    }

    req.body = value;
    next();
  };
};

export const validarParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return validationError(res, errors);
    }

    req.params = value;
    next();
  };
};

export const validarQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return validationError(res, errors);
    }

    Object.assign(req.query, value);

    next();
  };
};