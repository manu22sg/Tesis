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

import {
  postCrearAlineacion,
  getAlineacionPorSesion,
  postAgregarJugador,
  patchAlineacionJugador,
  deleteAlineacionJugador,
  deleteAlineacion,
  patchActualizarPosiciones
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

export default router;
