import Joi from "joi";
import { validationError } from "../utils/responseHandler.js";
import { parseDateLocal } from "../utils/dateLocal.js";

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
  canchaId: Joi.number().integer().positive().required(),
  fecha: Joi.string().pattern(DATE_YYYY_MM_DD).required(),
  horaInicio: Joi.string().pattern(TIME_HH_MM).required(),
  horaFin: Joi.string().pattern(TIME_HH_MM).required(), // ✅ ahora es requerido, no opcional
}).custom((value, helpers) => {
  const hoyStr = getLocalDate();
  const hoy = startOfDay(new Date(hoyStr));
  const fecha = startOfDay(parseDateLocal(value.fecha));

  if (Number.isNaN(fecha.getTime()))
    return helpers.error("any.invalid", { message: "Fecha inválida" });
  if (fecha < hoy)
    return helpers.error("any.invalid", { message: "No se pueden programar partidos en fechas pasadas" });

  // Validar hora fin > inicio y duración mínima
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const i = toMin(value.horaInicio);
  const f = toMin(value.horaFin);
  const dur = f - i;

  if (f <= i)
    return helpers.error("any.invalid", { message: "La hora de fin debe ser posterior a la hora de inicio" });
  if (dur < 30)
    return helpers.error("any.invalid", { message: "La duración mínima de un partido es de 30 minutos" });
  if (dur > 180)
    return helpers.error("any.invalid", { message: "La duración máxima permitida es de 180 minutos" });

  return value;
});

// 🔹 PUT /api/partidos/:id/actualizar (para registrar resultados)
export const actualizarPartidoBody = Joi.object({
  golesA: Joi.number().integer().min(0).optional(),
  golesB: Joi.number().integer().min(0).optional(),
  estado: Joi.string().valid(...ESTADOS_VALIDOS).optional(),
  ganadorId: Joi.number().integer().positive().allow(null).optional(),
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
  golesA: Joi.number().integer().min(0).required(),
  golesB: Joi.number().integer().min(0).required(),
});