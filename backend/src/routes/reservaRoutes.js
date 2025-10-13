// routes/reservaRoutes.js
import { Router } from 'express';
import {
  postCrearReserva,
  getReservasUsuario,
  getTodasLasReservas,
  getReservaPorId
} from '../controllers/reservaController.js';

import {
  crearReservaBody,
  obtenerReservasUsuarioQuery,   
  obtenerTodasReservasQuery,    
  obtenerReservaPorIdBody,
  validate,
  validateQuery                 
} from '../validations/reservaValidations.js';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/',
  authenticateToken,
  requireRole(['estudiante', 'academico']),
  validate(crearReservaBody),
  postCrearReserva
);

// GET /api/reservas
router.get('/',
  authenticateToken,
  validateQuery(obtenerReservasUsuarioQuery),
  getReservasUsuario
);

// GET /api/reservas/
router.get('/todas',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validateQuery(obtenerTodasReservasQuery),
  getTodasLasReservas
);

router.post('/detalle',
  authenticateToken,
  validate(obtenerReservaPorIdBody),
  getReservaPorId
);

export default router;
