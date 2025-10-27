import { Router } from 'express';
import {
  crearEntrenamientoController,
  obtenerEntrenamientosController,
  obtenerEntrenamientoPorIdController,
  actualizarEntrenamientoController,
  eliminarEntrenamientoController,
  obtenerEntrenamientosPorSesionController,
  reordenarEntrenamientosController,
  duplicarEntrenamientoController,
  obtenerEstadisticasController,
  asignarEntrenamientosController
} from '../controllers/entrenamientoSesionController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  crearEntrenamientoBody,
  obtenerEntrenamientosQuery,
  obtenerEntrenamientoPorIdParams,
  actualizarEntrenamientoBody,
  eliminarEntrenamientoParams,
  obtenerEntrenamientosPorSesionParams,
  reordenarEntrenamientosBody,
  duplicarEntrenamientoBody,
  obtenerEstadisticasQuery,
  asignarEntrenamientosBody,
 
  validate,
  validateQuery,
  validateParams,
} from '../validations/entrenamientoSesionValidations.js';

const router = Router();



router.get(
  '/estadisticas',
  authenticateToken,
  validateQuery(obtenerEstadisticasQuery),
  obtenerEstadisticasController
);

router.post(
  '/reordenar',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(reordenarEntrenamientosBody),
  reordenarEntrenamientosController
);


router.get(
  '/sesion/:sesionId',
  authenticateToken,
  validateParams(obtenerEntrenamientosPorSesionParams),
  obtenerEntrenamientosPorSesionController
);


router.post(
  '/',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(crearEntrenamientoBody),
  crearEntrenamientoController
);


router.post(
  '/:id/duplicar',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validateParams(obtenerEntrenamientoPorIdParams),
  validate(duplicarEntrenamientoBody),
  duplicarEntrenamientoController
);


router.patch(
  '/:id',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validateParams(obtenerEntrenamientoPorIdParams),
  validate(actualizarEntrenamientoBody),
  actualizarEntrenamientoController
);


router.delete(
  '/:id',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validateParams(eliminarEntrenamientoParams),
  eliminarEntrenamientoController
);


router.get(
  '/',
  authenticateToken,
  validateQuery(obtenerEntrenamientosQuery),
  obtenerEntrenamientosController
);


router.get(
  '/:id',
  authenticateToken,
  validateParams(obtenerEntrenamientoPorIdParams),
  obtenerEntrenamientoPorIdController
);

router.patch(
  '/:sesionId/asignar',
  authenticateToken,
  requireRole('entrenador'),
  validate(asignarEntrenamientosBody),
  asignarEntrenamientosController
);

export default router;