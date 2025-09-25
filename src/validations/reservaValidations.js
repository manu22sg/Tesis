import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

const HORARIO_FUNCIONAMIENTO = { inicio: '09:00', fin: '15:00', duracionBloque: 90 };
const ANTICIPACION_MAXIMA_DIAS = 14;
const DATE_YYYY_MM_DD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const RUT_PATTERN = /^\d{7,8}-[\dkK]$/;

const startOfDay = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60 + m; };
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Schema para fechas de reserva (desde mañana)
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
        message: `Solo se puede reservar desde mañana en adelante. Hoy es ${hoyStr}` 
      });
    }
    
    if (fecha > max) {
      return helpers.error('any.invalid', { 
        message: `No se puede reservar con más de ${ANTICIPACION_MAXIMA_DIAS} días de anticipación` 
      });
    }
    
    return value;
  })
  .messages({
    'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD (ej: 2025-09-24)',
  });

// Schema para RUT
const rutSchema = Joi.string().pattern(RUT_PATTERN)
  .required()
  .messages({
    'string.pattern.base': 'RUT debe tener formato XX.XXX.XXX-X (ej: 12.345.678-9)'
  });

// Schema para hora
const horaSchema = Joi.string().pattern(TIME_HH_MM)
  .required()
  .messages({
    'string.pattern.base': 'La hora debe tener formato HH:mm (ej: 09:00)'
  });

// === Schemas ===

// POST /api/reservas - Crear reserva
export const crearReservaBody = Joi.object({
  canchaId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'canchaId debe ser un número',
      'number.integer': 'canchaId debe ser un número entero',
      'number.positive': 'canchaId debe ser mayor a 0',
      'any.required': 'canchaId es requerido'
    }),

  fecha: fechaReservaSchema,

  horaInicio: horaSchema,

  horaFin: horaSchema,

  motivo: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.base': 'El motivo debe ser texto',
      'string.max': 'El motivo no puede exceder 500 caracteres'
    }),

  participantes: Joi.array()
    .items(rutSchema)
    .min(11)
    .max(11)
    .unique()
    .required()
    .messages({
      'array.base': 'participantes debe ser un array',
      'array.min': 'Se requieren exactamente 11 participantes adicionales (tú te incluyes automáticamente)',
      'array.max': 'Se requieren exactamente 11 participantes adicionales (tú te incluyes automáticamente)', 
      'array.unique': 'No se pueden repetir participantes',
      'any.required': 'La lista de participantes es requerida'
    })
}).custom((value, helpers) => {
  // Validar horarios de funcionamiento
  const minInicio = toMin(HORARIO_FUNCIONAMIENTO.inicio);
  const minFin = toMin(HORARIO_FUNCIONAMIENTO.fin);
  const i = toMin(value.horaInicio);
  const f = toMin(value.horaFin);

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
  
  if (dur <= 0) {
    return helpers.error('any.invalid', {
      message: 'La hora fin debe ser mayor a la hora inicio'
    });
  }
  
  return value;
});

// GET /api/reservas - Obtener reservas del usuario con filtros
export const obtenerReservasUsuarioBody = Joi.object({
  estado: Joi.string()
    .valid('pendiente', 'aprobada', 'rechazada', 'cancelada', 'completada')
    .optional()
    .messages({
      'any.only': 'Estado debe ser: pendiente, aprobada, rechazada, cancelada o completada'
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'La página debe ser un número',
      'number.integer': 'La página debe ser un número entero',
      'number.min': 'La página debe ser mayor a 0'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .messages({
      'number.base': 'El límite debe ser un número',
      'number.integer': 'El límite debe ser un número entero',
      'number.min': 'El límite debe ser mayor a 0',
      'number.max': 'El límite no puede ser mayor a 50'
    })
});

// GET /api/reservas/todas - Para entrenadores (todas las reservas)
export const obtenerTodasReservasBody = Joi.object({
  estado: Joi.string()
    .valid('pendiente', 'aprobada', 'rechazada', 'cancelada', 'completada')
    .optional()
    .messages({
      'any.only': 'Estado debe ser: pendiente, aprobada, rechazada, cancelada o completada'
    }),

  fecha: Joi.string()
    .pattern(DATE_YYYY_MM_DD)
    .optional()
    .messages({
      'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD'
    }),

  canchaId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'canchaId debe ser un número',
      'number.integer': 'canchaId debe ser un número entero',
      'number.positive': 'canchaId debe ser mayor a 0'
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'La página debe ser un número',
      'number.integer': 'La página debe ser un número entero',
      'number.min': 'La página debe ser mayor a 0'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .messages({
      'number.base': 'El límite debe ser un número',
      'number.integer': 'El límite debe ser un número entero',
      'number.min': 'El límite debe ser mayor a 0',
      'number.max': 'El límite no puede ser mayor a 50'
    })
});

// POST /api/reservas/detalle - Obtener reserva por ID
export const obtenerReservaPorIdBody = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID debe ser un número',
      'number.integer': 'El ID debe ser un número entero',
      'number.positive': 'El ID debe ser mayor a 0',
      'any.required': 'El ID es requerido'
    })
});

// === Middleware de validación ===
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