import Joi from "joi";
import { validationError } from "../utils/responseHandler.js";
import { parseDateLocal } from "../utils/dateLocal.js";
import { HORARIO_SESIONES } from './validationsSchemas.js';
const DATE_YYYY_MM_DD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const ESTADOS_VALIDOS = ["pendiente", "programado", "en_juego", "finalizado", "cancelado"];

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const getLocalDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const programarPartidoBody = Joi.object({
  canchaId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.base": "canchaId debe ser un número válido",
      "number.positive": "canchaId debe ser un número positivo",
      "any.required": "canchaId es requerido"
    }),

  fecha: Joi.string()
    .pattern(DATE_YYYY_MM_DD)
    .required()
    .messages({
      "string.pattern.base": "fecha debe tener el formato YYYY-MM-DD",
      "any.required": "fecha es requerida"
    }),

  horaInicio: Joi.string()
    .pattern(TIME_HH_MM)
    .required()
    .messages({
      "string.pattern.base": "horaInicio debe tener el formato HH:MM",
      "any.required": "horaInicio es requerida"
    }),

  horaFin: Joi.string()
    .pattern(TIME_HH_MM)
    .required()
    .messages({
      "string.pattern.base": "horaFin debe tener el formato HH:MM",
      "any.required": "horaFin es requerida"
    }),

  arbitroId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "arbitroId es requerido",
      "number.base": "arbitroId debe ser un número válido",
      "number.positive": "arbitroId debe ser un número positivo"
    }),

}).custom((value, helpers) => {
  const hoyStr = getLocalDate();
  const hoy = startOfDay(new Date(hoyStr));
  const fecha = startOfDay(parseDateLocal(value.fecha));

  if (Number.isNaN(fecha.getTime()))
    return helpers.error("any.invalid", { message: "La fecha seleccionada es inválida" });

  if (fecha < hoy)
    return helpers.error("any.invalid", { message: "No se pueden programar partidos en fechas pasadas" });

  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

  const i = toMin(value.horaInicio);
  const f = toMin(value.horaFin);
  const dur = f - i;

  // ✅ VALIDACIÓN: Horario de sesiones (08:00-24:00)
  const minInicio = toMin(HORARIO_SESIONES.horainicio); // 08:00 = 480 min
  const maxFin = toMin(HORARIO_SESIONES.horafin); // 24:00 = 1440 min

  if (i < minInicio || f > maxFin) {
    return helpers.error("any.invalid", {
      message: `Los partidos deben programarse entre ${HORARIO_SESIONES.horainicio} y 00:00 (medianoche)`
    });
  }

  if (f <= i)
    return helpers.error("any.invalid", { message: "horaFin debe ser posterior a horaInicio" });

  // ✅ VALIDACIÓN: Duración mínima
  if (dur < HORARIO_SESIONES.duracionMinima) {
    return helpers.error("any.invalid", {
      message: `La duración mínima de un partido es ${HORARIO_SESIONES.duracionMinima} minutos`
    });
  }

  // Duración máxima (opcional, puedes ajustar)
  if (dur > 180) {
    return helpers.error("any.invalid", {
      message: "La duración máxima permitida es de 180 minutos (3 horas)"
    });
  }

  return value;
});


//  PUT /api/partidos/:id/actualizar (para registrar resultados)
export const actualizarPartidoBody = Joi.object({
  golesA: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      "number.base": "golesA debe ser un número",
      "number.integer": "golesA debe ser un entero",
      "number.min": "golesA no puede ser negativo"
    }),

  golesB: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      "number.base": "golesB debe ser un número",
      "number.integer": "golesB debe ser un entero",
      "number.min": "golesB no puede ser negativo"
    }),

  penalesA: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .optional()
    .messages({
      "number.base": "penalesA debe ser un número",
      "number.integer": "penalesA debe ser un entero",
      "number.min": "penalesA no puede ser negativo"
    }),

  penalesB: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .optional()
    .messages({
      "number.base": "penalesB debe ser un número",
      "number.integer": "penalesB debe ser un entero",
      "number.min": "penalesB no puede ser negativo"
    }),

  estado: Joi.string()
    .valid(...ESTADOS_VALIDOS)
    .optional()
    .messages({
      "any.only": `estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`
    }),

  ganadorId: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional()
    .messages({
      "number.base": "ganadorId debe ser un número",
      "number.integer": "ganadorId debe ser un entero",
      "number.positive": "ganadorId debe ser mayor que 0"
    })
});
// Middleware genérico
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return validationError(res, formatErrors(error));
  req.body = value;
  next();
};

function formatErrors(error) {
  return error.details.reduce((acc, d) => {
    acc[d.path.join(".")] = d.context?.message || d.message;
    return acc;
  }, {});
}
export const registrarResultadoBody = Joi.object({
  golesA: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      "number.base": "golesA debe ser un número válido",
      "number.integer": "golesA debe ser un número entero",
      "number.min": "golesA no puede ser negativo",
      "any.required": "golesA es requerido"
    }),

  golesB: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      "number.base": "golesB debe ser un número válido",
      "number.integer": "golesB debe ser un número entero",
      "number.min": "golesB no puede ser negativo",
      "any.required": "golesB es requerido"
    }),

  penalesA: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .optional()
    .messages({
      "number.base": "penalesA debe ser un número válido",
      "number.integer": "penalesA debe ser un número entero",
      "number.min": "penalesA no puede ser negativo"
    }),

  penalesB: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .optional()
    .messages({
      "number.base": "penalesB debe ser un número válido",
      "number.integer": "penalesB debe ser un número entero",
      "number.min": "penalesB no puede ser negativo"
    }),
});
