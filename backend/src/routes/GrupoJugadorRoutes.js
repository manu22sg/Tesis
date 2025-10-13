import { Router } from "express";
import {
  crearGrupoController,
  obtenerTodosGruposController,
  obtenerGrupoPorIdController,
  actualizarGrupoController,
  eliminarGrupoController,
  // obtenerMiembrosDeGrupoController
} from "../controllers/grupoJugadorController.js";
import {
  crearGrupoSchema,
  actualizarGrupoSchema,
} from "../validations/grupoJugadorValidations.js";
import { idParamSchema,  validarBody, validarParams, paginacionSchema} from "../validations/commonValidations.js";

const router = Router();

router.post("/", validarBody(crearGrupoSchema), crearGrupoController);
router.get("/", obtenerTodosGruposController);
router.get("/:id", validarParams(idParamSchema), obtenerGrupoPorIdController);
router.patch("/:id", validarParams(idParamSchema), validarBody(actualizarGrupoSchema), actualizarGrupoController);
router.delete("/:id", validarParams(idParamSchema), eliminarGrupoController);
/*
router.get(
  "/grupos/:id/miembros",
  validarParams(idParamSchema),
  validarQuery(paginacionSchema),  // ya te setea pagina/limite por defecto
  obtenerMiembrosDeGrupoController
);
*/

export default router;
