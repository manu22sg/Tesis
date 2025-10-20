import Joi from "joi";

export const activarTokenSchema = Joi.object({
  ttlMin: Joi.number().integer().min(1).max(240).default(30) // minutos
    .messages({ "number.max": "ttlMin no puede superar 240 minutos" }),
  tokenLength: Joi.number().integer().min(4).max(20).default(6),
});

export const desactivarTokenSchema = Joi.object({});
