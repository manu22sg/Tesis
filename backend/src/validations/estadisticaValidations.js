import Joi from 'joi';

export const upsertEstadisticaBody = Joi.object({
  jugadorId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'jugadorId debe ser un número',
      'number.integer': 'jugadorId debe ser un número entero',
      'number.positive': 'jugadorId debe ser positivo',
      'any.required': 'jugadorId es requerido'
    }),
  
  sesionId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'sesionId debe ser un número',
      'number.integer': 'sesionId debe ser un número entero',
      'number.positive': 'sesionId debe ser positivo',
      'any.required': 'sesionId es requerido'
    }),
  
  goles: Joi.number().integer().min(0).default(0)
    .messages({
      'number.base': 'goles debe ser un número',
      'number.integer': 'goles debe ser un número entero',
      'number.min': 'goles no puede ser negativo'
    }),
  
  asistencias: Joi.number().integer().min(0).default(0)
    .messages({
      'number.base': 'asistencias debe ser un número',
      'number.integer': 'asistencias debe ser un número entero',
      'number.min': 'asistencias no puede ser negativo'
    }),
  
  tarjetasAmarillas: Joi.number().integer().min(0).default(0)
    .messages({
      'number.base': 'tarjetasAmarillas debe ser un número',
      'number.integer': 'tarjetasAmarillas debe ser un número entero',
      'number.min': 'tarjetasAmarillas no puede ser negativo'
    }),
  
  tarjetasRojas: Joi.number().integer().min(0).default(0)
    .messages({
      'number.base': 'tarjetasRojas debe ser un número',
      'number.integer': 'tarjetasRojas debe ser un número entero',
      'number.min': 'tarjetasRojas no puede ser negativo'
    }),
  
  minutosJugados: Joi.number().integer().min(0).default(0)
    .messages({
      'number.base': 'minutosJugados debe ser un número',
      'number.integer': 'minutosJugados debe ser un número entero',
      'number.min': 'minutosJugados no puede ser negativo'
    }),
  
  arcosInvictos: Joi.number().integer().min(0).default(0)
    .messages({
      'number.base': 'arcosInvictos debe ser un número',
      'number.integer': 'arcosInvictos debe ser un número entero',
      'number.min': 'arcosInvictos no puede ser negativo'
    })
});