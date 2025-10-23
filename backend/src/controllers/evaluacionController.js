import { success, error, notFound } from '../utils/responseHandler.js';
import { crearEvaluacion, obtenerEvaluaciones, obtenerEvaluacionPorId, actualizarEvaluacion, eliminarEvaluacion } from '../services/evaluacionServices.js';

export async function postCrearEvaluacion(req,res){
  const [data, err] = await crearEvaluacion(req.body);
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, data, 'Evaluación creada', 201);
}
export async function getEvaluaciones(req, res) {
  // Convertir query params a números
  const filtros = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };
  
  // Agregar filtros opcionales
  if (req.query.q) filtros.q = req.query.q; 
  if (req.query.jugadorId) filtros.jugadorId = parseInt(req.query.jugadorId);
  if (req.query.sesionId) filtros.sesionId = parseInt(req.query.sesionId);
  if (req.query.desde) filtros.desde = req.query.desde;
  if (req.query.hasta) filtros.hasta = req.query.hasta;
  
  // Si el rol es estudiante, forzar su propio jugadorId
  if (req.user?.rol === 'estudiante' && req.user?.jugadorId) {
    filtros.jugadorId = req.user.jugadorId;
  }
  
  const [data, err] = await obtenerEvaluaciones(filtros);
  if (err) return error(res, err);
  return success(res, data, 'Evaluaciones obtenidas');
}


export async function getEvaluacionPorId(req, res) {
  const [data, err] = await obtenerEvaluacionPorId(parseInt(req.params.id));
  if (err) return notFound(res, err);
  return success(res, data, 'Evaluación encontrada');
}

export async function patchEvaluacion(req, res) {
  const id = parseInt(req.params.id);
  const [data, err] = await actualizarEvaluacion(id, req.body);
  if (err) return error(res, err, err.includes('no encontrada') ? 404 : 400);
  return success(res, data, 'Evaluación actualizada');
}

export async function deleteEvaluacion(req, res) {
  const [ok, err] = await eliminarEvaluacion(parseInt(req.params.id));
  if (err) return error(res, err, err.includes('no encontrada') ? 404 : 400);
  return success(res, { eliminado: !!ok }, 'Evaluación eliminada');
}

export async function getEvaluacionesPorJugador(req, res) {
  const jugadorId = parseInt(req.params.jugadorId, 10);
  const filtros = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    jugadorId
  };
  
  if (req.query.desde) filtros.desde = req.query.desde;
  if (req.query.hasta) filtros.hasta = req.query.hasta;
  if (req.query.sesionId) filtros.sesionId = parseInt(req.query.sesionId);

  const [data, err] = await obtenerEvaluaciones(filtros);
  if (err) return error(res, err);
  return success(res, data, 'Evaluaciones del jugador obtenidas');
}

// GET /evaluaciones/mias (estudiante)
export async function getMisEvaluaciones(req, res) {
  const jugadorId = req.user.jugadorId;
  const filtros = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    jugadorId
  };
  
  if (req.query.desde) filtros.desde = req.query.desde;
  if (req.query.hasta) filtros.hasta = req.query.hasta;
  if (req.query.sesionId) filtros.sesionId = parseInt(req.query.sesionId);

  const [data, err] = await obtenerEvaluaciones(filtros);
  if (err) return error(res, err);
  return success(res, data, 'Tus evaluaciones');
}
