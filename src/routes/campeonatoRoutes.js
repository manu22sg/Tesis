import { Router } from "express";
import {
  postCampeonato, getCampeonatos, getCampeonato,
  putCampeonato, deleteCampeonato,
  postSortearPrimeraRonda, postGenerarSiguienteRonda
} from "../controllers/campeonatoController.js";
import { 
  validate, 
  crearCampeonatoBody, 
  actualizarCampeonatoBody 
} from "../validations/campeonatoValidations.js";

const router = Router();

// CRUD básico
router.post("/", validate(crearCampeonatoBody), postCampeonato);
router.get("/", getCampeonatos);
router.get("/:id", getCampeonato);
router.patch("/:id", validate(actualizarCampeonatoBody), putCampeonato);
router.delete("/:id", deleteCampeonato);

// Fixture
router.post("/:id/sortear", postSortearPrimeraRonda);
router.post("/:id/siguiente-ronda", postGenerarSiguienteRonda);


export default router;