import { Router } from 'express';
import estadisticaController from '../controllers/estadisticaController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas
router.get('/partido/:partidoId', estadisticaController.obtenerPorPartido);
router.get('/jugador/:usuarioId/campeonato/:campeonatoId', estadisticaController.obtenerPorJugador);
router.get('/sanciones/:usuarioId/campeonato/:campeonatoId', estadisticaController.obtenerSanciones);
router.get('/suspension/:usuarioId/partido/:partidoId', estadisticaController.verificarSuspension);

// Rutas protegidas (entrenador)
router.post(
  '/',
  authenticateToken,
  requireRole(['entrenador']),
  estadisticaController.registrar
);

router.patch(
  '/:id',
  authenticateToken,
  requireRole(['entrenador']),
  estadisticaController.actualizar
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole(['entrenador']),
  estadisticaController.eliminar
);

router.patch(
  '/sanciones/:sancionId/cumplida',
  authenticateToken,
  requireRole(['entrenador']),
  estadisticaController.marcarSancionCumplida
);

export default router;