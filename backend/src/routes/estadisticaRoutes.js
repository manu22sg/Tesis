import { Router } from 'express';
import { authenticateToken, requireRole, attachJugadorId } from '../middleware/authMiddleware.js';
import { 
  validarBody, 
  validarParams, 
  validarQuery,
  idParamSchema,
  jugadorIdParamSchema,
  sesionIdParamSchema,
  paginacionBaseSchema,
  exportarEstadisticasQuerySchema
} from '../validations/commonValidations.js';
import { upsertEstadisticaBody } from '../validations/estadisticaValidations.js';
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

router.get('/excel', 
  authenticateToken, 
  requireRole(['entrenador', 'superadmin']),
  validarQuery(exportarEstadisticasQuerySchema), 
  exportarEstadisticasExcel
);

router.get('/pdf', 
  authenticateToken, 
  requireRole(['entrenador', 'superadmin']),
  validarQuery(exportarEstadisticasQuerySchema), 
  exportarEstadisticasPDF
);

// Ruta para estudiantes (mis estadísticas)
router.get(
  '/mias',
  authenticateToken,
  requireRole(['estudiante']),
  attachJugadorId,
  validarQuery(paginacionBaseSchema), // ✅ Usa base
  getMisEstadisticas
);

// Crear/actualizar
router.post(
  '/',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarBody(upsertEstadisticaBody),
  postUpsertEstadistica
);

// Listar por jugador
router.get(
  '/jugador/:jugadorId',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarParams(jugadorIdParamSchema),
  validarQuery(paginacionBaseSchema), // ✅ Usa base
  getEstadisticasPorJugador
);

// Listar por sesión
router.get(
  '/sesion/:sesionId',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarParams(sesionIdParamSchema),
  validarQuery(paginacionBaseSchema), // ✅ Usa base
  getEstadisticasPorSesion
);

// ✅ Rutas con parámetros dinámicos AL FINAL
router.get(
  '/:id',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarParams(idParamSchema),
  getEstadisticaPorId
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarParams(idParamSchema),
  deleteEstadistica
);

export default router;