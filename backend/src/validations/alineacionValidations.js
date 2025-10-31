import Joi from 'joi';

export const crearAlineacionBody = Joi.object({
  sesionId: Joi.number().integer().positive().required(),
  generadaAuto: Joi.boolean().optional().default(false),
  jugadores: Joi.array().items(Joi.object({
    jugadorId: Joi.number().integer().positive().required(),
    posicion:  Joi.string().trim().max(50).required(),
    orden:     Joi.number().integer().min(1).optional(),
    comentario:Joi.string().trim().max(500).optional().allow(''),
  })).optional().default([]),
});

export const agregarJugadorBody = Joi.object({
  alineacionId: Joi.number().integer().positive().required(),
  jugadorId:    Joi.number().integer().positive().required(),
  posicion:     Joi.string().trim().max(50).required(),
  orden:        Joi.number().integer().min(1).optional(),
  comentario:   Joi.string().trim().max(500).optional().allow(''),
  posicionX:    Joi.number().min(0).max(100).optional().allow(null),
  posicionY:    Joi.number().min(0).max(100).optional().allow(null),
});

export const actualizarJugadorAlineacionBody = Joi.object({
  alineacionId: Joi.number().integer().positive().required(),
  jugadorId:    Joi.number().integer().positive().required(),
  posicion:     Joi.string().trim().max(50).optional(),
  orden:        Joi.number().integer().min(1).optional(),
  comentario:   Joi.string().trim().max(500).optional().allow(''),
  posicionX:    Joi.number().min(0).max(100).optional().allow(null),
  posicionY:    Joi.number().min(0).max(100).optional().allow(null),
}).min(1);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

// 🆕 NUEVO SCHEMA PARA sesionId
export const sesionIdParamSchema = Joi.object({
  sesionId: Joi.number().integer().positive().required()
});

export const quitarJugadorParams = Joi.object({
  alineacionId: Joi.number().integer().positive().required(),
  jugadorId:    Joi.number().integer().positive().required(),
});
