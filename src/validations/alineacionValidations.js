import Joi from 'joi';

const TIME_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/; // por si filtras por fecha en el futuro

export const crearAlineacionBody = Joi.object({
  sesionId: Joi.number().integer().positive().required(),
  generadaAuto: Joi.boolean().optional().default(false),
  // permitir crear vacía o con jugadores iniciales
  jugadores: Joi.array().items(Joi.object({
    jugadorId: Joi.number().integer().positive().required(),
    posicion:  Joi.string().trim().max(20).required(),
    orden:     Joi.number().integer().min(1).optional(),
    comentario:Joi.string().trim().max(500).optional().allow(''),
  })).optional().default([]),
});

export const agregarJugadorBody = Joi.object({
  alineacionId: Joi.number().integer().positive().required(),
  jugadorId:    Joi.number().integer().positive().required(),
  posicion:     Joi.string().trim().max(20).required(),
  orden:        Joi.number().integer().min(1).optional(),
  comentario:   Joi.string().trim().max(500).optional().allow(''),
});

export const actualizarJugadorAlineacionBody = Joi.object({
  alineacionId: Joi.number().integer().positive().required(),
  jugadorId:    Joi.number().integer().positive().required(),
  posicion:     Joi.string().trim().max(20).optional(),
  orden:        Joi.number().integer().min(1).optional(),
  comentario:   Joi.string().trim().max(500).optional().allow(''),
}).min(1);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const quitarJugadorParams = Joi.object({
  alineacionId: Joi.number().integer().positive().required(),
  jugadorId:    Joi.number().integer().positive().required(),
});
