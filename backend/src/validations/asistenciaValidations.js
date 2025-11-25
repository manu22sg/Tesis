import Joi from "joi";
import { ESTADOS_ASISTENCIA } from "../entity/Asistencia.js";

// Entrenador edita asistencia
export const actualizarAsistenciaBodySchema = Joi.object({
  estado: Joi.string()
    .valid(...ESTADOS_ASISTENCIA)
    .required()
    .messages({
      "any.only": `estado debe ser: ${ESTADOS_ASISTENCIA.join(", ")}`,
      "any.required": "estado es requerido",
    }),
  
  latitud: Joi.number()
    .min(-90)
    .max(90)
    .optional()
    .allow(null)
    .empty('')
    .messages({
      'number.min': 'latitud debe ser al menos -90',
      'number.max': 'latitud debe ser máximo 90'
    }),
  
  longitud: Joi.number()
    .min(-180)
    .max(180)
    .optional()
    .allow(null)
    .empty('')
    .messages({
      'number.min': 'longitud debe ser al menos -180',
      'number.max': 'longitud debe ser máximo 180'
    }),
  
  origen: Joi.string()
    .valid("entrenador")
    .optional()
    .messages({
      'any.only': 'origen debe ser "entrenador"'
    })
});

// Marcar por token (jugador/entrenador)
export const marcarAsistenciaPorTokenBodySchema = Joi.object({
  token: Joi.string()
    .trim()
    .uppercase()
    .min(4)
    .max(10)
    .required()
    .messages({
      'string.empty': 'token es requerido',
      'string.min': 'token debe tener al menos 4 caracteres',
      'string.max': 'token debe tener máximo 10 caracteres',
      'any.required': 'token es requerido'
    }),
  
  estado: Joi.string()
    .valid(...ESTADOS_ASISTENCIA)
    .optional()
    .default('presente')
    .messages({
      'any.only': `estado debe ser: ${ESTADOS_ASISTENCIA.join(", ")}`
    }),
  
  latitud: Joi.number()
    .min(-90)
    .max(90)
    .optional()
    .allow(null)
    .empty('')
    .messages({
      'number.min': 'latitud debe ser al menos -90',
      'number.max': 'latitud debe ser máximo 90'
    }),
  
  longitud: Joi.number()
    .min(-180)
    .max(180)
    .optional()
    .allow(null)
    .empty('')
    .messages({
      'number.min': 'longitud debe ser al menos -180',
      'number.max': 'longitud debe ser máximo 180'
    }),
  
  origen: Joi.string()
    .valid('jugador', 'entrenador')
    .optional()
    .default('jugador')
    .messages({
      'any.only': 'origen debe ser "jugador" o "entrenador"'
    })
}).unknown(false);

// Activar token con bandera de geofence
export const activarTokenSchema = Joi.object({
  ttlMin: Joi.number()
    .integer()
    .min(1)
    .max(240)
    .default(30)
    .messages({ 
      "number.max": "ttlMin no puede superar 240 minutos",
      "number.min": "ttlMin debe ser al menos 1 minuto"
    }),
  
  tokenLength: Joi.number()
    .integer()
    .min(4)
    .max(20)
    .default(6)
    .messages({
      "number.min": "tokenLength debe ser al menos 4",
      "number.max": "tokenLength debe ser máximo 20"
    }),

  requiereUbicacion: Joi.boolean()
    .default(false),

  latitudToken: Joi.when('requiereUbicacion', {
    is: true,
    then: Joi.number()
      .min(-90)
      .max(90)
      .precision(6)
      .required()
      .messages({ 
        "any.required": "Debes enviar latitudToken si requiereUbicacion es true",
        "number.min": "latitudToken debe ser al menos -90",
        "number.max": "latitudToken debe ser máximo 90"
      }),
    otherwise: Joi.number()
      .min(-90)
      .max(90)
      .precision(6)
      .optional()
      .allow(null)
      .empty('')
      .default(null)
  }),

  longitudToken: Joi.when('requiereUbicacion', {
    is: true,
    then: Joi.number()
      .min(-180)
      .max(180)
      .precision(6)
      .required()
      .messages({ 
        "any.required": "Debes enviar longitudToken si requiereUbicacion es true",
        "number.min": "longitudToken debe ser al menos -180",
        "number.max": "longitudToken debe ser máximo 180"
      }),
    otherwise: Joi.number()
      .min(-180)
      .max(180)
      .precision(6)
      .optional()
      .allow(null)
      .empty('')
      .default(null)
  })
});

export const desactivarTokenSchema = Joi.object({});
