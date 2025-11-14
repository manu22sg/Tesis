import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

const GENERO_VALIDO = ['masculino', 'femenino', 'mixto'];

export const crearEquipoBody = Joi.object({
  campeonatoId: Joi.number().integer().positive().required(),
  nombre: Joi.string().trim().min(3).max(100).required(),
  carreraId: Joi.number().integer().positive().required(),

  tipo: Joi.string().lowercase().valid(...GENERO_VALIDO).required(),
});

export const actualizarEquipoBody = Joi.object({
  nombre: Joi.string().trim().min(3).max(100),
  carreraId: Joi.number().integer().positive(),

  tipo: Joi.string().lowercase().valid(...GENERO_VALIDO),
}).min(1);

export const agregarUsuarioEquipoBody = Joi.object({
  campeonatoId: Joi.number().integer().positive().required(),
  equipoId: Joi.number().integer().positive().required(),
  usuarioId: Joi.number().integer().positive().required(),
  numeroCamiseta: Joi.number().integer().min(1).max(99).optional(),
  posicion: Joi.string().trim().max(50).optional(),
});

export const quitarUsuarioEquipoParams = Joi.object({
  campeonatoId: Joi.number().integer().positive().required(),
  equipoId: Joi.number().integer().positive().required(),
  usuarioId: Joi.number().integer().positive().required(),
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
