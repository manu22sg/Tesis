import { Router } from 'express';
import {
  postCrearReserva,
  getTodasLasReservas,
  getReservaPorId,
  putCancelarReserva,
  editarParticipantesReservaPorId,
  getReservasUsuario
} from '../controllers/reservaController.js';

import {
  crearReservaBody,
  obtenerTodasReservasQuery,
  obtenerReservasUsuarioQuery,    // ✅ FALTABA
  obtenerReservaPorIdBody,
  editarParticipantesBody,         // ✅ NUEVA
  validate,
  validateQuery
} from '../validations/reservaValidations.js';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/reservas - Crear nueva reserva
router.post('/',
  authenticateToken,
  requireRole(['estudiante', 'academico']),
  validate(crearReservaBody),
  postCrearReserva
);

// GET /api/reservas - Obtener reservas del usuario autenticado (mis reservas)
router.get('/',
  authenticateToken,
  validateQuery(obtenerReservasUsuarioQuery),
  getReservasUsuario
);

// GET /api/reservas/todas - Obtener todas las reservas (entrenadores)
router.get('/todas',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validateQuery(obtenerTodasReservasQuery),
  getTodasLasReservas
);

// POST /api/reservas/detalle - Obtener detalle de una reserva
router.post('/detalle',
  authenticateToken,
  validate(obtenerReservaPorIdBody),
  getReservaPorId
);

// PUT /api/reservas/:id/cancelar - Cancelar reserva
router.put('/:id/cancelar',
  authenticateToken,
  requireRole(['estudiante', 'academico']),
  putCancelarReserva
);

// PUT /api/reservas/:id/participantes - Editar participantes de una reserva
router.put('/:id/participantes',
  authenticateToken,
  requireRole(['estudiante', 'academico']),
  validate(editarParticipantesBody),
  editarParticipantesReservaPorId
);

export default router;