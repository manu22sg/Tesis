import { Router } from 'express';
import { authenticateToken, requireRole,attachJugadorId } from '../middleware/authMiddleware.js';
import { validarBody, validarQuery, validarParams, crearEvaluacionBody, actualizarEvaluacionBody, obtenerEvaluacionesQuery, idParamSchema,} from '../validations/evaluacionValidations.js';
import { getMisEvaluaciones, postCrearEvaluacion, getEvaluaciones, getEvaluacionPorId, patchEvaluacion, deleteEvaluacion,getEvaluacionesPorJugador } from '../controllers/evaluacionController.js';

const router = Router();

// Entrenador/superadmin crean y modifican
router.post('/', authenticateToken, requireRole(['entrenador','superadmin']), validarBody(crearEvaluacionBody), postCrearEvaluacion);
router.patch('/:id', authenticateToken, requireRole(['entrenador','superadmin']), validarParams(idParamSchema),
validarBody(actualizarEvaluacionBody), patchEvaluacion);
router.delete('/:id', authenticateToken, requireRole(['entrenador','superadmin']), validarParams(idParamSchema), deleteEvaluacion);

router.get(
  '/mias',
  authenticateToken,
  requireRole('estudiante'),
  attachJugadorId, 
  validarQuery(obtenerEvaluacionesQuery),
  getMisEvaluaciones
);

// Listar / Detalle: entrenador/superadmin
router.get('/', authenticateToken, requireRole(['entrenador','superadmin']), validarQuery(obtenerEvaluacionesQuery), getEvaluaciones);
router.get('/:id', authenticateToken, requireRole(['entrenador','superadmin']), validarParams(idParamSchema), getEvaluacionPorId);

// Listar por jugador — entrenador/superadmin pueden ver de cualquier jugador 
router.get(
  '/jugador/:id',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validarParams(idParamSchema),
  validarQuery(obtenerEvaluacionesQuery),
  getEvaluacionesPorJugador
);


export default router;
