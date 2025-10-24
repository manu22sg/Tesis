import { Router } from "express";
import { validarBody, validarParams, validarQuery, idParamSchema } from "../validations/commonValidations.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";
import {
  actualizarAsistenciaBodySchema,
  paginacionAsistenciasSchema,
  marcarAsistenciaPorTokenBodySchema 
} from "../validations/asistenciaValidations.js";
import {
  actualizarAsistenciaController,
  eliminarAsistenciaController,
  listarAsistenciasDeSesionController,
  postMarcarAsistenciaPorToken
} from "../controllers/asistenciaController.js";

const router = Router();

router.post(
  '/marcar-asistencia',
  authenticateToken,
  requireRole('estudiante'),
  validarBody(marcarAsistenciaPorTokenBodySchema),
  postMarcarAsistenciaPorToken
);

// Entrenador edita asistencia
router.patch(
  "/:id",
  authenticateToken,
  requireRole("entrenador"),
  validarParams(idParamSchema),
  validarBody(actualizarAsistenciaBodySchema),
  actualizarAsistenciaController
);

// Entrenador elimina asistencia
router.delete(
  "/:id", 
  authenticateToken,
  requireRole("entrenador"),
  validarParams(idParamSchema),
  eliminarAsistenciaController
);

// Listar asistencias de una sesión
router.get(
  "/:id",
  authenticateToken,
  requireRole("entrenador"),
  validarParams(idParamSchema),
  validarQuery(paginacionAsistenciasSchema),
  listarAsistenciasDeSesionController
);

export default router;