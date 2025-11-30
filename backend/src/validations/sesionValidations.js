import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';
import { parseDateLocal } from '../utils/dateLocal.js';
import validaHorario from '../utils/validaHorario.js';

const TIPOS_SESION = ['Entrenamiento', 'Partido', 'Partido Amistoso', 'Charla Técnica'];

// 🔧 CONFIGURACIÓN ACTUALIZADA PARA SESIONES
const HORARIO_SESIONES = { 
  inicio: '08:00', 
  fin: '24:00'  // Hasta medianoche
};

const DATE_YYYY_MM_DD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const fechaSchema = Joi.string().pattern(DATE_YYYY_MM_DD)
  .required()
  .custom((value, helpers) => {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const f = parseDateLocal(value); f.setHours(0,0,0,0);
    if (Number.isNaN(f.getTime())) {
      return helpers.error('any.invalid', { message: 'Fecha inválida' });
    }
    if (f < hoy) {
      return helpers.error('any.invalid', { message: 'No se pueden crear sesiones en fechas pasadas' });
    }
    const dia = f.getDay(); // 0 Dom, 6 Sáb
    if (dia === 0 || dia === 6) {
      return helpers.error('any.invalid', { message: 'Solo se pueden crear sesiones de lunes a viernes' });
    }
    return value;
  })
  .messages({ 'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD' });

const horaSchema = Joi.string().pattern(TIME_HH_MM)
  .required()
  .messages({ 'string.pattern.base': 'La hora debe tener formato HH:mm' });

// POST /api/sesion
export const crearSesionBody = Joi.object({
  canchaId: Joi.number().integer().positive().optional().allow(null),
  ubicacionExterna: Joi.string().trim().max(255).optional().allow('', null),
  grupoId: Joi.number().integer().positive().optional().allow('',null),
  fecha: fechaSchema,
  horaInicio: horaSchema,
  horaFin: horaSchema,
  tipoSesion: Joi.string().valid(...TIPOS_SESION).required()
    .messages({
      'any.only': `El tipo de sesión debe ser: ${TIPOS_SESION.join(', ')}`
    }),
  objetivos: Joi.string().trim().max(500).optional().allow('',null),
})
.custom((v, h) => {
  if (!v.canchaId && (!v.ubicacionExterna || v.ubicacionExterna.trim() === '')) {
    return h.error('any.invalid', { 
      message: 'Debe especificar una cancha o una ubicación externa' 
    });
  }
  
  // 🔥 Usar validaHorario con configuración de SESIONES
  const res = validaHorario(v, h, {
    inicio: HORARIO_SESIONES.inicio,
    fin: HORARIO_SESIONES.fin,
    duracionMinima: 30,   
    duracionMaxima: 180, 
    validarBloques: false 
  });
  
  return res === true ? v : res;   
});

export const obtenerSesionesQuery = Joi.object({
  q: Joi.string().trim().max(100).optional(),  
  fecha: Joi.string().pattern(DATE_YYYY_MM_DD).optional()
    .messages({ 'string.pattern.base': 'fecha debe estar en formato YYYY-MM-DD' }),
  canchaId: Joi.number().integer().positive().optional(),   
  grupoId: Joi.number().integer().positive().optional(),
  tipoSesion: Joi.string().trim().max(50).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  horaInicio: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  horaFin: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

// POST /api/sesion/detalle
export const obtenerSesionPorIdBody = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// PATCH /api/sesion
export const actualizarSesionBody = Joi.object({
  id: Joi.number().integer().positive().required(),
  canchaId: Joi.number().integer().positive().optional().allow(null),
  ubicacionExterna: Joi.string().trim().max(255).optional().allow('', null),
  grupoId: Joi.number().integer().positive().optional().allow('',null),
  fecha: Joi.string().pattern(DATE_YYYY_MM_DD).optional(),  
  horaInicio: Joi.string().pattern(TIME_HH_MM).optional(),
  horaFin: Joi.string().pattern(TIME_HH_MM).optional(),
  tipoSesion: Joi.string().valid(...TIPOS_SESION).optional()
    .messages({
      'any.only': `El tipo de sesión debe ser: ${TIPOS_SESION.join(', ')}`
    }),
  objetivos: Joi.string().trim().max(500).optional().allow('',null),
})
.with('horaInicio','horaFin').with('horaFin','horaInicio')
.custom((v, h) => {
  if (v.horaInicio && v.horaFin) {
    // 🔥 Usar validaHorario con configuración de SESIONES
    const res = validaHorario(v, h, {
      inicio: HORARIO_SESIONES.inicio,
      fin: HORARIO_SESIONES.fin,
      duracionMinima: 30,
      duracionMaxima: 180,
      validarBloques: false
    });
    return res === true ? v : res;
  }
  return v;
});

// DELETE /api/sesion/eliminar
export const eliminarSesionBody = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// POST /api/sesion/recurrente
export const crearSesionesRecurrentesBody = Joi.object({
  canchaId: Joi.number().integer().positive().optional().allow(null),
  ubicacionExterna: Joi.string().trim().max(255).optional().allow('', null),
  grupoId: Joi.number().integer().positive().optional().allow('',null),
  fechaInicio: fechaSchema,
  fechaFin: Joi.string().pattern(DATE_YYYY_MM_DD).required(),
  diasSemana: Joi.array().items(Joi.number().integer().min(1).max(5))
              .min(1).max(5).unique().required(),
  horaInicio: horaSchema,
  horaFin: horaSchema,
  tipoSesion: Joi.string().valid(...TIPOS_SESION).required()
    .messages({
      'any.only': `El tipo de sesión debe ser: ${TIPOS_SESION.join(', ')}`
    }),
  objetivos: Joi.string().trim().max(500).optional().allow(''),
})
.custom((v, h) => {
  if (!v.canchaId && (!v.ubicacionExterna || v.ubicacionExterna.trim() === '')) {
    return h.error('any.invalid', { 
      message: 'Debe especificar una cancha o una ubicación externa' 
    });
  }
  
  const inicio = parseDateLocal(v.fechaInicio);
  const fin = parseDateLocal(v.fechaFin);
  if (fin <= inicio) return h.error('any.invalid', { message: 'La fecha fin debe ser mayor a la fecha inicio' });

  const diff = (fin - inicio) / (1000*60*60*24);
  if (diff > 180) return h.error('any.invalid', { message: 'El rango no puede ser mayor a 6 meses (180 días)' });

  // 🔥 Usar validaHorario con configuración de SESIONES
  const res = validaHorario(v, h, {
    inicio: HORARIO_SESIONES.inicio,
    fin: HORARIO_SESIONES.fin,
    duracionMinima: 30,
    duracionMaxima: 180,
    validarBloques: false
  });
  
  return res === true ? v : res;
});

// ✅ Middleware para validar BODY
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { 
    abortEarly: false, 
    stripUnknown: true 
  });
  if (error) {
    const errores = error.details.reduce((acc, d) => {
      acc[d.path.join('.')] = d.context?.message || d.message;
      return acc;
    }, {});
    return validationError(res, errores);
  }
  req.body = value; 
  next();
};

export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errores = error.details.reduce((acc, d) => {
        acc[d.path.join('.')] = d.context?.message || d.message;
        return acc;
      }, {});
      return validationError(res, errores);
    }

    Object.keys(value).forEach(key => {
      req.query[key] = value[key];
    });
    
    next();
  };
}