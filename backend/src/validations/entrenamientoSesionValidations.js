import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

export const crearEntrenamientoBody = Joi.object({
  sesionId: Joi.number().integer().positive().optional().allow(null)
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.positive': 'sesionId debe ser positivo',
    }),
  titulo: Joi.string().trim().min(3).max(100).required()
    .messages({
      'string.empty': 'El título no puede estar vacío',
      'string.min': 'El título debe tener al menos 3 caracteres',
      'string.max': 'El título no puede exceder 100 caracteres',
      'any.required': 'El título es obligatorio'
    }),
  descripcion: Joi.string().trim().max(1000).optional().allow('', null)
    .messages({
      'string.max': 'La descripción no puede exceder 1000 caracteres'
    }),
  duracionMin: Joi.number().integer().min(1).max(300).optional().allow(null)
    .messages({
      'number.base': 'duracionMin debe ser un número',
      'number.min': 'La duración debe ser al menos 1 minuto',
      'number.max': 'La duración no puede exceder 300 minutos (5 horas)'
    }),
  orden: Joi.number().integer().min(1).max(99).optional().allow(null)
    .messages({
      'number.base': 'orden debe ser un número',
      'number.min': 'El orden debe ser al menos 1',
      'number.max': 'El orden no puede exceder 99'
    }),
});

export const asignarEntrenamientosBody = Joi.object({
  ids: Joi.array().items(
    Joi.number().integer().positive().required()
  ).min(1).required()
    .messages({
      'array.min': 'Debe seleccionar al menos un entrenamiento',
      'any.required': 'Debe proporcionar la lista de entrenamientos a asignar'
    })
});


export const obtenerEntrenamientosQuery = Joi.object({
  q: Joi.string().trim().max(100).optional()
    .messages({
      'string.max': 'La búsqueda no puede exceder 100 caracteres'
    }),
  sesionId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.positive': 'sesionId debe ser positivo'
    }),
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'page debe ser un número',
      'number.min': 'page debe ser al menos 1'
    }),
  limit: Joi.number().integer().min(1).max(50).default(10)
    .messages({
      'number.base': 'limit debe ser un número',
      'number.min': 'limit debe ser al menos 1',
      'number.max': 'limit no puede exceder 50'
    }),
});

export const obtenerEntrenamientoPorIdParams = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'El ID debe ser un número',
      'number.positive': 'El ID debe ser positivo',
      'any.required': 'El ID es obligatorio'
    }),
});

export const actualizarEntrenamientoBody = Joi.object({
  sesionId: Joi.number().integer().positive().optional().allow('',null)
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.positive': 'sesionId debe ser positivo'
    }),
  titulo: Joi.string().trim().min(3).max(100).optional()
    .messages({
      'string.empty': 'El título no puede estar vacío',
      'string.min': 'El título debe tener al menos 3 caracteres',
      'string.max': 'El título no puede exceder 100 caracteres'
    }),
  descripcion: Joi.string().trim().max(1000).optional().allow('', null)
    .messages({
      'string.max': 'La descripción no puede exceder 1000 caracteres'
    }),
  duracionMin: Joi.number().integer().min(1).max(300).optional().allow(null)
    .messages({
      'number.base': 'duracionMin debe ser un número',
      'number.min': 'La duración debe ser al menos 1 minuto',
      'number.max': 'La duración no puede exceder 300 minutos (5 horas)'
    }),
  orden: Joi.number().integer().min(1).max(99).optional().allow(null)
    .messages({
      'number.base': 'orden debe ser un número',
      'number.min': 'El orden debe ser al menos 1',
      'number.max': 'El orden no puede exceder 99'
    }),
}).min(1) 
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar'
  });

export const eliminarEntrenamientoParams = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'El ID debe ser un número',
      'number.positive': 'El ID debe ser positivo',
      'any.required': 'El ID es obligatorio'
    }),
});

export const obtenerEntrenamientosPorSesionParams = Joi.object({
  sesionId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.positive': 'sesionId debe ser positivo',
      'any.required': 'sesionId es obligatorio'
    }),
});



export const reordenarEntrenamientosBody = Joi.object({
  sesionId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.positive': 'sesionId debe ser positivo',
      'any.required': 'sesionId es obligatorio'
    }),
  entrenamientos: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().positive().required()
          .messages({
            'number.base': 'El ID debe ser un número',
            'number.positive': 'El ID debe ser positivo',
            'any.required': 'El ID es obligatorio'
          }),
        orden: Joi.number().integer().min(1).max(99).required()
          .messages({
            'number.base': 'orden debe ser un número',
            'number.min': 'El orden debe ser al menos 1',
            'number.max': 'El orden no puede exceder 99',
            'any.required': 'El orden es obligatorio'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Debe proporcionar al menos un entrenamiento',
      'any.required': 'La lista de entrenamientos es obligatoria'
    })
});

export const duplicarEntrenamientoBody = Joi.object({
  nuevaSesionId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'nuevaSesionId debe ser un número',
      'number.positive': 'nuevaSesionId debe ser positivo'
    })
}).allow({}); 

export const obtenerEstadisticasQuery = Joi.object({
  sesionId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.positive': 'sesionId debe ser positivo'
    })
});


export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { 
    abortEarly: false, 
    stripUnknown: true,
    convert: true
  });
  
  if (error) {
    const errores = error.details.reduce((acc, d) => {
      acc[d.path.join('.')] = d.message;
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
        acc[d.path.join('.')] = d.message;
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

export function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errores = error.details.reduce((acc, d) => {
        acc[d.path.join('.')] = d.message;
        return acc;
      }, {});
      return validationError(res, errores);
    }

    Object.keys(value).forEach(key => {
      req.params[key] = value[key];
    });
    
    next();
  };
}