import Joi from "joi";
import { ESTADOS_ASISTENCIA } from "../entity/Asistencia.js";

const UBICACION_OBLIGATORIA = process.env.UBICACION_OBLIGATORIA === 'true';

// Helper para campos de ubicación
const ubicacionSchema = (obligatorio = false) => {
  const schema = Joi.number();
  return obligatorio ? schema.required() : schema.optional().allow(null);
};

// Entrenador edita asistencia
export const actualizarAsistenciaBodySchema = Joi.object({
  estado: Joi.string().valid(...ESTADOS_ASISTENCIA).required().messages({
    "any.only": `estado debe ser: ${ESTADOS_ASISTENCIA.join(", ")}`,
    "any.required": "estado es requerido",
  }),
  latitud: ubicacionSchema(UBICACION_OBLIGATORIA).min(-90).max(90).messages({
    "any.required": "La ubicación es obligatoria",
    "number.min": "Latitud debe estar entre -90 y 90",
    "number.max": "Latitud debe estar entre -90 y 90",
  }),
  longitud: ubicacionSchema(UBICACION_OBLIGATORIA).min(-180).max(180).messages({
    "any.required": "La ubicación es obligatoria",
    "number.min": "Longitud debe estar entre -180 y 180",
    "number.max": "Longitud debe estar entre -180 y 180",
  }),
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
  latitud: ubicacionSchema(UBICACION_OBLIGATORIA).messages({
    "any.required": "La ubicación es obligatoria para marcar asistencia",
  }),
  longitud: ubicacionSchema(UBICACION_OBLIGATORIA).messages({
    "any.required": "La ubicación es obligatoria para marcar asistencia",
  }),
  origen: Joi.string().valid('jugador', 'entrenador').optional().default('jugador'),
}).unknown(false);