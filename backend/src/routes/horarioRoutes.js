// horario.routes.js
import { Router } from 'express';
import { 
  getDisponibilidadPorFecha, 
  getDisponibilidadPorRango,
  verificarDisponibilidad 
} from '../controllers/horarioController.js';

const router = Router();

// GET /api/horarios/disponibilidad?fecha=2025-10-14&page=1&limit=5
router.get('/disponibilidad', getDisponibilidadPorFecha);

// GET /api/horarios/disponibilidad/rango?fechaInicio=...&fechaFin=...&page=1&limit=10
router.get('/disponibilidad/rango', getDisponibilidadPorRango);

// GET /api/horarios/verificar?canchaId=1&fecha=...&horaInicio=...&horaFin=...
router.get('/verificar', verificarDisponibilidad);

export default router;