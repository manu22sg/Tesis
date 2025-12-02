import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

const GENERO_VALIDO = ['masculino', 'femenino', 'mixto'];

export const crearEquipoBody = Joi.object({
  campeonatoId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del campeonato debe ser un número',
      'number.integer': 'El ID del campeonato debe ser un número entero',
      'number.positive': 'El ID del campeonato debe ser positivo',
      'any.required': 'El ID del campeonato es obligatorio'
    }),
  
  nombre: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.base': 'El nombre debe ser un texto',
      'string.empty': 'El nombre no puede estar vacío',
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'any.required': 'El nombre del equipo es obligatorio'
    }),
  
  carreraId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID de la carrera debe ser un número',
      'number.integer': 'El ID de la carrera debe ser un número entero',
      'number.positive': 'El ID de la carrera debe ser positivo',
      'any.required': 'La carrera es obligatoria'
    }),

  tipo: Joi.string()
    .lowercase()
    .valid(...GENERO_VALIDO)
    .required()
    .messages({
      'string.base': 'El tipo debe ser un texto',
      'any.only': 'El tipo debe ser masculino, femenino o mixto',
      'any.required': 'El tipo del equipo es obligatorio'
    }),
});

export const actualizarEquipoBody = Joi.object({
  nombre: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .messages({
      'string.base': 'El nombre debe ser un texto',
      'string.empty': 'El nombre no puede estar vacío',
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres'
    }),
  
  carreraId: Joi.number()
    .integer()
    .positive()
    .messages({
      'number.base': 'El ID de la carrera debe ser un número',
      'number.integer': 'El ID de la carrera debe ser un número entero',
      'number.positive': 'El ID de la carrera debe ser positivo'
    }),

  tipo: Joi.string()
    .lowercase()
    .valid(...GENERO_VALIDO)
    .messages({
      'string.base': 'El tipo debe ser un texto',
      'any.only': 'El tipo debe ser masculino, femenino o mixto'
    }),
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar'
});

export const agregarUsuarioEquipoBody = Joi.object({
  campeonatoId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del campeonato debe ser un número',
      'number.integer': 'El ID del campeonato debe ser un número entero',
      'number.positive': 'El ID del campeonato debe ser positivo',
      'any.required': 'El ID del campeonato es obligatorio'
    }),
  
  equipoId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del equipo debe ser un número',
      'number.integer': 'El ID del equipo debe ser un número entero',
      'number.positive': 'El ID del equipo debe ser positivo',
      'any.required': 'El ID del equipo es obligatorio'
    }),
  
  usuarioId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del usuario debe ser un número',
      'number.integer': 'El ID del usuario debe ser un número entero',
      'number.positive': 'El ID del usuario debe ser positivo',
      'any.required': 'El usuario es obligatorio'
    }),
  
  numeroCamiseta: Joi.number()
    .integer()
    .min(1)
    .max(99)
    .allow(null)
    .optional()
    .messages({
      'number.base': 'El número de camiseta debe ser un número',
      'number.integer': 'El número de camiseta debe ser un número entero',
      'number.min': 'El número de camiseta debe ser al menos 1',
      'number.max': 'El número de camiseta no puede ser mayor a 99'
    }),
  
  posicion: Joi.string()
    .trim()
    .max(50)
    .allow(null)
    .optional()
    .messages({
      'string.base': 'La posición debe ser un texto',
      'string.max': 'La posición no puede exceder 50 caracteres'
    }),
});

export const quitarUsuarioEquipoParams = Joi.object({
  campeonatoId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del campeonato debe ser un número',
      'number.integer': 'El ID del campeonato debe ser un número entero',
      'number.positive': 'El ID del campeonato debe ser positivo',
      'any.required': 'El ID del campeonato es obligatorio'
    }),
  
  equipoId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del equipo debe ser un número',
      'number.integer': 'El ID del equipo debe ser un número entero',
      'number.positive': 'El ID del equipo debe ser positivo',
      'any.required': 'El ID del equipo es obligatorio'
    }),
  
  usuarioId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del usuario debe ser un número',
      'number.integer': 'El ID del usuario debe ser un número entero',
      'number.positive': 'El ID del usuario debe ser positivo',
      'any.required': 'El ID del usuario es obligatorio'
    }),
});

// Middleware genérico
export const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) return validationError(res, formatErrors(error));
  req.params = value;
  next();
};

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) return validationError(res, formatErrors(error));
  req.body = value;
  next();
};

function formatErrors(error) {
  return error.details.reduce((acc, d) => {
    acc[d.path.join('.')] = d.context?.message || d.message;
    return acc;
  }, {});
}