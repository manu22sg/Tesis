import Joi from 'joi';

export const generarAlineacionInteligenteSchema = Joi.object({
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
    
  grupoId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'grupoId debe ser un número',
      'number.integer': 'grupoId debe ser un número entero',
      'number.positive': 'grupoId debe ser positivo',
      'any.required': 'grupoId es requerido'
    }),
    
  tipoAlineacion: Joi.string()
    .valid('ofensiva', 'defensiva')
    .required()
    .messages({
      'any.only': 'tipoAlineacion debe ser "ofensiva" o "defensiva"',
      'any.required': 'tipoAlineacion es requerido'
    }),
    
  formacion: Joi.string()
    .valid('4-3-3', '3-4-3', '4-2-4', '5-4-1', '5-3-2', '4-5-1')
    .required()
    .messages({
      'any.only': 'formacion debe ser una formación válida',
      'any.required': 'formacion es requerido'
    })
});