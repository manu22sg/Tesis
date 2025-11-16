import { Router } from "express";
import {
  postCampeonato, getCampeonatos, getCampeonato,
  putCampeonato, deleteCampeonato,
  postSortearPrimeraRonda, postGenerarSiguienteRonda,
  exportarCampeonatosExcel,    
  exportarCampeonatosPDF,
  exportarFixtureExcel,
  exportarFixturePDF
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
router.get("/excel", exportarCampeonatosExcel);
router.get("/pdf", exportarCampeonatosPDF);

router.get("/:id", getCampeonato);
router.patch("/:id", validate(actualizarCampeonatoBody), putCampeonato);
router.delete("/:id", deleteCampeonato);

// Fixture
router.post("/:id/sortear", postSortearPrimeraRonda);
router.post("/:id/siguiente-ronda", postGenerarSiguienteRonda);
router.get("/:id/fixture/excel", exportarFixtureExcel);
router.get("/:id/fixture/pdf", exportarFixturePDF);



export default router;