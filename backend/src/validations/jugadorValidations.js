import Joi from 'joi';

const POSICIONES_VALIDAS = [
  'Portero',
  'Defensa Central',
  'Defensa Central Derecho',   
  'Defensa Central Izquierdo', 
  'Lateral Derecho',
  'Lateral Izquierdo',
  'Mediocentro Defensivo',
  'Mediocentro',
  'Mediocentro Ofensivo',
  'Extremo Derecho',
  'Extremo Izquierdo',
  'Delantero Centro'
];

/* ============================================================
   🟢 SCHEMA CREAR JUGADOR
   ============================================================ */
export const crearJugadorSchema = Joi.object({
  usuarioId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'usuarioId es requerido'
    }),

  posicion: Joi.string()
    .max(50)
    .valid(...POSICIONES_VALIDAS)
    .optional()
    .messages({
      'any.only': `posicion debe ser una de: ${POSICIONES_VALIDAS.join(', ')}`
    }),

  // 🆕 POSICIÓN SECUNDARIA (igual que posicion)
  posicionSecundaria: Joi.string()
    .max(50)
    .valid(...POSICIONES_VALIDAS)
    .optional()
    .messages({
      'any.only': `posicionSecundaria debe ser una de: ${POSICIONES_VALIDAS.join(', ')}`
    }),

  piernaHabil: Joi.string()
    .valid('Derecha', 'Izquierda', 'Ambas')
    .optional().allow(null, ''),

  altura: Joi.number()
    .precision(2)
    .min(100)
    .max(250)
    .optional(),

  peso: Joi.number()
    .precision(2)
    .min(30)
    .max(200)
    .optional(),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido', 'lesionado')
    .default('activo')
    .messages({
      'any.only': 'estado debe ser: activo, inactivo, suspendido o lesionado'
    }),

  fechaNacimiento: Joi.date()
    .iso()
    .max('now')
    .optional(),

  anioIngreso: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .optional(),
});

/* ============================================================
   🟡 SCHEMA ACTUALIZAR JUGADOR
   ============================================================ */
export const actualizarJugadorSchema = Joi.object({
  posicion: Joi.string()
    .max(50)
    .valid(...POSICIONES_VALIDAS)
    .optional().allow(null, ''),

  // 🆕 POSICIÓN SECUNDARIA (igual que posicion)
  posicionSecundaria: Joi.string()
    .max(50)
    .valid(...POSICIONES_VALIDAS)
    .optional().allow(null, ''),

  piernaHabil: Joi.string()
    .valid('Derecha', 'Izquierda', 'Ambas')
    .optional().allow(null, ''),

  altura: Joi.number()
    .precision(2)
    .min(100)
    .max(250)
    .optional().allow(null, ''),

  peso: Joi.number()
    .precision(2)
    .min(30)
    .max(200)
    .optional().allow(null, ''),

  imc: Joi.number()
    .precision(2)
    .min(10)
    .max(50)
    .optional().allow(null, ''),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido', 'lesionado')
    .optional().allow(null, ''),

  fechaNacimiento: Joi.date()
    .iso()
    .max('now')
    .optional(),

  anioIngreso: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .optional().allow(null, ''),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar'
  });

/* ============================================================
   🔍 SCHEMA FILTROS DE JUGADORES
   ============================================================ */
export const filtrosJugadoresSchema = Joi.object({
  pagina: Joi.number().integer().min(1).default(1).optional(),

  limite: Joi.number().integer().min(1).max(100).default(10).optional(),

  q: Joi.string().max(100).optional(),

  estado: Joi.string()
    .valid('activo', 'inactivo', 'suspendido', 'lesionado')
    .optional(),

  carreraId: Joi.number().integer().positive().optional(),

  carreraNombre: Joi.string().max(100).optional(),

  anioIngreso: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .optional(),

  grupoId: Joi.number().integer().positive().optional(),

  posicion: Joi.string()
    .valid(...POSICIONES_VALIDAS)
    .optional(),

  // 🆕 FILTRO POSICIÓN SECUNDARIA
  posicionSecundaria: Joi.string()
    .valid(...POSICIONES_VALIDAS)
    .optional().allow(null, ''),

  piernaHabil: Joi.string()
    .valid('Derecha', 'Izquierda', 'Ambas')
    .optional(),
});

// Exportar constantes
export { POSICIONES_VALIDAS };
