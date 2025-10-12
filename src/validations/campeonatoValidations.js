import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

const FORMATO_VALIDO = ['5v5', '7v7', '11v11'];
const GENERO_VALIDO = ['masculino', 'femenino', 'mixto'];
const ESTADO_VALIDO = ['creado', 'en_juego', 'finalizado', 'cancelado'];

// Crear campeonato
export const crearCampeonatoBody = Joi.object({
  nombre: Joi.string().trim().min(5).max(100).required(),
  formato: Joi.string().valid(...FORMATO_VALIDO).required(),
  genero: Joi.string().valid(...GENERO_VALIDO).required(),
  anio: Joi.number().integer().min(2020).max(2100).required(),
  semestre: Joi.number().integer().valid(1, 2).required(),
  entrenadorId: Joi.number().integer().positive().optional(),
});

// Actualizar campeonato
export const actualizarCampeonatoBody = Joi.object({
  nombre: Joi.string().trim().min(5).max(100).optional(),
  estado: Joi.string().valid(...ESTADO_VALIDO).optional(),
  formato: Joi.string().valid(...FORMATO_VALIDO).optional(),
  genero: Joi.string().valid(...GENERO_VALIDO).optional(),
});

// middlewares
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
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
