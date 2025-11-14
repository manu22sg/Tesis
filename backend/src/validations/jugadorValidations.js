import Joi from 'joi';

export const crearJugadorSchema = Joi.object({
  usuarioId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'usuarioId debe ser un número',
      'number.integer': 'usuarioId debe ser un número entero',
      'number.positive': 'usuarioId debe ser positivo',
      'any.required': 'usuarioId es requerido'
    }),

  // 🆕 Campos actualizados según la nueva estructura
  posicion: Joi.string()
    .max(50)
    .valid('Portero', 'Defensa', 'Mediocampista', 'Delantero')
    .optional()
    .messages({
      'string.max': 'posicion no puede tener más de 50 caracteres',
      'any.only': 'posicion debe ser: Portero, Defensa, Mediocampista o Delantero'
    }),

  piernaHabil: Joi.string()
    .max(10)
    .valid('Derecha', 'Izquierda', 'Ambas')
    .optional()
    .messages({
      'string.max': 'piernaHabil no puede tener más de 10 caracteres',
      'any.only': 'piernaHabil debe ser: Derecha, Izquierda o Ambas'
    }),

  altura: Joi.number()
    .precision(2)
    .min(100)
    .max(250)
    .optional()
    .messages({
      'number.base': 'altura debe ser un número',
      'number.min': 'altura debe ser al menos 100 cm',
      'number.max': 'altura no puede superar 250 cm'
    }),

  peso: Joi.number()
    .precision(2)
    .min(30)
    .max(200)
    .optional()
    .messages({
      'number.base': 'peso debe ser un número',
      'number.min': 'peso debe ser al menos 30 kg',
      'number.max': 'peso no puede superar 200 kg'
    }),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido', 'lesionado')
    .default('activo')
    .messages({
      'any.only': 'estado debe ser: activo, inactivo, suspendido o lesionado'
    }),

  fechaNacimiento: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.base': 'fechaNacimiento debe ser una fecha válida',
      'date.format': 'fechaNacimiento debe estar en formato ISO (YYYY-MM-DD)',
      'date.max': 'fechaNacimiento no puede ser una fecha futura'
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

export const actualizarJugadorSchema = Joi.object({
  // 🆕 Campos actualizados (no se puede cambiar usuarioId)
  posicion: Joi.string()
    .max(50)
    .valid('Portero', 'Defensa', 'Mediocampista', 'Delantero')
    .optional()
    .messages({
      'string.max': 'posicion no puede tener más de 50 caracteres',
      'any.only': 'posicion debe ser: Portero, Defensa, Mediocampista o Delantero'
    }),

  piernaHabil: Joi.string()
    .max(10)
    .valid('Derecha', 'Izquierda', 'Ambas')
    .optional()
    .messages({
      'string.max': 'piernaHabil no puede tener más de 10 caracteres',
      'any.only': 'piernaHabil debe ser: Derecha, Izquierda o Ambas'
    }),

  altura: Joi.number()
    .precision(2)
    .min(100)
    .max(250)
    .optional()
    .messages({
      'number.base': 'altura debe ser un número',
      'number.min': 'altura debe ser al menos 100 cm',
      'number.max': 'altura no puede superar 250 cm'
    }),

  peso: Joi.number()
    .precision(2)
    .min(30)
    .max(200)
    .optional()
    .messages({
      'number.base': 'peso debe ser un número',
      'number.min': 'peso debe ser al menos 30 kg',
      'number.max': 'peso no puede superar 200 kg'
    }),

  imc: Joi.number()
    .precision(2)
    .min(10)
    .max(50)
    .optional()
    .messages({
      'number.base': 'imc debe ser un número',
      'number.min': 'imc debe ser al menos 10',
      'number.max': 'imc no puede superar 50'
    }),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido', 'lesionado')
    .optional()
    .messages({
      'any.only': 'estado debe ser: activo, inactivo, suspendido o lesionado'
    }),

  fechaNacimiento: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.base': 'fechaNacimiento debe ser una fecha válida',
      'date.format': 'fechaNacimiento debe estar en formato ISO (YYYY-MM-DD)',
      'date.max': 'fechaNacimiento no puede ser una fecha futura'
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
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar'
  });

// 🆕 Schema para validar asignación a grupo
export const asignarGrupoSchema = Joi.object({
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

// 🆕 Schema para validar filtros de búsqueda
export const filtrosJugadoresSchema = Joi.object({
  pagina: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),

  limite: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional(),

  q: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'La búsqueda no puede tener más de 100 caracteres'
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
      'string.max': 'carreraNombre no puede tener más de 100 caracteres'
    }),

  anioIngreso: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .optional()
    .messages({
      'number.base': 'anioIngreso debe ser un número',
      'number.integer': 'anioIngreso debe ser un número entero'
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
    .valid('Portero', 'Defensa', 'Mediocampista', 'Delantero')
    .optional()
    .messages({
      'any.only': 'posicion debe ser: Portero, Defensa, Mediocampista o Delantero'
    }),

  piernaHabil: Joi.string()
    .valid('Derecha', 'Izquierda', 'Ambas')
    .optional()
    .messages({
      'any.only': 'piernaHabil debe ser: Derecha, Izquierda o Ambas'
    })
});