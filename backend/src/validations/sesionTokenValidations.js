import Joi from "joi";
export const activarTokenSchema = Joi.object({
  ttlMin: Joi.number().integer().min(1).max(240).default(30)
    .messages({ "number.max": "ttlMin no puede superar 240 minutos" }),
  tokenLength: Joi.number().integer().min(4).max(20).default(6),

  // 🔑 flag que decide si será obligatorio pedir ubicación a los jugadores
  requiereUbicacion: Joi.boolean().default(false),

  // Si requiere ubicacion, las coords son obligatorias; si no, se normalizan a null
  latitudToken: Joi.when('requiereUbicacion', {
    is: true,
    then: Joi.number().min(-90).max(90).precision(6).required()
      .messages({ "any.required": "Debes enviar latitudToken si requiereUbicacion es true" }),
    otherwise: Joi.number().min(-90).max(90).precision(6).optional().allow(null).empty('').default(null)
  }),

  longitudToken: Joi.when('requiereUbicacion', {
    is: true,
    then: Joi.number().min(-180).max(180).precision(6).required()
      .messages({ "any.required": "Debes enviar longitudToken si requiereUbicacion es true" }),
    otherwise: Joi.number().min(-180).max(180).precision(6).optional().allow(null).empty('').default(null)
  }),
});



export const desactivarTokenSchema = Joi.object({});
