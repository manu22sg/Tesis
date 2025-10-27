import Joi from "joi";
export const activarTokenSchema = Joi.object({
  ttlMin: Joi.number()
    .integer()
    .min(1)
    .max(240)
    .default(30)
    .messages({ "number.max": "ttlMin no puede superar 240 minutos" }),

  tokenLength: Joi.number()
    .integer()
    .min(4)
    .max(20)
    .default(6),

  latitudToken: Joi.number()
    .min(-90)
    .max(90)
    .precision(6)
    .messages({ "number.base": "Latitud inválida", "number.max": "Latitud fuera de rango" })
    .optional(),

  longitudToken: Joi.number()
    .min(-180)
    .max(180)
    .precision(6)
    .messages({ "number.base": "Longitud inválida", "number.max": "Longitud fuera de rango" })
    .optional(),
});

export const desactivarTokenSchema = Joi.object({});
