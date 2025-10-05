import Joi from 'joi';

export const crearEquipoSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'El nombre del equipo es obligatorio',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
  }),
  carrera: Joi.string().max(100).optional().allow(null, ''),
  campeonatoId: Joi.number().integer().positive().required().messages({
    'number.base': 'El ID del campeonato debe ser un número',
    'any.required': 'El ID del campeonato es obligatorio',
  }),
  capitanId: Joi.number().integer().positive().optional().allow(null),
});

export const inscribirParticipantesSchema = Joi.object({
  ruts: Joi.array().items(Joi.string().pattern(/^\d{7,8}-[\dkK]$/)).min(1).required().messages({
    'array.min': 'Debe proporcionar al menos un RUT',
    'string.pattern.base': 'Formato de RUT inválido (ejemplo: 12345678-9)',
    'any.required': 'La lista de RUTs es obligatoria',
  }),
});