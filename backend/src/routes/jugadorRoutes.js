import { Router } from "express";
import { 
  crearJugadorController,
  obtenerTodosJugadoresController,
  obtenerJugadorPorIdController,
  actualizarJugadorController,
  eliminarJugadorController,
  asignarJugadorAGrupoController,
  removerJugadorDeGrupoController,
  exportarJugadoresExcel,
  exportarJugadoresPDF

} from "../controllers/jugadorController.js";

import {crearJugadorSchema, actualizarJugadorSchema } from "../validations/jugadorValidations.js";
import { idParamSchema, paginacionSchema, grupoParamSchema, validarBody, validarParams, validarQuery } from "../validations/commonValidations.js";

const router = Router();

router.get("/excel", exportarJugadoresExcel);
router.get("/pdf", exportarJugadoresPDF);

// POST /jugadores - Crear jugador
router.post("/", 
  validarBody(crearJugadorSchema), 
  crearJugadorController
);

// GET /jugadores - Obtener todos los jugadores con filtros y paginación
router.get("/", 
  validarQuery(paginacionSchema), 
  obtenerTodosJugadoresController
);

// GET /jugadores/:id - Obtener jugador por ID
router.get("/:id", 
  validarParams(idParamSchema), 
  obtenerJugadorPorIdController
);

// PUT /jugadores/:id - Actualizar jugador
router.patch("/:id", 
  validarParams(idParamSchema), 
  validarBody(actualizarJugadorSchema), 
  actualizarJugadorController
);

// DELETE /jugadores/:id - Eliminar jugador
router.delete("/:id", 
  validarParams(idParamSchema), 
  eliminarJugadorController
);

// RUTAS PARA MANEJO DE GRUPOS

// POST /jugadores/:id/grupos/:grupoId - Asignar jugador a grupo
router.post("/:id/grupos/:grupoId", 
  validarParams(grupoParamSchema), 
  asignarJugadorAGrupoController
);

// DELETE /jugadores/:id/grupos/:grupoId - Remover jugador de grupo
router.delete("/:id/grupos/:grupoId", 
  validarParams(grupoParamSchema), 
  removerJugadorDeGrupoController
);

export default router;

