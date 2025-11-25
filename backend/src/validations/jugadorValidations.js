import Joi from 'joi';

const POSICIONES_VALIDAS = [
  'Portero',
  'Defensa Central',
  'Defensa Central Derecho',   
  'Defensa Central Izquierdo', 
  'Lateral Derecho',
  'Lateral Izquierdo',
  'Mediocentro Defensivo',
  'Mediocentro',
  'Mediocentro Ofensivo',
  'Extremo Derecho',
  'Extremo Izquierdo',
  'Delantero Centro'
];

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

  posicion: Joi.string()
    .max(50)
    .valid(...POSICIONES_VALIDAS)
    .optional()
    .messages({
      'any.only': `posicion debe ser una de: ${POSICIONES_VALIDAS.join(', ')}`,
      'string.max': 'posicion no puede exceder 50 caracteres'
    }),

  posicionSecundaria: Joi.string()
    .max(50)
    .valid(...POSICIONES_VALIDAS)
    .optional()
    .messages({
      'any.only': `posicionSecundaria debe ser una de: ${POSICIONES_VALIDAS.join(', ')}`,
      'string.max': 'posicionSecundaria no puede exceder 50 caracteres'
    }),

  piernaHabil: Joi.string()
    .valid('Derecha', 'Izquierda', 'Ambas')
    .optional()
    .allow(null, '')
    .messages({
      'any.only': 'piernaHabil debe ser: Derecha, Izquierda o Ambas'
    }),

  altura: Joi.number()
    .precision(2)
    .min(100)
    .max(250)
    .optional()
    .messages({
      'number.base': 'altura debe ser un número',
      'number.min': 'altura debe ser al menos 100 cm',
      'number.max': 'altura debe ser máximo 250 cm'
    }),

  peso: Joi.number()
    .precision(2)
    .min(30)
    .max(200)
    .optional()
    .messages({
      'number.base': 'peso debe ser un número',
      'number.min': 'peso debe ser al menos 30 kg',
      'number.max': 'peso debe ser máximo 200 kg'
    }),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido', 'lesionado')
    .default('activo')
    .messages({
      'any.only': 'estado debe ser: activo, inactivo, suspendido o lesionado'
    }),

  fechaNacimiento: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.max': 'fechaNacimiento no puede ser en el futuro'
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
  posicion: Joi.string()
    .max(50)
    .valid(...POSICIONES_VALIDAS)
    .optional()
    .allow(null, '')
    .messages({
      'any.only': `posicion debe ser una de: ${POSICIONES_VALIDAS.join(', ')}`,
      'string.max': 'posicion no puede exceder 50 caracteres'
    }),

  posicionSecundaria: Joi.string()
    .max(50)
    .valid(...POSICIONES_VALIDAS)
    .optional()
    .allow(null, '')
    .messages({
      'any.only': `posicionSecundaria debe ser una de: ${POSICIONES_VALIDAS.join(', ')}`,
      'string.max': 'posicionSecundaria no puede exceder 50 caracteres'
    }),

  piernaHabil: Joi.string()
    .valid('Derecha', 'Izquierda', 'Ambas')
    .optional()
    .allow(null, '')
    .messages({
      'any.only': 'piernaHabil debe ser: Derecha, Izquierda o Ambas'
    }),

  altura: Joi.number()
    .precision(2)
    .min(100)
    .max(250)
    .optional()
    .allow(null, '')
    .messages({
      'number.base': 'altura debe ser un número',
      'number.min': 'altura debe ser al menos 100 cm',
      'number.max': 'altura debe ser máximo 250 cm'
    }),

  peso: Joi.number()
    .precision(2)
    .min(30)
    .max(200)
    .optional()
    .allow(null, '')
    .messages({
      'number.base': 'peso debe ser un número',
      'number.min': 'peso debe ser al menos 30 kg',
      'number.max': 'peso debe ser máximo 200 kg'
    }),

  imc: Joi.number()
    .precision(2)
    .min(10)
    .max(50)
    .optional()
    .allow(null, '')
    .messages({
      'number.base': 'imc debe ser un número',
      'number.min': 'imc debe ser al menos 10',
      'number.max': 'imc debe ser máximo 50'
    }),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido', 'lesionado')
    .optional()
    .allow(null, '')
    .messages({
      'any.only': 'estado debe ser: activo, inactivo, suspendido o lesionado'
    }),

  fechaNacimiento: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.max': 'fechaNacimiento no puede ser en el futuro'
    }),

  anioIngreso: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .optional()
    .allow(null, '')
    .messages({
      'number.base': 'anioIngreso debe ser un número',
      'number.integer': 'anioIngreso debe ser un número entero',
      'number.min': 'anioIngreso debe ser mayor a 1900',
      'number.max': `anioIngreso debe ser menor a ${new Date().getFullYear() + 10}`
    })
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar'
  });

export { POSICIONES_VALIDAS };