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
router.get('/',authenticateToken, getCanchas);
router.post('/detalle', authenticateToken, requireRole(['superadmin', 'entrenador']), getCanchaPorId);
router.patch('/', authenticateToken, requireRole(['entrenador']), patchActualizarCancha);
router.delete('/eliminar', authenticateToken, requireRole(['entrenador']), deleteCancha);
router.patch('/reactivar', authenticateToken, requireRole(['entrenador']), patchReactivarCancha);
router.get('/excel', authenticateToken, requireRole('entrenador'), exportarCanchasExcel);
router.get('/pdf', authenticateToken, requireRole('entrenador'), exportarCanchasPDF);

export default router;
