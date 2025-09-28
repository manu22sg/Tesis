import { Router } from "express";
import { validarBody, validarParams, validarQuery, idParamSchema } from "../validations/commonValidations.js";
import { authenticateToken, attachJugadorId, requireRole } from "../middleware/authMiddleware.js";
import {
  marcarAsistenciaBodySchema,
  actualizarAsistenciaBodySchema,
  paginacionAsistenciasSchema
} from "../validations/asistenciaValidations.js";
import {
  marcarAsistenciaController,
  actualizarAsistenciaController,
  eliminarAsistenciaController,
  listarAsistenciasDeSesionController
} from "../controllers/asistenciaController.js";

const router = Router();

// Jugador marca asistencia usando token de la sesión
router.post(
  "/:id",
  authenticateToken,
  requireRole("estudiante"),
  attachJugadorId,
  validarParams(idParamSchema),
  validarBody(marcarAsistenciaBodySchema),
  marcarAsistenciaController
);

// Entrenador edita asistencia
router.patch(
  "/:id", // :id es el ID de la asistencia
  authenticateToken,
  requireRole("entrenador"),
  validarParams(idParamSchema),
  validarBody(actualizarAsistenciaBodySchema),
  actualizarAsistenciaController
);

// Entrenador elimina asistencia
router.delete(
  "/:id", // :id es el ID de la asistencia
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
