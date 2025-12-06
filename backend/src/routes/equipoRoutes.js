import { Router } from "express";
import {
  postEquipo, putEquipo, deleteEquipo,
  getEquiposDeCampeonato,
  postAgregarUsuarioAEquipo, deleteUsuarioDeEquipo, listarJugadoresEquipo,
  exportarEquiposExcel,    
  exportarEquiposPDF        

} from "../controllers/equipoController.js";
import {
  validate,
  validateParams,
  crearEquipoBody,
  actualizarEquipoBody,
  agregarUsuarioEquipoBody,
  quitarUsuarioEquipoParams
} from "../validations/equipoValidations.js";
import { requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Equipos por campeonato
router.get("/campeonato/:campeonatoId", getEquiposDeCampeonato);
router.get("/:campeonatoId/excel",  requireRole(["entrenador"]), exportarEquiposExcel);
router.get("/:campeonatoId/pdf",   requireRole(["entrenador"]), exportarEquiposPDF);

// CRUD equipo
router.post("/",   requireRole(["entrenador"]),validate(crearEquipoBody), postEquipo);
router.patch("/:equipoId",  requireRole(["entrenador"]),  validate(actualizarEquipoBody), putEquipo);
router.delete("/:equipoId",   requireRole(["entrenador"]), deleteEquipo);

// Jugadores (usuarios) en equipos de campeonato
router.post("/agregar-usuario", requireRole(["entrenador"]), validate(agregarUsuarioEquipoBody), postAgregarUsuarioAEquipo);
router.delete("/:campeonatoId/:equipoId/:usuarioId",   requireRole(["entrenador"]),validateParams(quitarUsuarioEquipoParams), deleteUsuarioDeEquipo);
router.get("/:id/jugadores", listarJugadoresEquipo);

export default router;