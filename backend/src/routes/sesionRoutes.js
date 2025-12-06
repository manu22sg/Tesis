import { Router } from 'express';
import {
  postCrearSesion,
  getSesiones,
  getSesionPorId,
  patchActualizarSesion,
  deleteSesion,
  postSesionesRecurrentes,
  getSesionesPorEstudiante,
  exportarSesionesExcel,
  exportarSesionesPDF
} from '../controllers/sesionController.js';

import {
  crearSesionBody,
  obtenerSesionesQuery,        
  obtenerSesionPorIdBody,
  actualizarSesionBody,
  eliminarSesionBody,
  crearSesionesRecurrentesBody,
  validate,
  validateQuery                 
} from '../validations/sesionValidations.js';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/',
  authenticateToken,
  requireRole(['entrenador']),
  validate(crearSesionBody),
  postCrearSesion
);

//GET usa validateQuery
router.get('/',
  authenticateToken,
  requireRole(['entrenador']),
  validateQuery(obtenerSesionesQuery),  
  getSesiones
);

router.post('/detalle',
  authenticateToken,
  requireRole(['entrenador']),
  validate(obtenerSesionPorIdBody),
  getSesionPorId
);

router.patch('/',
  authenticateToken,
  requireRole(['entrenador']),
  validate(actualizarSesionBody),
  patchActualizarSesion
);

router.delete('/eliminar',
  authenticateToken,
  requireRole(['entrenador']),
  validate(eliminarSesionBody),
  deleteSesion
);

router.post('/recurrente',
  authenticateToken,
  requireRole(['entrenador']),
  validate(crearSesionesRecurrentesBody),
  postSesionesRecurrentes
);

router.get('/estudiante',
  authenticateToken,
  requireRole(['estudiante']),
  getSesionesPorEstudiante
);

router.get("/excel", authenticateToken, requireRole(['entrenador']), exportarSesionesExcel);
router.get("/pdf", authenticateToken, requireRole(['entrenador']), exportarSesionesPDF);


export default router;