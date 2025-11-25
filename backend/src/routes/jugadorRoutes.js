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
  paginacionJugadoresSchema,    // ✅ Usa este en lugar de paginacionSchema
  exportarJugadoresQuerySchema   // ✅ Nuevo para exportar
} from "../validations/commonValidations.js";

const router = Router();

// ✅ Rutas específicas PRIMERO
router.get("/excel", 
  validarQuery(exportarJugadoresQuerySchema), // ✅ Validación
  exportarJugadoresExcel
);

router.get("/pdf", 
  validarQuery(exportarJugadoresQuerySchema), // ✅ Validación
  exportarJugadoresPDF
);

// CRUD básico
router.post("/", 
  validarBody(crearJugadorSchema), 
  crearJugadorController
);

router.get("/", 
  validarQuery(paginacionJugadoresSchema), // ✅ Usa el schema con todos los filtros
  obtenerTodosJugadoresController
);

// ✅ Rutas con parámetros dinámicos AL FINAL
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