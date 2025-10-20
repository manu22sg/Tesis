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
router.post('/', authenticateToken, requireRole(['superadmin']), postCrearCancha);
router.get('/', authenticateToken, requireRole(['superadmin', 'entrenador']), getCanchas);
router.post('/detalle', authenticateToken, requireRole(['superadmin', 'entrenador']), getCanchaPorId);
router.patch('/', authenticateToken, requireRole(['superadmin']), patchActualizarCancha);
router.delete('/eliminar', authenticateToken, requireRole(['superadmin']), deleteCancha);
router.patch('/reactivar', authenticateToken, requireRole(['superadmin']), patchReactivarCancha);

export default router;
