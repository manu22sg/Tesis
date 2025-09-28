import { Router } from 'express';
import {
  postCrearSesion,
  getSesiones,
  getSesionPorId,
  patchActualizarSesion,
  deleteSesion,
  postSesionesRecurrentes
} from '../controllers/sesionController.js';

import {
  crearSesionBody,
  obtenerSesionesBody,
  obtenerSesionPorIdBody,
  actualizarSesionBody,
  eliminarSesionBody,
  crearSesionesRecurrentesBody,
  validate
} from '../validations/sesionValidations.js';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * POST /api/sesion
 */
router.post('/',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(crearSesionBody),
  postCrearSesion
);

/**
 * GET /api/sesion
 */
router.get('/',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(obtenerSesionesBody),
  getSesiones
);

/**
 * POST /api/sesion/detalle
 */
router.post('/detalle',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(obtenerSesionPorIdBody),
  getSesionPorId
);

/**
 * PATCH /api/sesiones
 */
router.patch('/',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(actualizarSesionBody),
  patchActualizarSesion
);

/**
 * DELETE /api/sesion/eliminar
 */
router.delete('/eliminar',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(eliminarSesionBody),
  deleteSesion
);

/**
 * POST /api/sesion/recurrente
 */
router.post('/recurrente',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(crearSesionesRecurrentesBody),
  postSesionesRecurrentes
);



export default router;
