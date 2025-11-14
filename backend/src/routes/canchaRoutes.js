import { Router } from 'express';
import {
  postCrearCancha,
  getCanchas,
  getCanchaPorId,
  patchActualizarCancha,
  deleteCancha,
  patchReactivarCancha
} from '../controllers/canchaController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Todas requieren autenticación y rol administrador
router.post('/', authenticateToken, requireRole(['entrenador']), postCrearCancha);
router.get('/', authenticateToken, requireRole(['superadmin', 'entrenador', 'estudiante']), getCanchas);
router.post('/detalle', authenticateToken, requireRole(['superadmin', 'entrenador']), getCanchaPorId);
router.patch('/', authenticateToken, requireRole(['entrenador', 'superadmin']), patchActualizarCancha);
router.delete('/eliminar', authenticateToken, requireRole(['entrenador', 'superadmin']), deleteCancha);
router.patch('/reactivar', authenticateToken, requireRole(['entrenador', 'superadmin']), patchReactivarCancha);

export default router;
