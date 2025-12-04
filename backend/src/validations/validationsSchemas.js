import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';
import dayjs from 'dayjs';

// 🔧 PARSERS FIJOS
const parseFecha = (str) => dayjs(str, 'YYYY-MM-DD', true).startOf('day');
const hoyLocal = () => dayjs().startOf('day');

export const HORARIO_RESERVAS = { 
  horainicio: '09:00', 
  horafin: '17:10', 
  duracionBloque: 60,
  tiempoLimpieza: 10
};

export const HORARIO_SESIONES = { 
  horainicio: '08:00', 
  horafin: '22:00',
  duracionMinima: 30,
  duracionMaxima: 180
};

// LÍMITES
export const ANTICIPACION_MAXIMA_RESERVAS_DIAS = 14;
export const ANTICIPACION_MAXIMA_SESIONES_DIAS = 180;

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;
const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Conversión HH:mm → minutos
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// Schema de hora
const horaSchema = Joi.string().pattern(TIME_HH_MM).messages({
  'string.pattern.base': 'La hora debe tener formato HH:mm (ej: 09:00)'
});

/* ============================================================
   FECHA RESERVA (desde mañana + hasta 14 días)
============================================================ */
const fechaReservaSchema = Joi.string().pattern(DATE_YYYY_MM_DD)
  .required()
  .custom((value, helpers) => {
    const hoy = hoyLocal();
    const mañana = hoy.add(1, 'day');
    const fecha = parseFecha(value);
    const max = hoy.add(ANTICIPACION_MAXIMA_RESERVAS_DIAS, 'day');

    if (!fecha.isValid()) {
      return helpers.error('any.invalid', { message: 'Fecha inválida' });
    }

    if (fecha.isBefore(mañana)) {
      return helpers.error('any.invalid', {
        message: `Solo se puede reservar desde mañana. Hoy es ${hoy.format("DD/MM/YYYY")}`
      });
    }

    if (fecha.isAfter(max)) {
      return helpers.error('any.invalid', {
        message: `No se puede reservar con más de ${ANTICIPACION_MAXIMA_RESERVAS_DIAS} días de anticipación`
      });
    }

    return value;
  });

/* ============================================================
   FECHA SESIÓN (desde hoy + hasta 90 días)
============================================================ */
const fechaSesionSchema = Joi.string().pattern(DATE_YYYY_MM_DD)
  .required()
  .custom((value, helpers) => {

    const hoy = hoyLocal();
    const fecha = parseFecha(value);
    const max = hoy.add(ANTICIPACION_MAXIMA_SESIONES_DIAS, 'day');

    if (!fecha.isValid()) {
      return helpers.error('any.invalid', { message: 'Fecha inválida' });
    }

    if (fecha.isBefore(hoy)) {
      return helpers.error('any.invalid', {
        message: `No se puede programar en fechas pasadas. Hoy es ${hoy.format("DD/MM/YYYY")}`
      });
    }

    if (fecha.isAfter(max)) {
      return helpers.error('any.invalid', {
        message: `No se puede programar con más de ${ANTICIPACION_MAXIMA_SESIONES_DIAS} días de anticipación`
      });
    }

    return value;
  });

/* ============================================================
   FECHA CONSULTA (desde hoy + hasta mañana+14 días)
============================================================ */
const fechaConsultaSchema = Joi.string().pattern(DATE_YYYY_MM_DD)
  .required()
  .custom((value, helpers) => {
    const hoy = hoyLocal();
    const fecha = parseFecha(value);
    const max = hoy.add(1 + ANTICIPACION_MAXIMA_RESERVAS_DIAS, 'day');

    if (!fecha.isValid()) {
      return helpers.error('any.invalid', { message: 'Fecha inválida' });
    }

    if (fecha.isBefore(hoy)) {
      return helpers.error('any.invalid', {
        message: `No se puede consultar fechas pasadas. Hoy es ${hoy.format("DD/MM/YYYY")}`
      });
    }

    if (fecha.isAfter(max)) {
      return helpers.error('any.invalid', {
        message: `No se puede consultar con más de ${ANTICIPACION_MAXIMA_RESERVAS_DIAS + 1} días de anticipación`
      });
    }

    return value;
  });

