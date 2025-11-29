import Joi from 'joi';
import { AppDataSource } from '../config/config.db.js';
import JugadorSchema from '../entity/Jugador.js';

// Validación básica del body
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
  
  // Estadísticas Ofensivas
  goles: Joi.number().integer().min(0).max(15).default(0)
    .messages({
      'number.base': 'goles debe ser un número',
      'number.integer': 'goles debe ser un número entero',
      'number.min': 'goles no puede ser negativo',
      'number.max': 'goles no puede superar los 15 por sesión'
    }),
  
  asistencias: Joi.number().integer().min(0).max(15).default(0)
    .messages({
      'number.base': 'asistencias debe ser un número',
      'number.integer': 'asistencias debe ser un número entero',
      'number.min': 'asistencias no puede ser negativo',
      'number.max': 'asistencias no puede superar las 15 por sesión'
    }),
  
  tirosAlArco: Joi.number().integer().min(0).max(50).default(0)
    .messages({
      'number.base': 'tirosAlArco debe ser un número',
      'number.integer': 'tirosAlArco debe ser un número entero',
      'number.min': 'tirosAlArco no puede ser negativo',
      'number.max': 'tirosAlArco no puede superar los 50 por sesión'
    }),
  
  tirosTotales: Joi.number().integer().min(0).max(100).default(0)
    .messages({
      'number.base': 'tirosTotales debe ser un número',
      'number.integer': 'tirosTotales debe ser un número entero',
      'number.min': 'tirosTotales no puede ser negativo',
      'number.max': 'tirosTotales no puede superar los 100 por sesión'
    }),
  
  regatesExitosos: Joi.number().integer().min(0).max(50).default(0)
    .messages({
      'number.base': 'regatesExitosos debe ser un número',
      'number.integer': 'regatesExitosos debe ser un número entero',
      'number.min': 'regatesExitosos no puede ser negativo',
      'number.max': 'regatesExitosos no puede superar los 50 por sesión'
    }),
  
  regatesIntentados: Joi.number().integer().min(0).max(100).default(0)
    .messages({
      'number.base': 'regatesIntentados debe ser un número',
      'number.integer': 'regatesIntentados debe ser un número entero',
      'number.min': 'regatesIntentados no puede ser negativo',
      'number.max': 'regatesIntentados no puede superar los 100 por sesión'
    }),
  
  pasesCompletados: Joi.number().integer().min(0).max(200).default(0)
    .messages({
      'number.base': 'pasesCompletados debe ser un número',
      'number.integer': 'pasesCompletados debe ser un número entero',
      'number.min': 'pasesCompletados no puede ser negativo',
      'number.max': 'pasesCompletados no puede superar los 200 por sesión'
    }),
  
  pasesIntentados: Joi.number().integer().min(0).max(250).default(0)
    .messages({
      'number.base': 'pasesIntentados debe ser un número',
      'number.integer': 'pasesIntentados debe ser un número entero',
      'number.min': 'pasesIntentados no puede ser negativo',
      'number.max': 'pasesIntentados no puede superar los 250 por sesión'
    }),
  
  // Estadísticas Defensivas
  intercepciones: Joi.number().integer().min(0).max(50).default(0)
    .messages({
      'number.base': 'intercepciones debe ser un número',
      'number.integer': 'intercepciones debe ser un número entero',
      'number.min': 'intercepciones no puede ser negativo',
      'number.max': 'intercepciones no puede superar las 50 por sesión'
    }),
  
  recuperaciones: Joi.number().integer().min(0).max(50).default(0)
    .messages({
      'number.base': 'recuperaciones debe ser un número',
      'number.integer': 'recuperaciones debe ser un número entero',
      'number.min': 'recuperaciones no puede ser negativo',
      'number.max': 'recuperaciones no puede superar las 50 por sesión'
    }),
  
  duelosGanados: Joi.number().integer().min(0).max(50).default(0)
    .messages({
      'number.base': 'duelosGanados debe ser un número',
      'number.integer': 'duelosGanados debe ser un número entero',
      'number.min': 'duelosGanados no puede ser negativo',
      'number.max': 'duelosGanados no puede superar los 50 por sesión'
    }),
  
  duelosTotales: Joi.number().integer().min(0).max(100).default(0)
    .messages({
      'number.base': 'duelosTotales debe ser un número',
      'number.integer': 'duelosTotales debe ser un número entero',
      'number.min': 'duelosTotales no puede ser negativo',
      'number.max': 'duelosTotales no puede superar los 100 por sesión'
    }),
  
  despejes: Joi.number().integer().min(0).max(50).default(0)
    .messages({
      'number.base': 'despejes debe ser un número',
      'number.integer': 'despejes debe ser un número entero',
      'number.min': 'despejes no puede ser negativo',
      'number.max': 'despejes no puede superar los 50 por sesión'
    }),
  
  // Estadísticas de Portero
  atajadas: Joi.number().integer().min(0).max(30).default(0)
    .messages({
      'number.base': 'atajadas debe ser un número',
      'number.integer': 'atajadas debe ser un número entero',
      'number.min': 'atajadas no puede ser negativo',
      'number.max': 'atajadas no puede superar las 30 por sesión'
    }),
  
  golesRecibidos: Joi.number().integer().min(0).max(20).default(0)
    .messages({
      'number.base': 'golesRecibidos debe ser un número',
      'number.integer': 'golesRecibidos debe ser un número entero',
      'number.min': 'golesRecibidos no puede ser negativo',
      'number.max': 'golesRecibidos no puede superar los 20 por sesión'
    }),
  
  arcosInvictos: Joi.number().integer().min(0).max(1).default(0)
    .messages({
      'number.base': 'arcosInvictos debe ser un número',
      'number.integer': 'arcosInvictos debe ser un número entero',
      'number.min': 'arcosInvictos no puede ser negativo',
      'number.max': 'arcosInvictos solo puede ser 0 o 1 por sesión'
    }),
  
  // Disciplina
  tarjetasAmarillas: Joi.number().integer().min(0).max(2).default(0)
    .messages({
      'number.base': 'tarjetasAmarillas debe ser un número',
      'number.integer': 'tarjetasAmarillas debe ser un número entero',
      'number.min': 'tarjetasAmarillas no puede ser negativo',
      'number.max': 'tarjetasAmarillas no puede superar las 2 por sesión'
    }),
  
  tarjetasRojas: Joi.number().integer().min(0).max(1).default(0)
    .messages({
      'number.base': 'tarjetasRojas debe ser un número',
      'number.integer': 'tarjetasRojas debe ser un número entero',
      'number.min': 'tarjetasRojas no puede ser negativo',
      'number.max': 'tarjetasRojas no puede superar 1 por sesión'
    }),
  
  // Tiempo de juego
  minutosJugados: Joi.number().integer().min(0).max(120).default(0)
    .messages({
      'number.base': 'minutosJugados debe ser un número',
      'number.integer': 'minutosJugados debe ser un número entero',
      'number.min': 'minutosJugados no puede ser negativo',
      'number.max': 'minutosJugados no puede superar los 120 minutos por sesión'
    })
});

