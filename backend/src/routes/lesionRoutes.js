import { Router } from 'express';
import { authenticateToken, requireRole, attachJugadorId } from '../middleware/authMiddleware.js';
import { 
  validarBody, 
  validarParams, 
  validarQuery,
  idParamSchema,
  paginacionLesionesSchema,
  exportarLesionesQuerySchema
} from '../validations/commonValidations.js';
import { 
  crearLesionBody, 
  actualizarLesionBody 
} from '../validations/lesionValidations.js';
import { 
  postCrearLesion, 
  getLesiones, 
  getLesionPorId, 
  patchLesion, 
  deleteLesion, 
  exportarLesionesExcel,
  exportarLesionesPDF 
} from '../controllers/lesionController.js';

const router = Router();

// ✅ Rutas específicas PRIMERO
router.get('/excel', 
  authenticateToken, 
  requireRole(['entrenador', 'superadmin']),
  validarQuery(exportarLesionesQuerySchema), // ✅ Validación
  exportarLesionesExcel
);

router.get('/pdf', 
  authenticateToken, 
  requireRole(['entrenador', 'superadmin']),
  validarQuery(exportarLesionesQuerySchema), // ✅ Validación
  exportarLesionesPDF
);

// Ruta para estudiantes
router.get('/mias', 
  authenticateToken, 
  requireRole(['estudiante']), 
  attachJugadorId,
  validarQuery(paginacionLesionesSchema), // ✅ Usa schema con filtros
  getLesiones
);

// Lesiones de un jugador específico (para entrenadores)


// CRUD básico
router.post('/', 
  authenticateToken, 
  requireRole(['entrenador','superadmin']), 
  validarBody(crearLesionBody), 
  postCrearLesion
);

router.get('/', 
  authenticateToken, 
  requireRole(['entrenador','superadmin']), 
  validarQuery(paginacionLesionesSchema), // ✅ Usa schema con filtros
  getLesiones
);

// ✅ Rutas con parámetros dinámicos AL FINAL
router.get('/:id', 
  authenticateToken, 
  requireRole(['entrenador','superadmin']), 
  validarParams(idParamSchema), 
  getLesionPorId
);

router.patch('/:id', 
  authenticateToken, 
  requireRole(['entrenador','superadmin']),
  validarParams(idParamSchema),
  validarBody(actualizarLesionBody), 
  patchLesion
);

router.delete('/:id', 
  authenticateToken, 
  requireRole(['entrenador','superadmin']), 
  validarParams(idParamSchema), 
  deleteLesion
);

export default router;