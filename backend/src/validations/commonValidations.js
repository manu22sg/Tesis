import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

export const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID debe ser un número',
      'number.integer': 'ID debe ser un número entero',
      'number.positive': 'ID debe ser positivo',
      'any.required': 'ID es requerido'
    })
});

export const jugadorIdParamSchema = Joi.object({
  jugadorId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'jugadorId debe ser un número',
      'number.integer': 'jugadorId debe ser un número entero',
      'number.positive': 'jugadorId debe ser positivo',
      'any.required': 'jugadorId es requerido'
    })
});

export const sesionIdParamSchema = Joi.object({
  sesionId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.integer': 'sesionId debe ser un número entero',
      'number.positive': 'sesionId debe ser positivo',
      'any.required': 'sesionId es requerido'
    })
});

// ✅ Schema base de paginación (sin filtros específicos)
export const paginacionBaseSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'página debe ser un número',
      'number.integer': 'página debe ser un número entero',
      'number.min': 'página debe ser mayor a 0'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'límite debe ser un número',
      'number.integer': 'límite debe ser un número entero',
      'number.min': 'límite debe ser mayor a 0',
      'number.max': 'límite debe ser menor o igual a 100'
    })
});

// ✅ Schema con filtros específicos para jugadores


// ✅ Schema para exportar estadísticas
export const exportarEstadisticasQuerySchema = Joi.object({
  tipo: Joi.string()
    .valid('jugador', 'sesion')
    .required()
    .messages({
      'any.only': 'tipo debe ser: jugador o sesion',
      'any.required': 'tipo es requerido'
    }),
  
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'id debe ser un número',
      'number.integer': 'id debe ser un número entero',
      'number.positive': 'id debe ser positivo',
      'any.required': 'id es requerido'
    })
});

export const grupoParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID debe ser un número',
      'number.integer': 'ID debe ser un número entero',
      'number.positive': 'ID debe ser positivo',
      'any.required': 'ID es requerido'
    }),
  grupoId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'grupoId debe ser un número',
      'number.integer': 'grupoId debe ser un número entero',
      'number.positive': 'grupoId debe ser positivo',
      'any.required': 'grupoId es requerido'
    })
});

export const paginacionSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'pagina debe ser un número',
      'number.integer': 'pagina debe ser un número entero',
      'number.min': 'pagina debe ser mayor a 0'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'limite debe ser un número',
      'number.integer': 'limite debe ser un número entero',
      'number.min': 'limite debe ser mayor a 0',
      'number.max': 'limite debe ser menor o igual a 100'
    }),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido', 'lesionado')
    .optional()
    .messages({
      'any.only': 'estado debe ser: activo, inactivo, suspendido o lesionado'
    }),

  carrera: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'carrera no puede tener más de 100 caracteres'
    }),

  anioIngreso: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .optional()
    .messages({
      'number.base': 'anioIngreso debe ser un número',
      'number.integer': 'anioIngreso debe ser un número entero',
      'number.min': 'anioIngreso debe ser mayor a 1900',
      'number.max': `anioIngreso debe ser menor a ${new Date().getFullYear() + 10}`
    })
});


export const exportarEvaluacionesQuerySchema = Joi.object({
  jugadorId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'jugadorId debe ser un número',
      'number.integer': 'jugadorId debe ser un número entero',
      'number.positive': 'jugadorId debe ser positivo'
    }),
  
  sesionId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.integer': 'sesionId debe ser un número entero',
      'number.positive': 'sesionId debe ser positivo'
    }),
  
  desde: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'desde debe tener formato YYYY-MM-DD'
    }),
  
  hasta: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'hasta debe tener formato YYYY-MM-DD'
    }),
  
  q: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'búsqueda no puede exceder 100 caracteres'
    })
})
  .custom((value, helpers) => {
    // Al menos uno debe estar presente
    if (!value.jugadorId && !value.sesionId) {
      return helpers.error('any.custom', {
        message: 'Debe proporcionar jugadorId o sesionId'
      });
    }
    return value;
  });

// ✅ Schema de paginación para evaluaciones (con filtros de fecha)
export const paginacionEvaluacionesSchema = paginacionBaseSchema.keys({
  desde: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'desde debe tener formato YYYY-MM-DD'
    }),
  
  hasta: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'hasta debe tener formato YYYY-MM-DD'
    }),
  
  sesionId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.integer': 'sesionId debe ser un número entero',
      'number.positive': 'sesionId debe ser positivo'
    }),
  
  jugadorId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'jugadorId debe ser un número',
      'number.integer': 'jugadorId debe ser un número entero',
      'number.positive': 'jugadorId debe ser positivo'
    }),
  
  q: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'búsqueda no puede exceder 100 caracteres'
    })
});

