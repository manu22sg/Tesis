import { Router } from 'express';
import {
  patchAprobarReserva,
  patchRechazarReserva,
  getReservasPendientes,
  patchCambiarEstadoReserva,
  getEstadisticasReservas
} from '../controllers/aprobacionController.js';

import {
  aprobarReservaBody,
  rechazarReservaBody,
  obtenerReservasPendientesBody,
  cambiarEstadoReservaBody,
  obtenerEstadisticasBody,
  validate
} from '../validations/aprobacionValidations.js';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * GET /api/reservas/pendientes
 * Obtener reservas pendientes de aprobación
 * Acceso: Solo entrenador y superadmin
 * Body: {
 *   "fecha": "2025-09-24",  // opcional
 *   "canchaId": 1,          // opcional
 *   "page": 1,              // opcional
 *   "limit": 10             // opcional
 * }
 */
router.get('/pendientes',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
  //validate(obtenerReservasPendientesBody),
  getReservasPendientes
);

/**
 * PATCH /api/reservas/aprobar
 * Aprobar una reserva específica
 * Acceso: Solo entrenador y superadmin
 * Body: {
 *   "id": 123,
 *   "observacion": "Reserva aprobada - horario disponible"  // opcional
 * }
 */
router.patch('/aprobar',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
  validate(aprobarReservaBody),
  patchAprobarReserva
);

/**
 * PATCH /api/reservas/rechazar
 * Rechazar una reserva específica
 * Acceso: Solo entrenador y superadmin
 * Body: {
 *   "id": 123,
 *   "motivoRechazo": "Conflicto con entrenamiento programado"
 * }
 */
router.patch('/rechazar',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
  validate(rechazarReservaBody),
  patchRechazarReserva
);

/**
 * PATCH /api/reservas/cambiar-estado
 * Cambiar estado de reserva (función genérica para casos especiales)
 * Acceso: Solo entrenador y superadmin
 * Body: {
 *   "id": 123,
 *   "nuevoEstado": "completada",
 *   "observacion": "Partido realizado exitosamente"  // opcional
 * }
 */
/** 
router.patch('/cambiar-estado',
  // authenticateToken,
  // requireRole(['entrenador', 'superadmin']),
  validate(cambiarEstadoReservaBody),
  patchCambiarEstadoReserva
);
*/

/**
 * POST /api/reservas/estadisticas
 * Obtener estadísticas de reservas para dashboard
 * Acceso: Solo entrenador y superadmin
 * Body: {} (sin parámetros requeridos)
 */
router.post('/estadisticas',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
  validate(obtenerEstadisticasBody),
  getEstadisticasReservas
);

export default router;