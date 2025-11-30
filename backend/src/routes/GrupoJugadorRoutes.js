import { Router } from "express";
import {
  crearGrupoController,
  obtenerTodosGruposController,
  obtenerGrupoPorIdController,
  actualizarGrupoController,
  eliminarGrupoController,
  exportarGruposExcel,
  exportarGruposPDF,
  getEstadisticasEntrenador
} from "../controllers/grupoJugadorController.js";
import {
  crearGrupoSchema,
  actualizarGrupoSchema
} from "../validations/grupoJugadorValidations.js";
import { idParamSchema, validarBody, validarParams, paginacionSchema, validarQuery } from "../validations/commonValidations.js";
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// ✅ RUTAS ESPECÍFICAS PRIMERO (sin parámetros dinámicos)
router.get("/estadisticas", authenticateToken, requireRole(['entrenador']), getEstadisticasEntrenador);
router.get("/export/excel", authenticateToken, requireRole(['entrenador']), exportarGruposExcel);
router.get("/export/pdf", authenticateToken, requireRole(['entrenador']), exportarGruposPDF);

// Rutas CRUD normales
router.post("/", authenticateToken, requireRole(['entrenador']), validarBody(crearGrupoSchema), crearGrupoController);
router.get(
  "/",
  authenticateToken,
  requireRole(['entrenador']),
  validarQuery(paginacionSchema),
  obtenerTodosGruposController
);

router.get("/:id", authenticateToken, requireRole(['entrenador']), validarParams(idParamSchema), obtenerGrupoPorIdController);
router.patch("/:id", authenticateToken, requireRole(['entrenador']), validarParams(idParamSchema), validarBody(actualizarGrupoSchema), actualizarGrupoController);
router.delete("/:id", authenticateToken, requireRole(['entrenador']), validarParams(idParamSchema), eliminarGrupoController);

export default router;
