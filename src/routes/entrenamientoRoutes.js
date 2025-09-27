import { Router } from 'express';
import {
  postCrearEntrenamiento,
  getEntrenamientos,
  getEntrenamientoPorId,
  patchActualizarEntrenamiento,
  deleteEntrenamiento,
  postCrearEntrenamientosRecurrentes
} from '../controllers/entrenamientoController.js';

import {
  crearEntrenamientoBody,
  obtenerEntrenamientosBody,
  obtenerEntrenamientoPorIdBody,
  actualizarEntrenamientoBody,
  eliminarEntrenamientoBody,
  crearEntrenamientosRecurrentesBody,
  validate
} from '../validations/entrenamientoValidations.js';

 import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * POST /api/entrenamientos
 * Crear nuevo entrenamiento
 * Acceso: Solo entrenador y superadmin
 * Body: {
 *   "canchaId": 1,
 *   "fecha": "2025-09-24",
 *   "horaInicio": "15:00",
 *   "horaFin": "17:00",
 *   "motivo": "Entrenamiento masculino - Preparación torneo",
 *   "descripcion": "Entrenamiento enfocado en jugadas defensivas"
 * }
 */
router.post('/',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
  validate(crearEntrenamientoBody),
  postCrearEntrenamiento
);

/**
 * GET /api/entrenamientos
 * Obtener entrenamientos con filtros y paginación
 * Acceso: Solo entrenador y superadmin
 * Body: {
 *   "fecha": "2025-09-24",   // opcional
 *   "canchaId": 1,           // opcional
 *   "page": 1,               // opcional
 *   "limit": 10              // opcional
 * }
 */
router.get('/',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
  validate(obtenerEntrenamientosBody),
  getEntrenamientos
);

/**
 * POST /api/entrenamientos/detalle
 * Obtener un entrenamiento específico por ID
 * Acceso: Solo entrenador y superadmin
 * Body: { "id": 123 }
 */
router.post('/detalle',
   authenticateToken,
  requireRole(['entrenador', 'superadmin']),
  validate(obtenerEntrenamientoPorIdBody),
  getEntrenamientoPorId
);

/**
 * PATCH /api/entrenamientos
 * Actualizar un entrenamiento existente
 * Acceso: Solo entrenador y superadmin
 * Body: {
 *   "id": 123,
 *   "fecha": "2025-09-25",      // opcional
 *   "horaInicio": "16:00",      // opcional
 *   "horaFin": "18:00",         // opcional
 *   "motivo": "Nuevo motivo",   // opcional
 *   "descripcion": "Nueva descripción"  // opcional
 * }
 */
router.patch('/',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
  validate(actualizarEntrenamientoBody),
  patchActualizarEntrenamiento
);

/**
 * DELETE /api/entrenamientos/eliminar
 * Eliminar un entrenamiento
 * Acceso: Solo entrenador y superadmin
 * Body: { "id": 123 }
 */
router.delete('/eliminar',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
  validate(eliminarEntrenamientoBody),
  deleteEntrenamiento
);

/**
 * POST /api/entrenamientos/recurrente
 * Crear entrenamientos recurrentes (ej: todos los lunes y miércoles por 2 meses)
 * Acceso: Solo entrenador y superadmin
 * Body: {
 *   "canchaId": 1,
 *   "fechaInicio": "2025-10-01",
 *   "fechaFin": "2025-12-31",
 *   "diasSemana": [1, 3, 5],     // 0=domingo, 1=lunes, 2=martes, ..., 6=sábado
 *   "horaInicio": "15:00",
 *   "horaFin": "17:00",
 *   "motivo": "Entrenamiento masculino semanal",
 *   "descripcion": "Entrenamientos regulares de temporada"
 * }
 */
router.post('/recurrente',
   authenticateToken,
   requireRole(['entrenador', 'superadmin']),
  validate(crearEntrenamientosRecurrentesBody),
  postCrearEntrenamientosRecurrentes
);

export default router;