import { Router } from 'express';
import { 
  getDisponibilidadPorFecha,
  verificarDisponibilidadReserva,
  verificarDisponibilidadSesion
} from '../controllers/horarioController.js';

import { 
  validateQuery,
  disponibilidadPorFechaQuery,
  verificarDisponibilidadReservaQuery,
  verificarDisponibilidadSesionQuery
} from '../validations/validationsSchemas.js';

const router = Router();

// 📋 GET /disponibilidad?fecha=2025-11-30&tipoUso=reserva
// Consultar disponibilidad de canchas para una fecha específica
router.get(
  '/disponibilidad',
  validateQuery(disponibilidadPorFechaQuery),
  getDisponibilidadPorFecha
);

// ✅ GET /verificar-reserva?canchaId=1&fecha=2025-11-30&inicio=08:00&fin=09:00
// Verificar si una cancha está disponible para una RESERVA específica
router.get(
  '/verificar-reserva',
  validateQuery(verificarDisponibilidadReservaQuery),
  verificarDisponibilidadReserva
);

// ✅ GET /verificar-sesion?canchaId=1&fecha=2025-11-30&inicio=08:00&fin=10:00&sesionIdExcluir=5
// Verificar si una cancha está disponible para una SESIÓN específica
router.get(
  '/verificar-sesion',
  validateQuery(verificarDisponibilidadSesionQuery),
  verificarDisponibilidadSesion
);

export default router;