import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

export const HORARIO_FUNCIONAMIENTO = { inicio: '08:00', fin: '20:00', duracionBloque: 90 };
export const ANTICIPACION_MAXIMA_DIAS = 14;

const DATE_YYYY_MM_DD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const startOfDay = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60 + m; };

// Obtener fecha actual en formato local sin problemas de timezone
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Valida fecha en formato YYYY-MM-DD, desde mañana hasta anticipación máxima
const fechaReservaSchema = Joi.string().pattern(DATE_YYYY_MM_DD)
  .required()
  .custom((value, helpers) => {
    const hoyStr = getLocalDate();
    const hoy = startOfDay(new Date(hoyStr));
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);
    
    const fecha = startOfDay(new Date(value));
    const max = new Date(hoy);
    max.setDate(max.getDate() + ANTICIPACION_MAXIMA_DIAS);

    if (Number.isNaN(fecha.getTime())) {
      return helpers.error('any.invalid', { message: 'Fecha inválida' });
    }
    
  
    
    if (fecha < mañana) {
      return helpers.error('any.invalid', { 
        message: `Solo se puede consultar disponibilidad desde mañana en adelante. Hoy es ${hoyStr}` 
      });
    }
    
    if (fecha > max) {
      return helpers.error('any.invalid', { message: `No se puede consultar con más de ${ANTICIPACION_MAXIMA_DIAS} días de anticipación` });
    }
    
    return value;
  })
  .messages({
    'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD (ej: 2025-09-24)',
  });

// Para consultar disponibilidad (más flexible, permite desde hoy)
const fechaConsultaSchema = Joi.string().pattern(DATE_YYYY_MM_DD)
  .required()
  .custom((value, helpers) => {
    const hoyStr = getLocalDate();
    const hoy = startOfDay(new Date(hoyStr));
    const fecha = startOfDay(new Date(value));
    const max = new Date(hoy);
    max.setDate(max.getDate() + ANTICIPACION_MAXIMA_DIAS);

    if (Number.isNaN(fecha.getTime())) {
      return helpers.error('any.invalid', { message: 'Fecha inválida' });
    }
    
    // Debug: mostrar fechas para debugging
    console.log('Debug consulta:', { hoyStr, value, fechaComparacion: fecha >= hoy });
    
    // Para consultas, permitir desde hoy
    if (fecha < hoy) {
      return helpers.error('any.invalid', { 
        message: `No se puede consultar fechas pasadas. Hoy es ${hoyStr}` 
      });
    }
    
    if (fecha > max) {
      return helpers.error('any.invalid', { message: `No se puede consultar con más de ${ANTICIPACION_MAXIMA_DIAS} días de anticipación` });
    }
    
    return value;
  })
  .messages({
    'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD (ej: 2025-09-24)',
  });

const horaSchema = Joi.string().pattern(TIME_HH_MM).messages({
  'string.pattern.base': 'La hora debe tener formato HH:mm (ej: 09:00)'
});

// === Schemas ===

// POST /api/horario/disponibilidad/fecha
export const disponibilidadPorFechaQuery = Joi.object({
  fecha: fechaConsultaSchema.required()
});

// POST /api/horario/disponibilidad/rango
export const disponibilidadPorRangoBody = Joi.object({
  inicio: fechaConsultaSchema, // Más flexible para consultas
  fin: fechaConsultaSchema
}).custom((value, helpers) => {
  const di = startOfDay(new Date(value.inicio));
  const df = startOfDay(new Date(value.fin));
  
  if (df < di) {
    return helpers.error('any.invalid', { message: 'La fecha fin debe ser mayor o igual a la fecha inicio' });
  }
  
  // Limitar rango máximo a 30 días para evitar sobrecarga
  const diffDays = (df - di) / (1000 * 60 * 60 * 24);
  if (diffDays > 30) {
    return helpers.error('any.invalid', { message: 'El rango no puede ser mayor a 30 días' });
  }
  
  return value;
});

export const verificarDisponibilidadQuery = Joi.object({
  canchaId: Joi.number().integer().positive().required(),
  fecha: fechaReservaSchema.required(),
  inicio: horaSchema.required(),
  fin: horaSchema.required(),
  sesionIdExcluir: Joi.number().integer().positive().optional()
}).custom((value, helpers) => {
  const minInicio = toMin(HORARIO_FUNCIONAMIENTO.inicio);
  const minFin = toMin(HORARIO_FUNCIONAMIENTO.fin);
  const i = toMin(value.inicio);
  const f = toMin(value.fin);

  if (i < minInicio || f > minFin) {
    return helpers.error('any.invalid', {
      message: `Horario fuera del funcionamiento (${HORARIO_FUNCIONAMIENTO.inicio} - ${HORARIO_FUNCIONAMIENTO.fin})`
    });
  }

  const dur = f - i;
  if (dur !== HORARIO_FUNCIONAMIENTO.duracionBloque) {
    return helpers.error('any.invalid', {
      message: `La duración debe ser exactamente ${HORARIO_FUNCIONAMIENTO.duracionBloque} minutos`
    });
  }

  return value;
});

// === Middleware de validación ===
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { 
    abortEarly: false, 
    stripUnknown: true 
  });
  
  if (error) {
    const errores = error.details.reduce((acc, detail) => {
      // Usar el mensaje personalizado si existe
      const field = detail.path.join('.');
      const message = detail.context?.message || detail.message;
      acc[field] = message;
      return acc;
    }, {});

    return validationError(res, errores);
  }
  
  req.body = value;
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errores = error.details.reduce((acc, detail) => {
      const field = detail.path.join('.');
      const message = detail.context?.message || detail.message;
      acc[field] = message;
      return acc;
    }, {});
    return validationError(res, errores);
  }

  req.query = value;
  next();
};