export const paginacionJugadoresSchema = paginacionBaseSchema.keys({
  q: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'búsqueda no puede exceder 100 caracteres'
    }),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido', 'lesionado')
    .optional()
    .messages({
      'any.only': 'estado debe ser: activo, inactivo, suspendido o lesionado'
    }),

  carreraId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'carreraId debe ser un número',
      'number.integer': 'carreraId debe ser un número entero',
      'number.positive': 'carreraId debe ser positivo'
    }),

  carreraNombre: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'carreraNombre no puede exceder 100 caracteres'
    }),

  anioIngreso: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .optional()
    .messages({
      'number.base': 'anioIngreso debe ser un número',
      'number.integer': 'anioIngreso debe ser un número entero',
      'number.min': 'anioIngreso debe ser mayor a 1900',
      'number.max': `anioIngreso debe ser menor a ${new Date().getFullYear() + 10}`
    }),

  grupoId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'grupoId debe ser un número',
      'number.integer': 'grupoId debe ser un número entero',
      'number.positive': 'grupoId debe ser positivo'
    }),

  posicion: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'posición no puede exceder 50 caracteres'
    }),

  posicionSecundaria: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'posicionSecundaria no puede exceder 50 caracteres'
    }),

  piernaHabil: Joi.string()
    .valid('Derecha', 'Izquierda', 'Ambas')
    .optional()
    .messages({
      'any.only': 'piernaHabil debe ser: Derecha, Izquierda o Ambas'
    })
});

// ✅ Schema para exportar jugadores (sin paginación pero con todos los filtros)
export const exportarJugadoresQuerySchema = Joi.object({
  q: Joi.string().max(100).optional(),
  estado: Joi.string().valid('activo', 'inactivo', 'suspendido', 'lesionado').optional(),
  carreraId: Joi.number().integer().positive().optional(),
  carreraNombre: Joi.string().max(100).optional(),
  anioIngreso: Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).optional(),
  grupoId: Joi.number().integer().positive().optional(),
  posicion: Joi.string().max(50).optional(),
  posicionSecundaria: Joi.string().max(50).optional(),
  piernaHabil: Joi.string().valid('Derecha', 'Izquierda', 'Ambas').optional()
});


export const paginacionLesionesSchema = paginacionBaseSchema.keys({
  jugadorId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'jugadorId debe ser un número',
      'number.integer': 'jugadorId debe ser un número entero',
      'number.positive': 'jugadorId debe ser positivo'
    }),
  
  desde: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'desde debe ser una fecha válida',
      'date.format': 'desde debe tener formato ISO (YYYY-MM-DD)'
    }),
  
  hasta: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'hasta debe ser una fecha válida',
      'date.format': 'hasta debe tener formato ISO (YYYY-MM-DD)'
    }),
  
  q: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'búsqueda no puede exceder 100 caracteres'
    })
});

// ✅ Schema para exportar lesiones
export const exportarLesionesQuerySchema = Joi.object({
  jugadorId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'jugadorId debe ser un número',
      'number.integer': 'jugadorId debe ser un número entero',
      'number.positive': 'jugadorId debe ser positivo'
    }),
  
  desde: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'desde debe ser una fecha válida',
      'date.format': 'desde debe tener formato ISO (YYYY-MM-DD)'
    }),
  
  hasta: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'hasta debe ser una fecha válida',
      'date.format': 'hasta debe tener formato ISO (YYYY-MM-DD)'
    }),
  
  q: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'búsqueda no puede exceder 100 caracteres'
    })
});


export const paginacionAsistenciasSchema = paginacionBaseSchema.keys({
  estado: Joi.string()
    .optional()
    .messages({
      'string.base': 'estado debe ser texto'
    }),
  
  jugadorId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'jugadorId debe ser un número',
      'number.integer': 'jugadorId debe ser un número entero',
      'number.positive': 'jugadorId debe ser positivo'
    }),
  
  sesionId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.integer': 'sesionId debe ser un número entero',
      'number.positive': 'sesionId debe ser positivo'
    })
});

// ✅ Schema para exportar asistencias
export const exportarAsistenciasQuerySchema = Joi.object({
  sesionId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.integer': 'sesionId debe ser un número entero',
      'number.positive': 'sesionId debe ser positivo'
    }),
  
  jugadorId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'jugadorId debe ser un número',
      'number.integer': 'jugadorId debe ser un número entero',
      'number.positive': 'jugadorId debe ser positivo'
    }),
  
  mobile: Joi.string()
    .valid('true', 'false')
    .optional()
    .messages({
      'any.only': 'mobile debe ser "true" o "false"'
    })
})
  .custom((value, helpers) => {
    // Al menos uno debe estar presente
    if (!value.sesionId && !value.jugadorId) {
      return helpers.error('any.custom', {
        message: 'Debe proporcionar sesionId o jugadorId'
      });
    }
    return value;
  });



export const validarBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return validationError(res, errors);
    }

    req.body = value;
    next();
  };
};

export const validarParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return validationError(res, errors);
    }

    req.params = value;
    next();
  };
};

export const validarQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return validationError(res, errors);
    }

    Object.assign(req.query, value);
    next();
  };
};