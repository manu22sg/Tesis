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
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get("/excel", 
  authenticateToken,
    requireRole(["entrenador"]),
  validarQuery(exportarJugadoresQuerySchema), 
  exportarJugadoresExcel
);

router.get("/pdf", 
  authenticateToken,
  requireRole(["entrenador"]),
  validarQuery(exportarJugadoresQuerySchema), 
  exportarJugadoresPDF
);

// CRUD básico
router.post("/", 
  authenticateToken,
  requireRole(["entrenador"]),
  validarBody(crearJugadorSchema), 
  crearJugadorController
);

router.get("/", 
  authenticateToken,

  validarQuery(paginacionJugadoresSchema), 
  obtenerTodosJugadoresController
);

router.get("/:id", 
  authenticateToken,

  validarParams(idParamSchema), 
  obtenerJugadorPorIdController
);

router.patch("/:id", 
  authenticateToken,
  requireRole(["entrenador"]),
  validarParams(idParamSchema), 
  validarBody(actualizarJugadorSchema), 
  actualizarJugadorController
);

router.delete("/:id", 
  authenticateToken,
  requireRole(["entrenador"]),
  validarParams(idParamSchema), 
  eliminarJugadorController
);

// Rutas para manejo de grupos
router.post("/:id/grupos/:grupoId", 
  authenticateToken,
  requireRole(["entrenador"]),
  validarParams(grupoParamSchema), 
  asignarJugadorAGrupoController
);

router.delete("/:id/grupos/:grupoId", 
  authenticateToken,
  requireRole(["entrenador"]),
  validarParams(grupoParamSchema), 
  removerJugadorDeGrupoController
);

export default router;