// Middleware de validación adicional (para validaciones de negocio complejas)
export async function validarEstadisticasNegocio(req, res, next) {
  try {
    const {
      jugadorId,
      arcosInvictos,
      atajadas,
      golesRecibidos,
      tirosAlArco,
      tirosTotales,
      regatesExitosos,
      regatesIntentados,
      duelosGanados,
      duelosTotales,
      pasesCompletados,
      pasesIntentados
    } = req.body;

    // 1. Validar que solo porteros tengan estadísticas de arquero
    if (arcosInvictos > 0 || atajadas > 0 || golesRecibidos > 0) {
      const jugadorRepo = AppDataSource.getRepository(JugadorSchema);
      const jugador = await jugadorRepo.findOne({
        where: { id: jugadorId }
      });

      if (!jugador) {
        return res.status(404).json({
          success: false,
          message: 'Jugador no encontrado'
        });
      }

      const esPortero = 
        jugador.posicion?.toLowerCase().includes('portero') ||
        jugador.posicion?.toLowerCase().includes('arquero') ||
        jugador.posicionSecundaria?.toLowerCase().includes('portero') ||
        jugador.posicionSecundaria?.toLowerCase().includes('arquero');

      if (!esPortero) {
        return res.status(400).json({
          success: false,
          message: 'Solo los porteros pueden tener estadísticas de arquero (arcosInvictos, atajadas, golesRecibidos)'
        });
      }
    }

    // 2. Validar tiros al arco <= tiros totales
    if (tirosAlArco > tirosTotales) {
      return res.status(400).json({
        success: false,
        message: 'Los tiros al arco no pueden superar los tiros totales'
      });
    }

    // 3. Validar regates exitosos <= regates intentados
    if (regatesExitosos > regatesIntentados) {
      return res.status(400).json({
        success: false,
        message: 'Los regates exitosos no pueden superar los regates intentados'
      });
    }

    // 4. Validar duelos ganados <= duelos totales
    if (duelosGanados > duelosTotales) {
      return res.status(400).json({
        success: false,
        message: 'Los duelos ganados no pueden superar los duelos totales'
      });
    }

    // 5. Validar pases completados <= pases intentados
    if (pasesCompletados > pasesIntentados) {
      return res.status(400).json({
        success: false,
        message: 'Los pases completados no pueden superar los pases intentados'
      });
    }

    next();
  } catch (error) {
    console.error('Error en validación de negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al validar estadísticas'
    });
  }
}

// Query params para exportación
export const exportarEstadisticasQuery = Joi.object({
  tipo: Joi.string().valid('jugador', 'sesion').required()
    .messages({
      'string.base': 'tipo debe ser texto',
      'any.only': 'tipo debe ser "jugador" o "sesion"',
      'any.required': 'tipo es requerido'
    }),
  
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'id debe ser un número',
      'number.integer': 'id debe ser un número entero',
      'number.positive': 'id debe ser positivo',
      'any.required': 'id es requerido'
    })
});

// Query params para paginación
export const paginacionQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'page debe ser un número',
      'number.integer': 'page debe ser un número entero',
      'number.min': 'page debe ser al menos 1'
    }),
  
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages({
      'number.base': 'limit debe ser un número',
      'number.integer': 'limit debe ser un número entero',
      'number.min': 'limit debe ser al menos 1',
      'number.max': 'limit no puede superar 100'
    })
});