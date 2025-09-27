import { Router } from 'express';
import {
  postCrearCancha,
  getCanchas,
  getCanchaPorId,
  putActualizarCancha,
  deleteCancha,
  patchReactivarCancha
} from '../controllers/canchaController.js';

import {
  crearCanchaBody,
  actualizarCanchaBody,
  validate
} from '../validations/canchaValidations.js';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas para la gestión de canchas
// Obtener todas las canchas con paginación y filtros
router.get('/',
   authenticateToken,
  getCanchas
);

// Obtener detalles de una cancha por ID
router.get('/detalle',
   authenticateToken,
  getCanchaPorId
);

// Crear una nueva cancha (solo para entrenadores y superadmin)
router.post('/',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
  validate(crearCanchaBody),
  postCrearCancha
);

// Actualizar una cancha existente (solo para entrenadores y superadmin)
router.patch('/',
  authenticateToken,
   requireRole(['entrenador', 'superadmin']),
  validate(actualizarCanchaBody),
  putActualizarCancha
);

// desactivar una cancha (solo para entrenadores y superadmin)
router.delete('/eliminar',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
 
  deleteCancha
);

// reactivar una cancha (solo para entrenadores y superadmin)
router.patch('/reactivar',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
 
  patchReactivarCancha
);

export default router;