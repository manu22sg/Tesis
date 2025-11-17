import { Router } from 'express';
import {
  postCrearCancha,
  getCanchas,
  getCanchaPorId,
  patchActualizarCancha,
  deleteCancha,
  patchReactivarCancha,
  exportarCanchasExcel,
  exportarCanchasPDF
} from '../controllers/canchaController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Todas requieren autenticación y rol administrador
router.post('/', authenticateToken, requireRole(['entrenador']), postCrearCancha);
router.get('/', getCanchas);
router.post('/detalle', authenticateToken, requireRole(['superadmin', 'entrenador']), getCanchaPorId);
router.patch('/', authenticateToken, requireRole(['entrenador', 'superadmin']), patchActualizarCancha);
router.delete('/eliminar', authenticateToken, requireRole(['entrenador', 'superadmin']), deleteCancha);
router.patch('/reactivar', authenticateToken, requireRole(['entrenador', 'superadmin']), patchReactivarCancha);
router.get('/excel', authenticateToken, requireRole('entrenador'), exportarCanchasExcel);
router.get('/pdf', authenticateToken, requireRole('entrenador'), exportarCanchasPDF);

export default router;
