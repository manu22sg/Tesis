import Joi from 'joi';

export const upsertEstadisticaBody = Joi.object({
  jugadorId: Joi.number().integer().positive().required(),
  sesionId:  Joi.number().integer().positive().required(),
  goles:             Joi.number().integer().min(0).default(0),
  asistencias:       Joi.number().integer().min(0).default(0),
  tarjetasAmarillas: Joi.number().integer().min(0).default(0),
  tarjetasRojas:     Joi.number().integer().min(0).default(0),
  minutosJugados:    Joi.number().integer().min(0).default(0),
  arcosInvictos:     Joi.number().integer().min(0).default(0),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const paginarQuery = Joi.object({
  pagina: Joi.number().integer().min(1).default(1),
  limite: Joi.number().integer().min(1).max(100).default(10),
});

export const listarPorJugadorParams = Joi.object({
  jugadorId: Joi.number().integer().positive().required()
});

export const listarPorSesionParams = Joi.object({
  sesionId: Joi.number().integer().positive().required()
});
