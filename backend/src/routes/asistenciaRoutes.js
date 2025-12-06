import { Router } from "express";
import { 
  validarBody, 
  validarParams, 
  validarQuery, 
  idParamSchema, 
  jugadorIdParamSchema,
  paginacionAsistenciasSchema,    //  Importar de common
  exportarAsistenciasQuerySchema  //  Importar de common
} from "../validations/commonValidations.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";
import {
  actualizarAsistenciaBodySchema,
  marcarAsistenciaPorTokenBodySchema,
  registrarAsistenciaManualSchema
} from "../validations/asistenciaValidations.js";
import {
  actualizarAsistenciaController,
  eliminarAsistenciaController,
  listarAsistenciasDeSesionController,
  postMarcarAsistenciaPorToken,
  exportarAsistenciasExcel,
  exportarAsistenciasPDF,
  registrarAsistenciaManualController,
  listarAsistenciasDeJugadorController,
  obtenerEstadisticasAsistenciaJugadorController
} from "../controllers/asistenciaController.js";

const router = Router();

//  Rutas específicas PRIMERO
router.get("/excel", 
  authenticateToken,
  requireRole(["entrenador"]),
  validarQuery(exportarAsistenciasQuerySchema), //  Validación
  exportarAsistenciasExcel
);

router.get("/pdf",
  authenticateToken,
  requireRole(["entrenador"]),
  validarQuery(exportarAsistenciasQuerySchema), //  Validación
  exportarAsistenciasPDF
);

// Rutas por jugador
router.get("/jugador/:jugadorId",
  authenticateToken,
  validarParams(jugadorIdParamSchema), 
  validarQuery(paginacionAsistenciasSchema), //  Usa schema de common
  listarAsistenciasDeJugadorController
);

router.get("/jugador/:jugadorId/estadisticas",
  authenticateToken,
  requireRole(["entrenador"]),
  validarParams(jugadorIdParamSchema),
  obtenerEstadisticasAsistenciaJugadorController
);

// Marcar asistencia por token (estudiante)
router.post('/marcar-asistencia',
  authenticateToken,
  requireRole(['estudiante']),
  validarBody(marcarAsistenciaPorTokenBodySchema),
  postMarcarAsistenciaPorToken
);

// Registro manual de asistencia (entrenador)
router.post("/registrar-manual",

  authenticateToken,
  requireRole(["entrenador"]),
  validarBody(registrarAsistenciaManualSchema),
  registrarAsistenciaManualController
);

// Editar asistencia (entrenador)
router.patch("/:id",
  authenticateToken,
  requireRole(["entrenador"]),
  validarParams(idParamSchema),
  validarBody(actualizarAsistenciaBodySchema),
  actualizarAsistenciaController
);

// Eliminar asistencia (entrenador)
router.delete("/:id", 
  authenticateToken,
  requireRole(["entrenador"]),
  validarParams(idParamSchema),
  eliminarAsistenciaController
);


router.get("/:id",
  authenticateToken,
  requireRole(["entrenador"]),
  validarParams(idParamSchema),
  validarQuery(paginacionAsistenciasSchema), //  Usa schema de common
  listarAsistenciasDeSesionController
);

export default router;