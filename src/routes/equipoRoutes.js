import { Router } from "express";
import {
  postEquipo, putEquipo, deleteEquipo,
  getEquiposDeCampeonato,
  postAgregarUsuarioAEquipo, deleteUsuarioDeEquipo, listarJugadoresEquipo
} from "../controllers/equipoController.js";
import {
  validate,
  validateParams,
  crearEquipoBody,
  actualizarEquipoBody,
  agregarUsuarioEquipoBody,
  quitarUsuarioEquipoParams
} from "../validations/equipoValidations.js";

const router = Router();

// Equipos por campeonato
router.get("/campeonato/:campeonatoId", getEquiposDeCampeonato);

// CRUD equipo
router.post("/", validate(crearEquipoBody), postEquipo);
router.patch("/:equipoId", validate(actualizarEquipoBody), putEquipo);
router.delete("/:equipoId", deleteEquipo);

// Jugadores (usuarios) en equipos de campeonato
router.post("/agregar-usuario", validate(agregarUsuarioEquipoBody), postAgregarUsuarioAEquipo);
router.delete("/:campeonatoId/:equipoId/:usuarioId", validateParams(quitarUsuarioEquipoParams), deleteUsuarioDeEquipo);
router.get("/:id/jugadores", listarJugadoresEquipo);

export default router;