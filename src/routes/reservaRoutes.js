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
  obtenerReservasUsuarioBody,
  obtenerTodasReservasBody,
  obtenerReservaPorIdBody,
  validate
} from '../validations/reservaValidations.js';

 import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * POST /api/reservas
 * Crear una nueva reserva
 * Acceso: Usuarios autenticados (estudiantes y académicos)
 * Body: {
 *   "canchaId": 1,
 *   "fecha": "2025-09-24",
 *   "horaInicio": "09:00",
 *   "horaFin": "10:30",
 *   "motivo": "Partido amistoso",
 *   "participantes": ["20.111.111-1", "20.222.222-2", ...]  // 11 RUT adicionales
 * }
 */
router.post('/',
   authenticateToken,
   requireRole(['estudiante', 'academico']),
  validate(crearReservaBody),
  postCrearReserva
);

/**
 * GET /api/reservas
 * Obtener reservas del usuario autenticado con filtros y paginación
 * Acceso: Usuario autenticado
 * Body: {
 *   "estado": "pendiente",  // opcional
 *   "page": 1,             // opcional
 *   "limit": 10            // opcional
 * }
 */
router.get('/',
  // authenticateToken,
  validate(obtenerReservasUsuarioBody),
  getReservasUsuario
);

/**
 * GET /api/reservas/todas
 * Obtener todas las reservas del sistema (para entrenadores)
 * Acceso: Solo entrenador y superadmin
 * Body: {
 *   "estado": "pendiente",   // opcional
 *   "fecha": "2025-09-24",   // opcional  
 *   "canchaId": 1,           // opcional
 *   "page": 1,               // opcional
 *   "limit": 10              // opcional
 * }
 */
router.get('/todas',
  // authenticateToken,
  // requireRole(['entrenador', 'superadmin']),
  validate(obtenerTodasReservasBody),
  getTodasLasReservas
);

/**
 * POST /api/reservas/detalle
 * Obtener una reserva específica por ID
 * Acceso: Usuario autenticado
 * Body: { "id": 123 }
 */
router.post('/detalle',
  // authenticateToken,
  validate(obtenerReservaPorIdBody),
  getReservaPorId
);

export default router;