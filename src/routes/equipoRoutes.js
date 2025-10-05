import { Router } from 'express';
import equipoController from '../controllers/equipoController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas
router.get('/campeonato/:campeonatoId', equipoController.listarPorCampeonato);
router.get('/:id', equipoController.obtenerPorId);
router.get('/:id/estadisticas', equipoController.obtenerEstadisticas);

// Rutas protegidas (entrenador)
router.post(
  '/',
  authenticateToken,
  requireRole(['entrenador']),
  equipoController.crear
);

router.post(
  '/:id/participantes',
  authenticateToken,
  requireRole(['entrenador']),
  equipoController.inscribirParticipantes
);

router.patch(
  '/:id/participantes/:usuarioId/numero',
  authenticateToken,
  requireRole(['entrenador']),
  equipoController.asignarNumeroJugador
);

router.delete(
  '/:id/participantes/:usuarioId',
  authenticateToken,
  requireRole(['entrenador']),
  equipoController.removerParticipante
);

router.patch(
  '/:id',
  authenticateToken,
  requireRole(['entrenador']),
  equipoController.actualizar
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole(['entrenador']),
  equipoController.eliminar
);

export default router;