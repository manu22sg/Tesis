import { Router } from 'express';
import {
  patchAprobarReserva,
  patchRechazarReserva,
  getReservasPendientes,
exportarReservasExcel,
  exportarReservasPDF,
  getEstadisticasReservas
} from '../controllers/aprobacionController.js';

import {
  aprobarReservaBody,
  rechazarReservaBody,
  obtenerReservasPendientesBody,
  cambiarEstadoReservaBody,
  obtenerEstadisticasBody,
  validate
} from '../validations/aprobacionValidations.js';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();


router.get('/pendientes',
   authenticateToken,
   requireRole(['entrenador']),
  validate(obtenerReservasPendientesBody),
  getReservasPendientes
);


router.patch('/aprobar',
   authenticateToken,
   requireRole(['entrenador']),
  validate(aprobarReservaBody),
  patchAprobarReserva
);


router.patch('/rechazar',
   authenticateToken,
   requireRole(['entrenador']),
  validate(rechazarReservaBody),
  patchRechazarReserva
);



router.post('/estadisticas',
   authenticateToken,
   requireRole(['entrenador']),
  validate(obtenerEstadisticasBody),
  getEstadisticasReservas
);


router.get('/excel', 
  authenticateToken, 
  requireRole(['entrenador']), 
  exportarReservasExcel
);

router.get('/pdf', 
  authenticateToken, 
  requireRole(['entrenador']), 
  exportarReservasPDF
);


export default router;