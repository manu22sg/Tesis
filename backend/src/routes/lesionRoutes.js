import { Router } from 'express';
import { authenticateToken, requireRole, attachJugadorId } from '../middleware/authMiddleware.js';
import { validarBody, validarQuery, validarParams, crearLesionBody, actualizarLesionBody, obtenerLesionesQuery, idParamSchema } from '../validations/lesionValidations.js';
import { postCrearLesion, getLesiones, getLesionPorId, patchLesion, deleteLesion, getLesionesPorJugador } from '../controllers/lesionController.js';

const router = Router();

// POST, PATCH, DELETE
router.post('/', authenticateToken, requireRole(['entrenador','superadmin']), validarBody(crearLesionBody), postCrearLesion);
router.patch('/', authenticateToken, requireRole(['entrenador','superadmin']), validarBody(actualizarLesionBody), patchLesion);
router.delete('/:id', authenticateToken, requireRole(['entrenador','superadmin']), validarParams(idParamSchema), deleteLesion);

// Para que el estudiante vea solo sus lesiones
router.get('/mias', 
  authenticateToken, 
  requireRole('estudiante'), 
  attachJugadorId,                     //  req.user.jugadorId
  validarQuery(obtenerLesionesQuery),  // pagina, limite, desde, hasta (opcional)
  getLesiones                       
);

// Lesiones de un jugador específico (para entrenadores)
router.get('/jugador/:id',
  authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validarParams(idParamSchema),        // valida :id de jugador
  validarQuery(obtenerLesionesQuery),  // pagina, limite, desde, hasta (opcional)
  getLesionesPorJugador
);


// GET: entrenador/superadmin todas las lesiones
router.get('/', authenticateToken, requireRole(['entrenador','superadmin']), validarQuery(obtenerLesionesQuery), getLesiones);

// GET: lesión específica por ID
router.get('/:id', authenticateToken, requireRole(['entrenador','superadmin']), validarParams(idParamSchema), getLesionPorId);

export default router;