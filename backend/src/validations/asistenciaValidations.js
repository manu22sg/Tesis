import Joi from "joi";
import { ESTADOS_ASISTENCIA } from "../entity/Asistencia.js";



// Entrenador edita asistencia
export const actualizarAsistenciaBodySchema = Joi.object({
  estado: Joi.string().valid(...ESTADOS_ASISTENCIA).required().messages({
    "any.only": `estado debe ser: ${ESTADOS_ASISTENCIA.join(", ")}`,
    "any.required": "estado es requerido",
  }),
  latitud: Joi.number().min(-90).max(90).optional(),
  longitud: Joi.number().min(-180).max(180).optional(),
  origen: Joi.string().valid("entrenador")
});

// Listado con paginación/filtros
export const paginacionAsistenciasSchema = Joi.object({
  pagina: Joi.number().integer().min(1).default(1),
  limite: Joi.number().integer().min(1).max(100).default(10),
  estado: Joi.string().valid(...ESTADOS_ASISTENCIA).optional(),
});

export const marcarAsistenciaPorTokenBodySchema = Joi.object({
  token: Joi.string().min(4).max(10).required(),
  estado: Joi.string().valid(...ESTADOS_ASISTENCIA).optional().default('presente'),
  latitud: Joi.number().optional().allow(null),
  longitud: Joi.number().optional().allow(null),
  origen: Joi.string().valid('jugador', 'entrenador').optional().default('jugador'),
}).unknown(false);

