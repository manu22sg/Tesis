import express from "express";
import { asignarPartido, postRegistrarResultado, getPartidosPorCampeonato, ctrlVerificarDisponibilidadPartido} from "../controllers/partidoController.js";
import { validate, programarPartidoBody, registrarResultadoBody } from "../validations/partidoValidations.js";
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.patch("/:id/programar", authenticateToken,   requireRole(["entrenador"]), validate(programarPartidoBody), asignarPartido);

router.post("/:id/registrar-resultado",authenticateToken,    requireRole(["entrenador"]), validate(registrarResultadoBody), postRegistrarResultado);

router.get("/campeonato/:id", authenticateToken, getPartidosPorCampeonato);

router.get(
  "/disponibilidad",
  ctrlVerificarDisponibilidadPartido
);


export default router;