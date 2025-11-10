import Joi from "joi";
import { ESTADOS_ASISTENCIA } from "../entity/Asistencia.js";

// Entrenador edita asistencia
export const actualizarAsistenciaBodySchema = Joi.object({
  estado: Joi.string().valid(...ESTADOS_ASISTENCIA).required().messages({
    "any.only": `estado debe ser: ${ESTADOS_ASISTENCIA.join(", ")}`,
    "any.required": "estado es requerido",
  }),
  latitud: Joi.number().min(-90).max(90).optional().allow(null).empty(''),
  longitud: Joi.number().min(-180).max(180).optional().allow(null).empty(''),
  origen: Joi.string().valid("entrenador").optional(),
});

// Listado con paginación/filtros
export const paginacionAsistenciasSchema = Joi.object({
  pagina: Joi.number().integer().min(1).default(1),
  limite: Joi.number().integer().min(1).max(100).default(10),
  estado: Joi.string().valid(...ESTADOS_ASISTENCIA).optional(),
});

// Marcar por token (jugador/entrenador)
export const marcarAsistenciaPorTokenBodySchema = Joi.object({
  token: Joi.string().trim().uppercase().min(4).max(10).required(),
  estado: Joi.string().valid(...ESTADOS_ASISTENCIA).optional().default('presente'),
  latitud: Joi.number().min(-90).max(90).optional().allow(null).empty(''),
  longitud: Joi.number().min(-180).max(180).optional().allow(null).empty(''),
  origen: Joi.string().valid('jugador', 'entrenador').optional().default('jugador'),
}).unknown(false);

// Activar token con bandera de geofence
export const activarTokenSchema = Joi.object({
  ttlMin: Joi.number().integer().min(1).max(240).default(30)
    .messages({ "number.max": "ttlMin no puede superar 240 minutos" }),
  tokenLength: Joi.number().integer().min(4).max(20).default(6),

  requiereUbicacion: Joi.boolean().default(false),

  latitudToken: Joi.when('requiereUbicacion', {
    is: true,
    then: Joi.number().min(-90).max(90).precision(6).required()
      .messages({ "any.required": "Debes enviar latitudToken si requiereUbicacion es true" }),
    otherwise: Joi.number().min(-90).max(90).precision(6).optional().allow(null).empty('').default(null),
  }),

  longitudToken: Joi.when('requiereUbicacion', {
    is: true,
    then: Joi.number().min(-180).max(180).precision(6).required()
      .messages({ "any.required": "Debes enviar longitudToken si requiereUbicacion es true" }),
    otherwise: Joi.number().min(-180).max(180).precision(6).optional().allow(null).empty('').default(null),
  }),
});

export const desactivarTokenSchema = Joi.object({});
