import express from "express";
import { validate, validateQuery } from "../validations/estadisticaCampeonatoValidations.js";
import {
  crearEstadisticaBody,
  actualizarEstadisticaBody,
  obtenerEstadisticasQuery,
  eliminarEstadisticaBody,
} from "../validations/estadisticaCampeonatoValidations.js";
import * as ctrl from "../controllers/estadisticaCampeonatoController.js";

const router = express.Router();

// Crear
router.post("/", validate(crearEstadisticaBody), ctrl.crearEstadistica);

// Actualizar
router.patch("/:id", validate(actualizarEstadisticaBody), ctrl.actualizarEstadistica);

// Listar
router.get("/", validateQuery(obtenerEstadisticasQuery), ctrl.listarEstadisticas);

// Obtener una estadística por ID
router.get("/:id", ctrl.obtenerEstadisticaPorId);

// Eliminar
router.delete("/:id", validate(eliminarEstadisticaBody), ctrl.eliminarEstadistica);

router.get("/jugadorcampeonato/:jugadorCampId/campeonato/:campId", ctrl.getEstadisticasPorJugadorCampeonato);

router.get("/usuario/:usuarioId/campeonato/:campId", ctrl.getEstadisticasPorUsuarioEnCampeonato);

router.get("/equipo/:equipoId/campeonato/:campeonatoId", 
  ctrl.listarJugadoresPorEquipoYCampeonato
);


export default router;
