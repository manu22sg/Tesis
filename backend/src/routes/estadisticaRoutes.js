import { Router } from 'express';
import { authenticateToken, requireRole, attachJugadorId } from '../middleware/authMiddleware.js';
import { validarBody, validarParams, validarQuery } from '../validations/commonValidations.js';
import {
  upsertEstadisticaBody,
  idParamSchema,
  paginarQuery,
  listarPorJugadorParams,
  listarPorSesionParams
} from '../validations/estadisticaValidations.js';
import {
  postUpsertEstadistica,
  getEstadisticasPorJugador,
  getEstadisticasPorSesion,
  getEstadisticaPorId,
  deleteEstadistica,
  getMisEstadisticas,
  exportarEstadisticasExcel,    
  exportarEstadisticasPDF        

} from '../controllers/estadisticaController.js';

const router = Router();

// Crear/actualizar— entrenador/superadmin
router.post(
  '/',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarBody(upsertEstadisticaBody),
  postUpsertEstadistica
);
router.get('/excel', 
  authenticateToken, 
  requireRole(['entrenador', 'superadmin']), 
  exportarEstadisticasExcel
);

router.get('/pdf', 
  authenticateToken, 
  requireRole(['entrenador', 'superadmin']), 
  exportarEstadisticasPDF
);

// Listar por jugador — entrenador/superadmin pueden ver cualquiera
router.get(
  '/jugador/:jugadorId',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarParams(listarPorJugadorParams),
  validarQuery(paginarQuery),
  getEstadisticasPorJugador
);

//  estudiante ve solo las suyas (para eso attachJugadorId) 
router.get(
  '/mias',
  authenticateToken,
  requireRole(['estudiante']),
  attachJugadorId,
  validarQuery(paginarQuery),
  getMisEstadisticas
);

// Listar por sesión — entrenador/superadmin
router.get(
  '/sesion/:sesionId',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarParams(listarPorSesionParams),
  validarQuery(paginarQuery),
  getEstadisticasPorSesion
);

// Detalle por id — entrenador/superadmin 
router.get(
  '/:id',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarParams(idParamSchema),
  getEstadisticaPorId
);

// Eliminar — entrenador/superadmin 
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarParams(idParamSchema),
  deleteEstadistica
);

export default router;
