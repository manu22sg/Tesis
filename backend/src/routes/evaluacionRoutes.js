import { Router } from 'express';
import { authenticateToken, requireRole, attachJugadorId } from '../middleware/authMiddleware.js';
import { 
  validarBody, 
  validarParams, 
  validarQuery,
  idParamSchema,
  jugadorIdParamSchema,
  paginacionEvaluacionesSchema,
  exportarEvaluacionesQuerySchema
} from '../validations/commonValidations.js';
import { 
  crearEvaluacionBody, 
  actualizarEvaluacionBody 
} from '../validations/evaluacionValidations.js';
import { 
  getMisEvaluaciones, 
  postCrearEvaluacion, 
  getEvaluaciones, 
  getEvaluacionPorId, 
  patchEvaluacion, 
  deleteEvaluacion,
  getEvaluacionesPorJugador,
  exportarEvaluacionesExcel,    
  exportarEvaluacionesPDF 
} from '../controllers/evaluacionController.js';

const router = Router();

router.get('/excel', 
  authenticateToken, 
  requireRole(['entrenador']),
  validarQuery(exportarEvaluacionesQuerySchema), 
  exportarEvaluacionesExcel
);

router.get('/pdf', 
  authenticateToken, 
  requireRole(['entrenador']),
  validarQuery(exportarEvaluacionesQuerySchema), 
  exportarEvaluacionesPDF
);

// Ruta para estudiantes
router.get(
  '/mias',
  authenticateToken,
  requireRole(['estudiante']),
  attachJugadorId, 
  validarQuery(paginacionEvaluacionesSchema), 
  getMisEvaluaciones
);

router.post(
  '/', 
  authenticateToken, 
  requireRole(['entrenador']), 
  validarBody(crearEvaluacionBody), 
  postCrearEvaluacion
);

router.get(
  '/', 
  authenticateToken, 
  requireRole(['entrenador']), 
  validarQuery(paginacionEvaluacionesSchema), 
  getEvaluaciones
);

// Listar por jugador
router.get(
  '/jugador/:jugadorId',
  authenticateToken,
  requireRole(['entrenador']),
  validarParams(jugadorIdParamSchema),
  validarQuery(paginacionEvaluacionesSchema),
  getEvaluacionesPorJugador
);

router.get(
  '/:id', 
  authenticateToken, 
  requireRole(['entrenador']), 
  validarParams(idParamSchema), 
  getEvaluacionPorId
);

router.patch(
  '/:id', 
  authenticateToken, 
  requireRole(['entrenador']), 
  validarParams(idParamSchema),
  validarBody(actualizarEvaluacionBody), 
  patchEvaluacion
);

router.delete(
  '/:id', 
  authenticateToken, 
  requireRole(['entrenador']), 
  validarParams(idParamSchema), 
  deleteEvaluacion
);

export default router;