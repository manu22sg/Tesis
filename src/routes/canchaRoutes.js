// routes/canchaRoutes.js
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


router.get('/',
  // authenticateToken,
 
  getCanchas
);


router.get('/detalle',
  // authenticateToken,
  getCanchaPorId
);


router.post('/',
  // authenticateToken,
  // requireRole(['entrenador', 'superadmin']),
  validate(crearCanchaBody),
  postCrearCancha
);


router.patch('/',
  // authenticateToken,
  // requireRole(['entrenador', 'superadmin']),
  validate(actualizarCanchaBody),
  putActualizarCancha
);


router.delete('/eliminar',
  // authenticateToken,
  // requireRole(['entrenador', 'superadmin']),
 
  deleteCancha
);


router.patch('/reactivar',
  // authenticateToken,
  // requireRole(['entrenador', 'superadmin']),
 
  patchReactivarCancha
);

export default router;