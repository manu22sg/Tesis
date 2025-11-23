import { Router } from 'express';
import {
  buscarJugadoresController,
  obtenerPerfilController,
  obtenerEstadisticasDetalladasController
} from '../controllers/jugadorCampeonatoController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación (entrenadores o admins)
router.use(authenticateToken);
router.use(requireRole(['entrenador', 'admin']));

/**
 * GET /api/ojeador
 * Buscar jugadores con filtros y paginación
 * Query params: q, carreraId, anio, pagina, limite
 */
router.get('/', buscarJugadoresController);

/**
 * GET /api/ojeador/:usuarioId
 * Obtener perfil completo de un jugador
 */
router.get('/:usuarioId', obtenerPerfilController);

/**
 * GET /api/ojeador/:usuarioId/campeonato/:campeonatoId
 * Obtener estadísticas detalladas partido por partido
 */
router.get(
  '/:usuarioId/campeonato/:campeonatoId',
  obtenerEstadisticasDetalladasController
);

export default router;