import express from "express";
import { asignarPartido, postRegistrarResultado, getPartidosPorCampeonato } from "../controllers/partidoController.js";
import { validate, programarPartidoBody, registrarResultadoBody } from "../validations/partidoValidations.js";

const router = express.Router();

router.patch("/:id/programar", validate(programarPartidoBody), asignarPartido);

router.post("/:id/registrar-resultado", validate(registrarResultadoBody), postRegistrarResultado);

router.get("/campeonato/:id", getPartidosPorCampeonato);

export default router;