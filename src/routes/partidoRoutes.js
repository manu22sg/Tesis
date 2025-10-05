import { Router } from 'express';
import partidoController from '../controllers/partidoController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas
router.get('/:id', partidoController.obtenerPorId);
router.get('/campeonato/:campeonatoId', partidoController.listarPorCampeonato);

// Rutas protegidas (entrenador)
router.patch(
  '/:id/fecha',
  authenticateToken,
  requireRole(['entrenador']),
  partidoController.asignarFechaYCancha
);

router.patch(
  '/:id/resultado',
  authenticateToken,
  requireRole(['entrenador']),
  partidoController.registrarResultado
);

router.patch(
  '/:id',
  authenticateToken,
  requireRole(['entrenador']),
  partidoController.actualizar
);

export default router;