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
 //Rutas de Horarios para obtener disponibilidad y verificar horarios
router.post("/disponibilidad/fecha", authenticateToken, validate(disponibilidadPorFechaBody), getDisponibilidadPorFecha);
router.post("/disponibilidad/rango", authenticateToken, validate(disponibilidadPorRangoBody), getDisponibilidadPorRango);
router.post("/disponibilidad/verificar", authenticateToken, validate(verificarEspecificaBody), getVerificarDisponibilidad);

export default router;
