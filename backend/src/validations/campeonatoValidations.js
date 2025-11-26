import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

const FORMATO_VALIDO = ['5v5', '7v7', '11v11', '8v8'];
const GENERO_VALIDO = ['masculino', 'femenino', 'mixto'];
const ESTADO_VALIDO = ['creado', 'en_juego', 'finalizado', 'cancelado'];
const TIPO_CAMPEONATO_VALIDO = ['mechon', 'intercarrera'];

export const crearCampeonatoBody = Joi.object({
  nombre: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .required()
    .messages({
      "string.empty": "El nombre es obligatorio",
      "string.min": "El nombre debe tener al menos 5 caracteres",
      "string.max": "El nombre no puede superar los 100 caracteres",
      "any.required": "El nombre es obligatorio"
    }),

  formato: Joi.string()
    .valid(...FORMATO_VALIDO)
    .required()
    .messages({
      "any.only": `El formato debe ser uno de: ${FORMATO_VALIDO.join(", ")}`,
      "any.required": "El formato es obligatorio"
    }),

  genero: Joi.string()
    .valid(...GENERO_VALIDO)
    .required()
    .messages({
      "any.only": `El género debe ser uno de: ${GENERO_VALIDO.join(", ")}`,
      "any.required": "El género es obligatorio"
    }),

  tipoCampeonato: Joi.string()
    .valid(...TIPO_CAMPEONATO_VALIDO)
    .default("intercarrera")
    .messages({
      "any.only": `El tipoCampeonato debe ser uno de: ${TIPO_CAMPEONATO_VALIDO.join(", ")}`
    }),

  anio: Joi.number()
    .integer()
    .min(2020)
    .max(2050)
    .required()
    .messages({
      "number.base": "El año debe ser un número",
      "number.min": "El año no puede ser menor a 2020",
      "number.max": "El año no puede ser mayor a 2050",
      "any.required": "El año es obligatorio"
    }),

  semestre: Joi.number()
    .integer()
    .valid(1, 2)
    .required()
    .messages({
      "any.only": "El semestre debe ser 1 o 2",
      "any.required": "El semestre es obligatorio"
    }),

  entrenadorId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      "number.base": "entrenadorId debe ser un número",
      "number.positive": "entrenadorId debe ser mayor que cero"
    }),
});

export const actualizarCampeonatoBody = Joi.object({
  nombre: Joi.string().trim().min(5).max(100).optional().messages({
    "string.min": "El nombre debe tener al menos 5 caracteres",
    "string.max": "El nombre no puede superar los 100 caracteres"
  }),

  estado: Joi.string().valid(...ESTADO_VALIDO).optional().messages({
    "any.only": `El estado debe ser uno de: ${ESTADO_VALIDO.join(", ")}`
  }),

  formato: Joi.string().valid(...FORMATO_VALIDO).optional().messages({
    "any.only": `El formato debe ser uno de: ${FORMATO_VALIDO.join(", ")}`
  }),

  genero: Joi.string().valid(...GENERO_VALIDO).optional().messages({
    "any.only": `El género debe ser uno de: ${GENERO_VALIDO.join(", ")}`
  }),
});

// 📌 Middleware genérico
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
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
