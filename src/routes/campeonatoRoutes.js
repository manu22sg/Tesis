import { Router } from 'express';
import campeonatoController from '../controllers/campeonatoController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas (consulta)
router.get('/', campeonatoController.listar);
router.get('/:id', campeonatoController.obtenerPorId);
router.get('/:id/fixture', campeonatoController.obtenerFixture);
router.get('/:id/estadisticas', campeonatoController.obtenerEstadisticas);

// Rutas protegidas (solo entrenador)
router.post(
  '/',
  authenticateToken,
  requireRole(['entrenador']),
  campeonatoController.crear
);

router.patch(
  '/:id',
  authenticateToken,
  requireRole(['entrenador']),
  campeonatoController.actualizar
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole(['entrenador']),
  campeonatoController.eliminar
);

router.post(
  '/:id/fixture',
  authenticateToken,
  requireRole(['entrenador']),
  campeonatoController.generarFixture
);


export default router;