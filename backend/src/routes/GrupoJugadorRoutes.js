import { Router } from "express";
import {
  crearGrupoController,
  obtenerTodosGruposController,
  obtenerGrupoPorIdController,
  actualizarGrupoController,
  eliminarGrupoController,
   exportarGruposExcel,
   exportarGruposPDF
} from "../controllers/grupoJugadorController.js";
import {
  crearGrupoSchema,
  actualizarGrupoSchema
} from "../validations/grupoJugadorValidations.js";
import { idParamSchema,  validarBody, validarParams, paginacionSchema,validarQuery} from "../validations/commonValidations.js";
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';


const router = Router();

router.get("/export/excel", authenticateToken, requireRole(['entrenador']), exportarGruposExcel);
router.get("/export/pdf", authenticateToken, requireRole(['entrenador']), exportarGruposPDF);

// Luego las rutas CRUD normales
router.post("/", authenticateToken, requireRole(['entrenador']), validarBody(crearGrupoSchema), crearGrupoController);
router.get(
  "/",
  authenticateToken,
  requireRole(['entrenador']),
  validarQuery(paginacionSchema),
  obtenerTodosGruposController
);

// ✅ Rutas con parámetros AL FINAL
router.get("/:id", authenticateToken, requireRole(['entrenador']), validarParams(idParamSchema), obtenerGrupoPorIdController);
router.patch("/:id", authenticateToken, requireRole(['entrenador']), validarParams(idParamSchema), validarBody(actualizarGrupoSchema), actualizarGrupoController);
router.delete("/:id", authenticateToken, requireRole(['entrenador']), validarParams(idParamSchema), eliminarGrupoController);

export default router;