/* ============================================================
   QUERY: disponibilidad por fecha
============================================================ */
export const disponibilidadPorFechaQuery = Joi.object({
  fecha: fechaConsultaSchema.required()
});

/* ============================================================
   QUERY: disponibilidad por rango
============================================================ */
export const disponibilidadPorRangoBody = Joi.object({
  inicio: fechaConsultaSchema,
  fin: fechaConsultaSchema
}).custom((value, helpers) => {

  const di = parseFecha(value.inicio);
  const df = parseFecha(value.fin);

  if (df.isBefore(di)) {
    return helpers.error("any.invalid", {
      message: "La fecha fin no puede ser anterior a la fecha inicio"
    });
  }

  if (df.diff(di, "day") > 30) {
    return helpers.error("any.invalid", {
      message: "El rango no puede exceder los 30 días"
    });
  }

  return value;
});

/* ============================================================
   VALIDACIÓN HORARIA PARA RESERVAS
============================================================ */
export const verificarDisponibilidadReservaQuery = Joi.object({
  canchaId: Joi.number().integer().positive().required(),
  fecha: fechaReservaSchema.required(),
  inicio: horaSchema.required(),
  fin: horaSchema.required()
}).custom((value, helpers) => {

  const i = toMin(value.inicio);
  const f = toMin(value.fin);

  const minInicio = toMin(HORARIO_RESERVAS.horainicio);
  const minFin = toMin(HORARIO_RESERVAS.horafin);

  if (i < minInicio || f > minFin) {
    return helpers.error("any.invalid", {
      message: `Horario válido: ${HORARIO_RESERVAS.horainicio} - ${HORARIO_RESERVAS.horafin}`
    });
  }

  const dur = f - i;
  if (dur !== HORARIO_RESERVAS.duracionBloque) {
    return helpers.error("any.invalid", {
      message: `La reserva debe durar exactamente ${HORARIO_RESERVAS.duracionBloque} minutos`
    });
  }

  return value;
});

/* ============================================================
   VALIDACIÓN HORARIA PARA SESIONES
============================================================ */
export const verificarDisponibilidadSesionQuery = Joi.object({
  canchaId: Joi.number().integer().positive().required(),
  fecha: fechaSesionSchema.required(),
  inicio: horaSchema.required(),
  fin: horaSchema.required(),
  sesionIdExcluir: Joi.number().integer().positive().optional()
}).custom((value, helpers) => {

  const i = toMin(value.inicio);
  const f = toMin(value.fin);

  const minInicio = toMin(HORARIO_SESIONES.horainicio);
  const minFin = toMin(HORARIO_SESIONES.horafin);

  if (i < minInicio || f > minFin) {
    return helpers.error("any.invalid", {
      message: `Horario válido: ${HORARIO_SESIONES.horainicio} - 22:00`
    });
  }

  const dur = f - i;

  if (dur < HORARIO_SESIONES.duracionMinima) {
    return helpers.error("any.invalid", {
      message: `La duración mínima es ${HORARIO_SESIONES.duracionMinima} minutos`
    });
  }

  if (dur > HORARIO_SESIONES.duracionMaxima) {
    return helpers.error("any.invalid", {
      message: `La duración máxima es ${HORARIO_SESIONES.duracionMaxima} minutos`
    });
  }

  return value;
});

/* ============================================================
   MIDDLEWARES
============================================================ */

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    const errores = {};
    for (const detail of error.details) {
      const field = detail.path.join('.');
      errores[field] = detail.context?.message || detail.message;
    }
    return validationError(res, errores);
  }

  req.body = value;
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });

  if (error) {
    const errores = {};
    for (const detail of error.details) {
      const field = detail.path.join('.');
      errores[field] = detail.context?.message || detail.message;
    }
    return validationError(res, errores);
  }

  Object.assign(req.query, value);
  next();
};
