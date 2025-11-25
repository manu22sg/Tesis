import Joi from 'joi';

const idNum = Joi.number().integer().positive().required();

export const crearLesionBody = Joi.object({
  jugadorId: idNum.label('jugadorId')
    .messages({
      'number.base': 'jugadorId debe ser un número',
      'number.integer': 'jugadorId debe ser un número entero',
      'number.positive': 'jugadorId debe ser positivo',
      'any.required': 'jugadorId es requerido'
    }),
  
  diagnostico: Joi.string()
    .trim()
    .max(2000)
    .required()
    .messages({
      'string.empty': 'diagnóstico es requerido',
      'string.max': 'diagnóstico no puede exceder 2000 caracteres',
      'any.required': 'diagnóstico es requerido'
    }),
  
  fechaInicio: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'fechaInicio debe ser una fecha válida',
      'date.format': 'fechaInicio debe tener formato ISO (YYYY-MM-DD)',
      'any.required': 'fechaInicio es requerida'
    }),
  
  fechaAltaEstimada: Joi.date()
    .iso()
    .greater(Joi.ref('fechaInicio'))
    .optional()
    .allow(null)
    .messages({
      'date.base': 'fechaAltaEstimada debe ser una fecha válida',
      'date.format': 'fechaAltaEstimada debe tener formato ISO (YYYY-MM-DD)',
      'date.greater': 'fechaAltaEstimada debe ser posterior a fechaInicio'
    }),
  
  fechaAltaReal: Joi.date()
    .iso()
    .greater(Joi.ref('fechaInicio'))
    .optional()
    .allow(null)
    .messages({
      'date.base': 'fechaAltaReal debe ser una fecha válida',
      'date.format': 'fechaAltaReal debe tener formato ISO (YYYY-MM-DD)',
      'date.greater': 'fechaAltaReal debe ser posterior a fechaInicio'
    })
});

export const actualizarLesionBody = Joi.object({
  diagnostico: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'diagnóstico no puede exceder 2000 caracteres'
    }),
  
  fechaInicio: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'fechaInicio debe ser una fecha válida',
      'date.format': 'fechaInicio debe tener formato ISO (YYYY-MM-DD)'
    }),
  
  fechaAltaEstimada: Joi.date()
    .iso()
    .optional()
    .allow(null)
    .messages({
      'date.base': 'fechaAltaEstimada debe ser una fecha válida',
      'date.format': 'fechaAltaEstimada debe tener formato ISO (YYYY-MM-DD)'
    }),
  
  fechaAltaReal: Joi.date()
    .iso()
    .optional()
    .allow(null)
    .messages({
      'date.base': 'fechaAltaReal debe ser una fecha válida',
      'date.format': 'fechaAltaReal debe tener formato ISO (YYYY-MM-DD)'
    })
})
  .custom((v, helpers) => {
    if (v.fechaInicio && v.fechaAltaReal && new Date(v.fechaAltaReal) <= new Date(v.fechaInicio)) {
      return helpers.error('any.custom', {
        message: 'fechaAltaReal debe ser mayor a fechaInicio'
      });
    }
    if (v.fechaInicio && v.fechaAltaEstimada && new Date(v.fechaAltaEstimada) <= new Date(v.fechaInicio)) {
      return helpers.error('any.custom', {
        message: 'fechaAltaEstimada debe ser mayor a fechaInicio'
      });
    }
    return v;
  })
  .or('diagnostico', 'fechaInicio', 'fechaAltaEstimada', 'fechaAltaReal')
  .messages({
    'object.missing': 'Debe enviar al menos un campo para actualizar',
  });
