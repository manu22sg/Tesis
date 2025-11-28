import { Router } from 'express';
import {
  postCrearCancha,
  getCanchas,
  getCanchaPorId,
  patchActualizarCancha,
  deleteCancha,
  patchReactivarCancha,
  exportarCanchasExcel,
  exportarCanchasPDF
} from '../controllers/canchaController.js';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

// Validaciones
import {
  validate,
  crearCanchaBody,
  actualizarCanchaBody,
  obtenerCanchasBody,
  obtenerCanchaPorIdBody,
  eliminarCanchaBody,
  reactivarCanchaBody
} from '../validations/canchaValidations.js';

const router = Router();

// ================================
// RUTAS DE CANCHAS + VALIDACIONES
// ================================

// Crear cancha
router.post(
  '/',
  authenticateToken,
  requireRole(['entrenador']),
  validate(crearCanchaBody),
  postCrearCancha
);

// Obtener canchas (con filtros)
router.get(
  '/',
  validate(obtenerCanchasBody),
  getCanchas
);

// Obtener cancha por ID (en body)
router.post(
  '/detalle',
  authenticateToken,
  requireRole(['superadmin', 'entrenador']),
  validate(obtenerCanchaPorIdBody),
  getCanchaPorId
);

// Actualizar cancha
router.patch(
  '/',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(actualizarCanchaBody),
  patchActualizarCancha
);

// Eliminar cancha
router.delete(
  '/eliminar',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(eliminarCanchaBody),
  deleteCancha
);

// Reactivar cancha
router.patch(
  '/reactivar',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(reactivarCanchaBody),
  patchReactivarCancha
);

// Exportar a Excel
router.get(
  '/excel',
  authenticateToken,
  requireRole('entrenador'),
  exportarCanchasExcel
);

// Exportar a PDF
router.get(
  '/pdf',
  authenticateToken,
  requireRole('entrenador'),
  exportarCanchasPDF
);

export default router;
