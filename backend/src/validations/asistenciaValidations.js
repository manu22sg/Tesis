import Joi from "joi";
import { ESTADOS_ASISTENCIA } from "../entity/Asistencia.js";

// Jugador marca asistencia con token
export const marcarAsistenciaBodySchema = Joi.object({
  token: Joi.string().trim().min(4).max(20).required().messages({
    "any.required": "token es requerido",
  }),
  // estado opcional; por defecto lo pondremos 'presente' en el service si no viene
  estado: Joi.string().valid(...ESTADOS_ASISTENCIA).optional(),
  latitud: Joi.number().min(-90).max(90).optional(),
  longitud: Joi.number().min(-180).max(180).optional(),
  origen: Joi.string().valid("jugador", "entrenador").default("jugador"),
});

// Entrenador edita asistencia
export const actualizarAsistenciaBodySchema = Joi.object({
  estado: Joi.string().valid(...ESTADOS_ASISTENCIA).required().messages({
    "any.only": `estado debe ser: ${ESTADOS_ASISTENCIA.join(", ")}`,
    "any.required": "estado es requerido",
  }),
  latitud: Joi.number().min(-90).max(90).optional(),
  longitud: Joi.number().min(-180).max(180).optional(),
  origen: Joi.string().valid("estudiante", "entrenador").default("entrenador"),
});

// Listado con paginación/filtros
export const paginacionAsistenciasSchema = Joi.object({
  pagina: Joi.number().integer().min(1).default(1),
  limite: Joi.number().integer().min(1).max(100).default(10),
  estado: Joi.string().valid(...ESTADOS_ASISTENCIA).optional(),
});
