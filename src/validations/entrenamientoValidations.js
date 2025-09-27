import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';
import { parseDateLocal} from '../utils/dateLocal.js';
import validaHorario from '../utils/validaHorario.js';

const HORARIO_FUNCIONAMIENTO = { inicio: '09:00', fin: '15:00', duracionBloque: 90 };
const DATE_YYYY_MM_DD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;



// Schema para fecha (desde hoy hacia adelante)
const fechaEntrenamientoSchema = Joi.string().pattern(DATE_YYYY_MM_DD)
  .required()
  .custom((value, helpers) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fecha = parseDateLocal(value); 
    fecha.setHours(0, 0, 0, 0);

    const diaSemana = fecha.getDay(); // 0=Dom, 1=Lun, ... 6=Sáb

    if (Number.isNaN(fecha.getTime())) {
      return helpers.error('any.invalid', { message: 'Fecha inválida' });
    }
    if (diaSemana === 0 || diaSemana === 6) {
      return helpers.error('any.invalid', { 
        message: 'Solo se pueden crear entrenamientos de lunes a viernes' 
      });
    }
    if (fecha < hoy) {
      return helpers.error('any.invalid', { 
        message: 'No se pueden crear entrenamientos en fechas pasadas' 
      });
    }
    return value;
  })
  .messages({
    'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD (ej: 2025-09-24)',
  });


// Schema para hora
const horaSchema = Joi.string().pattern(TIME_HH_MM)
  .required()
  .messages({
    'string.pattern.base': 'La hora debe tener formato HH:mm (ej: 09:00)'
  });

// === Schemas ===

// POST /api/entrenamientos - Crear entrenamiento
export const crearEntrenamientoBody = Joi.object({
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

  fecha: fechaEntrenamientoSchema,

  horaInicio: horaSchema,

  horaFin: horaSchema,

  motivo: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .optional()
    .default('Entrenamiento masculino')
    .messages({
      'string.base': 'El motivo debe ser texto',
      'string.min': 'El motivo debe tener al menos 5 caracteres',
      'string.max': 'El motivo no puede exceder 100 caracteres'
    }),

  descripcion: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.base': 'La descripción debe ser texto',
      'string.max': 'La descripción no puede exceder 500 caracteres'
    })
}).custom((value, helpers) => {
  validaHorario(value, helpers,HORARIO_FUNCIONAMIENTO);
  return value;
});

// GET /api/entrenamientos - Obtener entrenamientos
export const obtenerEntrenamientosBody = Joi.object({
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

// POST /api/entrenamientos/detalle - Obtener entrenamiento por ID
export const obtenerEntrenamientoPorIdBody = Joi.object({
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

// PATCH /api/entrenamientos - Actualizar entrenamiento
export const actualizarEntrenamientoBody = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'El ID debe ser un número',
    'number.integer': 'El ID debe ser un número entero',
    'number.positive': 'El ID debe ser mayor a 0',
    'any.required': 'El ID es requerido'
  }),

  canchaId: Joi.number().integer().positive().optional().messages({
    'number.base': 'canchaId debe ser un número',
    'number.integer': 'canchaId debe ser un número entero',
    'number.positive': 'canchaId debe ser mayor a 0'
  }),

  fecha: Joi.string().pattern(DATE_YYYY_MM_DD).optional().messages({
    'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD'
  }),

  horaInicio: Joi.string().pattern(TIME_HH_MM).optional().messages({
    'string.pattern.base': 'La hora debe tener formato HH:mm'
  }),

  horaFin: Joi.string().pattern(TIME_HH_MM).optional().messages({
    'string.pattern.base': 'La hora debe tener formato HH:mm'
  }),

  motivo: Joi.string().trim().min(5).max(100).optional().messages({
    'string.base': 'El motivo debe ser texto',
    'string.min': 'El motivo debe tener al menos 5 caracteres',
    'string.max': 'El motivo no puede exceder 100 caracteres'
  }),

  descripcion: Joi.string().trim().max(500).optional().allow('').messages({
    'string.base': 'La descripción debe ser texto',
    'string.max': 'La descripción no puede exceder 500 caracteres'
  })
})
.with('horaInicio', 'horaFin')
.with('horaFin', 'horaInicio')
.custom((value, helpers) => {
  if (value.horaInicio && value.horaFin) {
    validaHorario(value, helpers,HORARIO_FUNCIONAMIENTO);
  }
  return value;
});

// DELETE /api/entrenamientos/eliminar - Eliminar entrenamiento
export const eliminarEntrenamientoBody = Joi.object({
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

// POST /api/entrenamientos/recurrente - Crear entrenamientos recurrentes
export const crearEntrenamientosRecurrentesBody = Joi.object({
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

  fechaInicio: fechaEntrenamientoSchema,

  fechaFin: Joi.string()
    .pattern(DATE_YYYY_MM_DD)
    .required()
    .messages({
      'string.pattern.base': 'La fecha fin debe tener formato YYYY-MM-DD',
      'any.required': 'La fecha fin es requerida'
    }),

  diasSemana: Joi.array()
    .items(Joi.number().integer().min(1).max(5))
    .min(1)
    .max(5)
    .unique()
    .required()
    .messages({
      'array.base': 'Los días de la semana deben ser un array',
      'array.min': 'Debe seleccionar al menos un día de la semana',
      'array.max': 'No puede seleccionar más de 5 días',
      'array.unique': 'No se pueden repetir días de la semana',
      'number.base': 'Los días deben ser números (1=lunes, ..., 5=viernes)',
      'number.min': 'Los días deben ser entre 1 y 5',
      'number.max': 'Los días deben ser entre 1 y 5',
      'any.required': 'Los días de la semana son requeridos'
    }),

  horaInicio: horaSchema,

  horaFin: horaSchema,

  motivo: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .optional()
    .default('Entrenamiento masculino')
    .messages({
      'string.base': 'El motivo debe ser texto',
      'string.min': 'El motivo debe tener al menos 5 caracteres',
      'string.max': 'El motivo no puede exceder 100 caracteres'
    }),

  descripcion: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.base': 'La descripción debe ser texto',
      'string.max': 'La descripción no puede exceder 500 caracteres'
    })
}).custom((value, helpers) => {
  // Validar que fechaFin sea mayor a fechaInicio
  const inicio = parseDateLocal(value.fechaInicio);
  const fin = parseDateLocal(value.fechaFin);

  if (fin <= inicio) {
    return helpers.error('any.invalid', {
      message: 'La fecha fin debe ser mayor a la fecha inicio'
    });
  }

  // Validar rango máximo (no más de 6 meses)
  const diffDays = (fin - inicio) / (1000 * 60 * 60 * 24);
  if (diffDays > 180) {
    return helpers.error('any.invalid', {
      message: 'El rango no puede ser mayor a 6 meses (180 días)'
    });
  }

  validaHorario(value, helpers,HORARIO_FUNCIONAMIENTO);

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