import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';
import { parseDateLocal } from '../utils/dateLocal.js';
import validaHorario from '../utils/validaHorario.js';

const HORARIO_FUNCIONAMIENTO = { inicio: '09:00', fin: '16:00' };
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

// POST /api/sesiones
export const crearSesionBody = Joi.object({
  canchaId: Joi.number().integer().positive().required(),  
  grupoId: Joi.number().integer().positive().optional(),
  fecha: fechaSchema,
  horaInicio: horaSchema,
  horaFin: horaSchema,
  tipoSesion: Joi.string().trim().max(50).required(),
  objetivos: Joi.string().trim().max(500).optional().allow(''),
}).custom((v, h) => {
  const res = validaHorario(v, h, HORARIO_FUNCIONAMIENTO);
  return res === true ? v : res;   
});


// GET /api/sesiones
export const obtenerSesionesBody = Joi.object({
  fecha: Joi.string().pattern(DATE_YYYY_MM_DD).optional(),
  canchaId: Joi.number().integer().positive().optional(),   
  grupoId: Joi.number().integer().positive().optional(),
  tipoSesion: Joi.string().trim().max(50).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});


// POST /api/sesiones/detalle
export const obtenerSesionPorIdBody = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// PATCH /api/sesiones
export const actualizarSesionBody = Joi.object({
  id: Joi.number().integer().positive().required(),
  canchaId: Joi.number().integer().positive().optional(),    
  grupoId: Joi.number().integer().positive().optional(),
  fecha: Joi.string().pattern(DATE_YYYY_MM_DD).optional(),  
  horaInicio: Joi.string().pattern(TIME_HH_MM).optional(),
  horaFin: Joi.string().pattern(TIME_HH_MM).optional(),
  tipoSesion: Joi.string().trim().max(50).optional(),
  objetivos: Joi.string().trim().max(500).optional().allow(''),
})
.with('horaInicio','horaFin').with('horaFin','horaInicio')
.custom((v, h) => {
  if (v.horaInicio && v.horaFin) {
    const res = validaHorario(v, h, HORARIO_FUNCIONAMIENTO);
    return res === true ? v : res;
  }
  return v;
});

// DELETE /api/sesiones/eliminar
export const eliminarSesionBody = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// POST /api/sesiones/recurrente
export const crearSesionesRecurrentesBody = Joi.object({
  canchaId: Joi.number().integer().positive().required(),   
  grupoId: Joi.number().integer().positive().optional(),
  fechaInicio: fechaSchema,
  fechaFin: Joi.string().pattern(DATE_YYYY_MM_DD).required(),
  diasSemana: Joi.array().items(Joi.number().integer().min(1).max(5)) // L-V
              .min(1).max(5).unique().required(),
  horaInicio: horaSchema,
  horaFin: horaSchema,
  tipoSesion: Joi.string().trim().max(50).required(),
  objetivos: Joi.string().trim().max(500).optional().allow(''),
}).custom((v, h) => {
  const inicio = parseDateLocal(v.fechaInicio);
  const fin = parseDateLocal(v.fechaFin);
  if (fin <= inicio) return h.error('any.invalid', { message: 'La fecha fin debe ser mayor a la fecha inicio' });

  const diff = (fin - inicio) / (1000*60*60*24);
  if (diff > 180) return h.error('any.invalid', { message: 'El rango no puede ser mayor a 6 meses (180 días)' });

  const res = validaHorario(v, h, { inicio: '09:00', fin: '16:00' });
  return res === true ? v : res;
});



export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errores = error.details.reduce((acc, d) => {
      acc[d.path.join('.')] = d.context?.message || d.message;
      return acc;
    }, {});
    return validationError(res, errores);
  }
  req.body = value; next();
};
