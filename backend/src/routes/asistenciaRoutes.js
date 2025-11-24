import { Router } from "express";
import { validarBody, validarParams, validarQuery, idParamSchema, jugadorIdParamSchema} from "../validations/commonValidations.js";
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
  registrarAsistenciaManualController,
  listarAsistenciasDeJugadorController,
  obtenerEstadisticasAsistenciaJugadorController
} from "../controllers/asistenciaController.js";

const router = Router();

// ✅ Exportación (soporta sesionId y jugadorId)
router.get("/excel", 
  authenticateToken,
  requireRole("entrenador"),
  exportarAsistenciasExcel
);

router.get("/pdf",
  authenticateToken,
  requireRole("entrenador"),
  exportarAsistenciasPDF
);

// ✅ NUEVAS RUTAS: Asistencias por jugador
router.get("/jugador/:jugadorId",
  authenticateToken,
  requireRole("entrenador"),
  validarParams(jugadorIdParamSchema), 
  validarQuery(paginacionAsistenciasSchema),
  listarAsistenciasDeJugadorController
);

router.get("/jugador/:jugadorId/estadisticas",
  authenticateToken,
  requireRole("entrenador"),
  validarParams(jugadorIdParamSchema),
  obtenerEstadisticasAsistenciaJugadorController
);

// Marcar asistencia por token (estudiante)
router.post('/marcar-asistencia',
  authenticateToken,
  requireRole('estudiante'),
  validarBody(marcarAsistenciaPorTokenBodySchema),
  postMarcarAsistenciaPorToken
);

// Registro manual de asistencia (entrenador)
router.post("/registrar-manual",
  authenticateToken,
  requireRole("entrenador"),
  registrarAsistenciaManualController
);

// Editar asistencia (entrenador)
router.patch("/:id",
  authenticateToken,
  requireRole("entrenador"),
  validarParams(idParamSchema),
  validarBody(actualizarAsistenciaBodySchema),
  actualizarAsistenciaController
);

// Eliminar asistencia (entrenador)
router.delete("/:id", 
  authenticateToken,
  requireRole("entrenador"),
  validarParams(idParamSchema),
  eliminarAsistenciaController
);

// Listar asistencias de una sesión (entrenador)
router.get("/:id",
  authenticateToken,
  requireRole("entrenador"),
  validarParams(idParamSchema),
  validarQuery(paginacionAsistenciasSchema),
  listarAsistenciasDeSesionController
);

export default router;