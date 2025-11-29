import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';
import { parseDateLocal } from '../utils/dateLocal.js';
import validaHorario from '../utils/validaHorario.js';

// 🔧 CONFIGURACIÓN ACTUALIZADA PARA RESERVAS
const HORARIO_RESERVAS = { 
  inicio: '08:00', 
  fin: '17:00', 
  duracionBloque: 60    // 1 hora exacta
};

const ANTICIPACION_MAXIMA_DIAS = 14;
const DATE_YYYY_MM_DD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const RUT_PATTERN = /^\d{7,8}-[\dK]$/;

const startOfDay = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fechaReservaSchema = Joi.string().pattern(DATE_YYYY_MM_DD)
  .required()
  .custom((value, helpers) => {
    const hoyStr = getLocalDate();
    const hoy = startOfDay(new Date(hoyStr));
    const mañana = new Date(hoy); mañana.setDate(mañana.getDate() + 1);

    const fecha = startOfDay(parseDateLocal(value)); 
    const max = new Date(hoy); max.setDate(max.getDate() + ANTICIPACION_MAXIMA_DIAS);

    if (Number.isNaN(fecha.getTime())) {
      return helpers.error('any.invalid', { message: 'Fecha inválida' });
    }
    const diaSemana = fecha.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      return helpers.error('any.invalid', { message: 'Solo se pueden hacer reservas de lunes a viernes' });
    }
    if (fecha < mañana) {
      return helpers.error('any.invalid', { message: `Solo se puede reservar desde mañana en adelante. Hoy es ${hoyStr}` });
    }
    if (fecha > max) {
      return helpers.error('any.invalid', { message: `No se puede reservar con más de ${ANTICIPACION_MAXIMA_DIAS} días de anticipación` });
    }
    return value;
  })
  .messages({ 'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD (ej: 2025-09-24)' });

const rutSchema = Joi.string().pattern(RUT_PATTERN)
  .required()
  .messages({ 'string.pattern.base': 'RUT debe tener formato XXXXXXXX-X (ej: 20694718-7)' });

const horaSchema = Joi.string().pattern(TIME_HH_MM)
  .required()
  .messages({ 'string.pattern.base': 'La hora debe tener formato HH:mm (ej: 09:00)' });

// 🔥 VALIDACIÓN ACTUALIZADA CON validaHorario
export const crearReservaBody = Joi.object({
  canchaId: Joi.number().integer().positive().required(),
  fecha: fechaReservaSchema,
  horaInicio: horaSchema,
  horaFin: horaSchema,
  motivo: Joi.string().trim().max(500).optional().allow(''),
  participantes: Joi.array().items(rutSchema).max(22).unique().required()
}).custom((value, helpers) => {
  // Usar validaHorario con configuración de RESERVAS
  const resultado = validaHorario(value, helpers, {
    inicio: HORARIO_RESERVAS.inicio,
    fin: HORARIO_RESERVAS.fin,
    duracionBloque: HORARIO_RESERVAS.duracionBloque,
    validarBloques: true  // ✅ Valida que sean horarios válidos (08:00, 09:10, etc.)
  });
  
  return resultado === true ? value : resultado;
});

// GET /api/reservas (usuario)
export const obtenerReservasUsuarioQuery = Joi.object({
  estado: Joi.string().valid('pendiente', 'aprobada', 'rechazada', 'cancelada', 'completada', 'expirada').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

// GET /api/reservas/todas (entrenador)
export const obtenerTodasReservasQuery = Joi.object({
  estado: Joi.string().valid('pendiente', 'aprobada', 'rechazada', 'cancelada', 'completada', 'expirada').optional(),
  fecha: Joi.string().pattern(DATE_YYYY_MM_DD).optional(),
  canchaId: Joi.number().integer().positive().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

// POST /api/reservas/detalle
export const obtenerReservaPorIdBody = Joi.object({
  id: Joi.number().integer().positive().required()
});


export const editarParticipantesBody = Joi.object({
  participantes: Joi.array()
    .items(rutSchema)
    .min(1)
    .max(22)
    .unique()
    .required()
    .messages({
      'array.base': 'participantes debe ser un array',
      'array.min': 'Debe haber al menos 1 participante',
      'array.max': 'No se pueden agregar más de 22 participantes',
      'array.unique': 'No se pueden repetir RUTs',
      'any.required': 'participantes es requerido'
    })
});


// middlewares
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
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
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
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