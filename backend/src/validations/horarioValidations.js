import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

// 🔧 CONFIGURACIONES SEPARADAS
export const HORARIO_RESERVAS = { 
  horainicio: '08:00', 
  horafin: '17:00', 
  duracionBloque: 60 
};

export const HORARIO_SESIONES = { 
  horainicio: '08:00', 
  horafin: '24:00' 
};

export const ANTICIPACION_MAXIMA_DIAS = 14;

const DATE_YYYY_MM_DD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const startOfDay = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60 + m; };

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Valida fecha desde mañana
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
      return helpers.error('any.invalid', { 
        message: `No se puede consultar con más de ${ANTICIPACION_MAXIMA_DIAS} días de anticipación` 
      });
    }
    
    return value;
  })
  .messages({
    'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD (ej: 2025-09-24)',
  });

// Valida fecha desde hoy (más flexible para consultas)
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
    
    if (fecha < hoy) {
      return helpers.error('any.invalid', { 
        message: `No se puede consultar fechas pasadas. Hoy es ${hoyStr}` 
      });
    }
    
    if (fecha > max) {
      return helpers.error('any.invalid', { 
        message: `No se puede consultar con más de ${ANTICIPACION_MAXIMA_DIAS} días de anticipación` 
      });
    }
    
    return value;
  })
  .messages({
    'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD (ej: 2025-09-24)',
  });

const horaSchema = Joi.string().pattern(TIME_HH_MM).messages({
  'string.pattern.base': 'La hora debe tener formato HH:mm (ej: 09:00)'
});

// === SCHEMAS PARA CONSULTAR DISPONIBILIDAD ===

// GET /api/horario/disponibilidad?fecha=...&tipoUso=...
export const disponibilidadPorFechaQuery = Joi.object({
  fecha: fechaConsultaSchema.required(),
  tipoUso: Joi.string().valid('reserva', 'sesion').default('reserva'),
  canchaId: Joi.number().integer().positive().optional(),
  capacidad: Joi.string().valid('pequena', 'mediana', 'grande').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

// POST /api/horario/disponibilidad/rango
export const disponibilidadPorRangoBody = Joi.object({
  inicio: fechaConsultaSchema,
  fin: fechaConsultaSchema,
  tipoUso: Joi.string().valid('reserva', 'sesion').default('reserva')
}).custom((value, helpers) => {
  const di = startOfDay(new Date(value.inicio));
  const df = startOfDay(new Date(value.fin));
  
  if (df < di) {
    return helpers.error('any.invalid', { 
      message: 'La fecha fin debe ser mayor o igual a la fecha inicio' 
    });
  }
  
  const diffDays = (df - di) / (1000 * 60 * 60 * 24);
  if (diffDays > 30) {
    return helpers.error('any.invalid', { 
      message: 'El rango no puede ser mayor a 30 días' 
    });
  }
  
  return value;
});

// === SCHEMAS PARA VERIFICAR DISPONIBILIDAD ===

// 🆕 GET /api/horario/verificar-reserva?canchaId=...&fecha=...&inicio=...&fin=...
export const verificarDisponibilidadReservaQuery = Joi.object({
  canchaId: Joi.number().integer().positive().required(),
  fecha: fechaReservaSchema.required(),
  inicio: horaSchema.required(),
  fin: horaSchema.required()
}).custom((value, helpers) => {
  const minInicio = toMin(HORARIO_RESERVAS.horainicio);
  const minFin = toMin(HORARIO_RESERVAS.horafin);
  const i = toMin(value.inicio);
  const f = toMin(value.fin);

  if (i < minInicio || f > minFin) {
    return helpers.error('any.invalid', {
      message: `Horario de reservas: ${HORARIO_RESERVAS.horainicio} - ${HORARIO_RESERVAS.horafin}`
    });
  }

  const dur = f - i;
  if (dur !== HORARIO_RESERVAS.duracionBloque) {
    return helpers.error('any.invalid', {
      message: `Las reservas deben durar exactamente ${HORARIO_RESERVAS.duracionBloque} minutos`
    });
  }

  // Validar que sea un bloque válido (08:00, 09:10, 10:20, etc.)
  const minutosDesdeLas8 = i - toMin('08:00');
  if (minutosDesdeLas8 < 0 || minutosDesdeLas8 % 70 !== 0) {
    return helpers.error('any.invalid', { 
      message: 'Horarios válidos: 08:00, 09:10, 10:20, 11:30, 12:40, 13:50, 15:00, 16:10' 
    });
  }

  return value;
});

// 🆕 GET /api/horario/verificar-sesion?canchaId=...&fecha=...&inicio=...&fin=...&sesionIdExcluir=...
export const verificarDisponibilidadSesionQuery = Joi.object({
  canchaId: Joi.number().integer().positive().required(),
  fecha: fechaReservaSchema.required(),
  inicio: horaSchema.required(),
  fin: horaSchema.required(),
  sesionIdExcluir: Joi.number().integer().positive().optional()
}).custom((value, helpers) => {
  const minInicio = toMin(HORARIO_SESIONES.horainicio);
  const minFin = toMin(HORARIO_SESIONES.horafin); // 24:00 = 1440 min
  const i = toMin(value.inicio);
  const f = toMin(value.fin);

  if (i < minInicio || f > minFin) {
    return helpers.error('any.invalid', {
      message: `Horario de sesiones: ${HORARIO_SESIONES.horainicio} - 00:00 (medianoche)`
    });
  }

  const dur = f - i;
  if (dur < 30) {
    return helpers.error('any.invalid', {
      message: 'Deben durar al menos 30 minutos'
    });
  }

  if (dur > 180) {
    return helpers.error('any.invalid', {
      message: 'No pueden durar más de 3 horas'
    });
  }

  return value;
});

// === MIDDLEWARE DE VALIDACIÓN ===

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { 
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

  Object.assign(req.query, value);
  next();
};