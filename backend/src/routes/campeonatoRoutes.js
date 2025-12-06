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
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// CRUD básico
router.post("/",authenticateToken,   requireRole(["entrenador"]),
 validate(crearCampeonatoBody), postCampeonato);
router.get("/",  getCampeonatos);
router.get("/excel", authenticateToken,   requireRole(["entrenador"]), exportarCampeonatosExcel);
router.get("/pdf", authenticateToken,   requireRole(["entrenador"]),exportarCampeonatosPDF);

router.get("/:id", authenticateToken, getCampeonato);
router.patch("/:id", authenticateToken,   requireRole(["entrenador"]),validate(actualizarCampeonatoBody), putCampeonato);
router.delete("/:id", authenticateToken,   requireRole(["entrenador"]), deleteCampeonato);

// Fixture
router.post("/:id/sortear", authenticateToken,   requireRole(["entrenador"]), postSortearPrimeraRonda);
router.post("/:id/siguiente-ronda", authenticateToken,  requireRole(["entrenador"]),  postGenerarSiguienteRonda);
router.get("/:id/fixture/excel", authenticateToken,  requireRole(["entrenador"]),  exportarFixtureExcel);
router.get("/:id/fixture/pdf", authenticateToken,   requireRole(["entrenador"]),exportarFixturePDF);



export default router;