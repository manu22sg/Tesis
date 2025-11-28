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

import { crearJugadorSchema, actualizarJugadorSchema } from "../validations/jugadorValidations.js";
import { 
  idParamSchema, 
  grupoParamSchema, 
  validarBody, 
  validarParams, 
  validarQuery,
  paginacionJugadoresSchema,    
  exportarJugadoresQuerySchema   
} from "../validations/commonValidations.js";

const router = Router();

router.get("/excel", 
  validarQuery(exportarJugadoresQuerySchema), 
  exportarJugadoresExcel
);

router.get("/pdf", 
  validarQuery(exportarJugadoresQuerySchema), 
  exportarJugadoresPDF
);

// CRUD básico
router.post("/", 
  validarBody(crearJugadorSchema), 
  crearJugadorController
);

router.get("/", 
  validarQuery(paginacionJugadoresSchema), 
  obtenerTodosJugadoresController
);

router.get("/:id", 
  validarParams(idParamSchema), 
  obtenerJugadorPorIdController
);

router.patch("/:id", 
  validarParams(idParamSchema), 
  validarBody(actualizarJugadorSchema), 
  actualizarJugadorController
);

router.delete("/:id", 
  validarParams(idParamSchema), 
  eliminarJugadorController
);

// Rutas para manejo de grupos
router.post("/:id/grupos/:grupoId", 
  validarParams(grupoParamSchema), 
  asignarJugadorAGrupoController
);

router.delete("/:id/grupos/:grupoId", 
  validarParams(grupoParamSchema), 
  removerJugadorDeGrupoController
);

export default router;