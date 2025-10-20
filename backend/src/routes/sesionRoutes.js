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
  obtenerSesionesQuery,        // ✅ Query
  obtenerSesionPorIdBody,
  actualizarSesionBody,
  eliminarSesionBody,
  crearSesionesRecurrentesBody,
  validate,
  validateQuery                 // ✅ Importar
} from '../validations/sesionValidations.js';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(crearSesionBody),
  postCrearSesion
);

// ✅ GET usa validateQuery
router.get('/',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validateQuery(obtenerSesionesQuery),  
  getSesiones
);

router.post('/detalle',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(obtenerSesionPorIdBody),
  getSesionPorId
);

router.patch('/',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(actualizarSesionBody),
  patchActualizarSesion
);

router.delete('/eliminar',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(eliminarSesionBody),
  deleteSesion
);

router.post('/recurrente',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(crearSesionesRecurrentesBody),
  postSesionesRecurrentes
);

export default router;