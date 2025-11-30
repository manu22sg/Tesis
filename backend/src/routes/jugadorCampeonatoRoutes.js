import { Router } from 'express';
import {
  buscarJugadoresController,
  obtenerPerfilController,
  obtenerEstadisticasDetalladasController,
  exportarPerfilExcelController,
  exportarPerfilPDFController
} from '../controllers/jugadorCampeonatoController.js';

import {
  buscarJugadoresQuerySchema,
  usuarioIdParamsSchema,
  estadisticasParamsSchema
} from '../validations/jugadorCampeonatoValidations.js';

import {
  validarQuery,
  validarParams
} from '../validations/commonValidations.js';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Reglas globales
router.use(authenticateToken);
router.use(requireRole(['entrenador', 'admin']));

/**
 * GET /api/ojeador
 */
router.get(
  '/',
  validarQuery(buscarJugadoresQuerySchema),
  buscarJugadoresController
);

/**
 * GET /api/ojeador/:usuarioId
 */
router.get(
  '/:usuarioId',
  validarParams(usuarioIdParamsSchema),
  obtenerPerfilController
);

/**
 * GET /api/ojeador/:usuarioId/campeonato/:campeonatoId
 */
router.get(
  '/:usuarioId/campeonato/:campeonatoId',
  validarParams(estadisticasParamsSchema),
  obtenerEstadisticasDetalladasController
);


router.get('/:usuarioId/exportar/excel', exportarPerfilExcelController);

// 🆕 Exportar perfil a PDF
router.get('/:usuarioId/exportar/pdf', exportarPerfilPDFController);

export default router;
