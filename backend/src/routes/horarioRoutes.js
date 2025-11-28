import { Router } from 'express';
import { 
  getDisponibilidadPorFecha, 
  verificarDisponibilidad 
} from '../controllers/horarioController.js';

import { 
  validateQuery,
  disponibilidadPorFechaQuery,
  verificarDisponibilidadQuery
} from '../validations/horarioValidations.js';

const router = Router();

// GET /disponibilidad?fecha=
router.get(
  '/disponibilidad',
  validateQuery(disponibilidadPorFechaQuery),
  getDisponibilidadPorFecha
);

// GET /verificar?canchaId=...
router.get(
  '/verificar',
  validateQuery(verificarDisponibilidadQuery),
  verificarDisponibilidad
);

export default router;
