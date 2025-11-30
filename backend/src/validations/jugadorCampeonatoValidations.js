import Joi from 'joi';

export const buscarJugadoresQuerySchema = Joi.object({
  q: Joi.string().trim().optional(),

  carreraId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'carreraId debe ser numérico',
      'number.positive': 'carreraId debe ser mayor a 0'
    }),

  // 🔥 CORREGIDO: Año del campeonato, no año de carrera
  anio: Joi.number().integer().min(2000).max(new Date().getFullYear() + 1).optional()
    .messages({
      'number.base': 'anio debe ser numérico',
      'number.min': 'anio no puede ser menor a 2000',
      'number.max': `anio no puede ser mayor a ${new Date().getFullYear() + 1}`
    }),


  pagina: Joi.number().integer().min(1).optional().default(1)
    .messages({
      'number.base': 'pagina debe ser numérico',
      'number.min': 'pagina debe ser mínimo 1'
    }),

  limite: Joi.number().integer().min(1).max(100).optional().default(10)
    .messages({
      'number.base': 'limite debe ser numérico',
      'number.min': 'limite mínimo es 1',
      'number.max': 'limite máximo es 100'
    })
});

export const usuarioIdParamsSchema = Joi.object({
  usuarioId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'usuarioId debe ser numérico',
      'number.positive': 'usuarioId debe ser mayor a 0',
      'any.required': 'usuarioId es requerido'
    })
});
export const estadisticasParamsSchema = Joi.object({
  usuarioId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'usuarioId debe ser numérico',
      'number.positive': 'usuarioId debe ser mayor a 0',
      'any.required': 'usuarioId es requerido'
    }),

  campeonatoId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'campeonatoId debe ser numérico',
      'number.positive': 'campeonatoId debe ser mayor a 0',
      'any.required': 'campeonatoId es requerido'
    })
});


export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
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

  // 🔥 Fix: no reasignar el objeto, solo actualizarlo
  Object.assign(req.query, value);

  next();
};

export const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
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

  // 🔥 Fix: no reasignar req.params
  Object.assign(req.params, value);

  next();
};
