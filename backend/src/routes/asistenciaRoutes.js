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
  postMarcarAsistenciaPorToken,
  exportarAsistenciasExcel,
  exportarAsistenciasPDF,
  registrarAsistenciaManualController
} from "../controllers/asistenciaController.js";

const router = Router();


router.get("/excel", authenticateToken,
  requireRole("entrenador"),exportarAsistenciasExcel);

router.get("/pdf",authenticateToken,
  requireRole("entrenador"),exportarAsistenciasPDF);

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

router.post(
  "/registrar-manual",
  authenticateToken,
  requireRole("entrenador"),
  registrarAsistenciaManualController
);



export default router;