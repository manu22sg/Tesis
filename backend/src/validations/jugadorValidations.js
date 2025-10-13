import Joi from 'joi';
export const crearJugadorSchema = Joi.object({
  usuarioId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'usuarioId debe ser un número',
      'number.integer': 'usuarioId debe ser un número entero',
      'number.positive': 'usuarioId debe ser positivo',
      'any.required': 'usuarioId es requerido'
    }),

  carrera: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'carrera no puede tener más de 100 caracteres'
    }),

  telefono: Joi.string()
    .max(20)
    .optional()
    .messages({
      'string.max': 'telefono no puede tener más de 20 caracteres'
    }),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido')
    .default('activo')
    .messages({
      'any.only': 'estado debe ser: activo, inactivo o suspendido'
    }),

  fechaNacimiento: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'fechaNacimiento debe ser una fecha válida',
      'date.format': 'fechaNacimiento debe estar en formato ISO'
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

export const actualizarJugadorSchema = Joi.object({
  carrera: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'carrera no puede tener más de 100 caracteres'
    }),

  telefono: Joi.string()
    .max(20)
    .optional()
    .messages({
      'string.max': 'telefono no puede tener más de 20 caracteres'
    }),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido')
    .optional()
    .messages({
      'any.only': 'estado debe ser: activo, inactivo o suspendido'
    }),

  fechaNacimiento: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'fechaNacimiento debe ser una fecha válida',
      'date.format': 'fechaNacimiento debe estar en formato ISO'
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
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar'
});

