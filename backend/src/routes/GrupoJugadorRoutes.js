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
import { idParamSchema,  validarBody, validarParams, paginacionSchema} from "../validations/commonValidations.js";
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';


const router = Router();

router.post("/",authenticateToken,requireRole(['entrenador']), validarBody(crearGrupoSchema), crearGrupoController);
router.get("/", authenticateToken,requireRole(['entrenador']),obtenerTodosGruposController);
router.get("/:id", authenticateToken,requireRole(['entrenador']),validarParams(idParamSchema), obtenerGrupoPorIdController);
router.patch("/:id",authenticateToken, requireRole(['entrenador']),validarParams(idParamSchema), validarBody(actualizarGrupoSchema), actualizarGrupoController);
router.delete("/:id",authenticateToken,requireRole(['entrenador']), validarParams(idParamSchema), eliminarGrupoController);



router.get("/export/excel",authenticateToken,requireRole(['entrenador']), exportarGruposExcel);
router.get("/export/pdf" ,authenticateToken,requireRole(['entrenador']), exportarGruposPDF);



export default router;
