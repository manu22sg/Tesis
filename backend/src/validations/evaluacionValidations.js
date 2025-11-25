import Joi from 'joi';

// ✅ Crear evaluación
export const crearEvaluacionBody = Joi.object({
  jugadorId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'jugadorId debe ser un número',
      'number.integer': 'jugadorId debe ser un número entero',
      'number.positive': 'jugadorId debe ser positivo',
      'any.required': 'jugadorId es requerido'
    }),
  
  sesionId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.integer': 'sesionId debe ser un número entero',
      'number.positive': 'sesionId debe ser positivo',
      'any.required': 'sesionId es requerido'
    }),
  
  tecnica: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'técnica debe ser un número',
      'number.integer': 'técnica debe ser un número entero',
      'number.min': 'técnica debe ser al menos 1',
      'number.max': 'técnica debe ser máximo 10'
    }),
  
  tactica: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'táctica debe ser un número',
      'number.integer': 'táctica debe ser un número entero',
      'number.min': 'táctica debe ser al menos 1',
      'number.max': 'táctica debe ser máximo 10'
    }),
  
  actitudinal: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'actitudinal debe ser un número',
      'number.integer': 'actitudinal debe ser un número entero',
      'number.min': 'actitudinal debe ser al menos 1',
      'number.max': 'actitudinal debe ser máximo 10'
    }),
  
  fisica: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'física debe ser un número',
      'number.integer': 'física debe ser un número entero',
      'number.min': 'física debe ser al menos 1',
      'number.max': 'física debe ser máximo 10'
    }),
  
  observaciones: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'observaciones no puede exceder 2000 caracteres'
    })
})
  .custom((value, helpers) => {
    // Al menos uno de los aspectos o una observación
    const tieneNotas = value.tecnica != null || value.tactica != null || 
                       value.actitudinal != null || value.fisica != null;
    const tieneObservaciones = value.observaciones && value.observaciones.trim();
    
    if (!tieneNotas && !tieneObservaciones) {
      return helpers.error('any.custom', {
        message: 'Debe evaluar al menos un aspecto o escribir observaciones'
      });
    }
    return value;
  });

// ✅ Actualizar evaluación
export const actualizarEvaluacionBody = Joi.object({
  tecnica: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'técnica debe ser un número',
      'number.integer': 'técnica debe ser un número entero',
      'number.min': 'técnica debe ser al menos 1',
      'number.max': 'técnica debe ser máximo 10'
    }),
  
  tactica: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'táctica debe ser un número',
      'number.integer': 'táctica debe ser un número entero',
      'number.min': 'táctica debe ser al menos 1',
      'number.max': 'táctica debe ser máximo 10'
    }),
  
  actitudinal: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'actitudinal debe ser un número',
      'number.integer': 'actitudinal debe ser un número entero',
      'number.min': 'actitudinal debe ser al menos 1',
      'number.max': 'actitudinal debe ser máximo 10'
    }),
  
  fisica: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'física debe ser un número',
      'number.integer': 'física debe ser un número entero',
      'number.min': 'física debe ser al menos 1',
      'number.max': 'física debe ser máximo 10'
    }),
  
  observaciones: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'observaciones no puede exceder 2000 caracteres'
    })
})
  .min(1)
  .messages({
    'object.min': 'Debe enviar al menos un campo para actualizar'
  });