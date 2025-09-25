import {
  getDisponibilidadPorFecha,
  getDisponibilidadPorRango,
  getVerificarDisponibilidad
} from '../controllers/horarioController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  validate,
  disponibilidadPorFechaBody,
  disponibilidadPorRangoBody,
  verificarEspecificaBody
} from '../validations/horarioValidations.js';
    
import { Router } from 'express';

const router = Router();

router.post("/disponibilidad/fecha", validate(disponibilidadPorFechaBody), getDisponibilidadPorFecha);
router.post("/disponibilidad/rango", validate(disponibilidadPorRangoBody), getDisponibilidadPorRango);
router.post("/disponibilidad/verificar", validate(verificarEspecificaBody), getVerificarDisponibilidad);

export default router;
