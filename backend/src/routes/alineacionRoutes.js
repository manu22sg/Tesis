import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { validarBody, validarParams } from '../validations/commonValidations.js';
import {
  crearAlineacionBody,
  agregarJugadorBody,
  actualizarJugadorAlineacionBody,
  idParamSchema,
  quitarJugadorParams,
  sesionIdParamSchema
} from '../validations/alineacionValidations.js';
import { generarAlineacionInteligenteSchema } from '../validations/alineacionInteligenteValidations.js';

import {
  postCrearAlineacion,
  getAlineacionPorSesion,
  postAgregarJugador,
  patchAlineacionJugador,
  deleteAlineacionJugador,
  deleteAlineacion,
  patchActualizarPosiciones,
  exportarAlineacionExcel,
  exportarAlineacionPDF,
  postGenerarAlineacionInteligente, 
  getFormacionesDisponibles         

} from '../controllers/alineacionController.js';

const router = Router();

/** Solo entrenador/superadmin gestiona alineaciones */
router.post(
  '/',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarBody(crearAlineacionBody),
  postCrearAlineacion
);
router.get(
  '/excel/:sesionId',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validarParams(sesionIdParamSchema),
  exportarAlineacionExcel
);

router.get(
  '/pdf/:sesionId',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validarParams(sesionIdParamSchema),
  exportarAlineacionPDF
);

 // obtener alineación por sesión
router.get(
  '/sesion/:sesionId',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarParams(sesionIdParamSchema), // sesionId
  getAlineacionPorSesion
);
 // agregar jugador a alineación
router.post(
  '/jugador',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarBody(agregarJugadorBody),
  postAgregarJugador
);
 // actualizar datos de jugador en alineación
router.patch(
  '/jugador',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarBody(actualizarJugadorAlineacionBody),
  patchAlineacionJugador
);
 // quitar jugador de alineación
router.delete(
  '/jugador/:alineacionId/:jugadorId',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarParams(quitarJugadorParams),
  deleteAlineacionJugador
);
// eliminar alineación
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  validarParams(idParamSchema),
  deleteAlineacion
);

// actualizar posiciones de jugadores en alineación
router.patch(
  '/posiciones',
  authenticateToken,
  requireRole(['entrenador','superadmin']),
  patchActualizarPosiciones
);

router.post(
  '/inteligente',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validarBody(generarAlineacionInteligenteSchema),  
  postGenerarAlineacionInteligente
);


router.get(
  '/formaciones/:tipo',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  getFormacionesDisponibles
);

export default router;
