import express from "express";
import { validate, validateQuery } from "../validations/estadisticaCampeonatoValidations.js";
import {
  crearEstadisticaBody,
  actualizarEstadisticaBody,
  obtenerEstadisticasQuery,
  eliminarEstadisticaBody,
} from "../validations/estadisticaCampeonatoValidations.js";
import * as ctrl from "../controllers/estadisticaCampeonatoController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ============================================
// ORDEN CORRECTO DE RUTAS
// ============================================
// REGLA: Las rutas más específicas SIEMPRE van primero
// Las rutas con parámetros dinámicos (:id) van AL FINAL

// 1️⃣ RUTAS DE EXPORTACIÓN (más específicas, tienen /campeonato/:id/excel|pdf)
router.get(
  "/campeonato/:campeonatoId/excel", 
  authenticateToken,  
  requireRole(["entrenador"]), 
  ctrl.exportarEstadisticasCampeonatoExcel
);

router.get(
  "/campeonato/:campeonatoId/pdf", 
  authenticateToken,  
  requireRole(["entrenador"]), 
  ctrl.exportarEstadisticasCampeonatoPDF
);

// 2️⃣ RUTAS DE CONSULTA POR JUGADOR/USUARIO/EQUIPO (específicas)
router.get(
  "/jugadorcampeonato/:jugadorCampId/campeonato/:campId", 
  authenticateToken, 
  ctrl.getEstadisticasPorJugadorCampeonato
);

router.get(
  "/usuario/:usuarioId/campeonato/:campId", 
  authenticateToken, 
  ctrl.getEstadisticasPorUsuarioEnCampeonato
);

router.get(
  "/equipo/:equipoId/campeonato/:campeonatoId",  
  authenticateToken,
  ctrl.listarJugadoresPorEquipoYCampeonato
);

// 3️⃣ CREAR (POST sin parámetros en la ruta)
router.post(
  "/", 
  authenticateToken,   
  requireRole(["entrenador"]),
  validate(crearEstadisticaBody), 
  ctrl.crearEstadistica
);

// 4️⃣ LISTAR TODAS (GET sin parámetros, usa query params)
// ⚠️ CRÍTICO: Esta debe ir ANTES de GET /:id
router.get(
  "/",  
  authenticateToken, 
  validateQuery(obtenerEstadisticasQuery), 
  ctrl.listarEstadisticas
);

// 5️⃣ RUTAS CON /:id (SIEMPRE AL FINAL)
// ⚠️ Estas rutas capturan cualquier cosa después de /estadisticas/
// Por eso DEBEN ir al final

// Obtener por ID
router.get(
  "/:id", 
  authenticateToken,   
  requireRole(["entrenador"]),
  ctrl.obtenerEstadisticaPorId
);

// Actualizar
router.patch(
  "/:id", 
  authenticateToken,   
  requireRole(["entrenador"]),
  validate(actualizarEstadisticaBody), 
  ctrl.actualizarEstadistica
);

// Eliminar
router.delete(
  "/:id",  
  authenticateToken,  
  requireRole(["entrenador"]), 
  validate(eliminarEstadisticaBody), 
  ctrl.eliminarEstadistica
);

export default router;