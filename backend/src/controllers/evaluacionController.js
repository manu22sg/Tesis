import { success, error, notFound } from '../utils/responseHandler.js';
import { crearEvaluacion, obtenerEvaluaciones, obtenerEvaluacionPorId, actualizarEvaluacion, eliminarEvaluacion } from '../services/evaluacionServices.js';

export async function postCrearEvaluacion(req,res){
  const [data, err] = await crearEvaluacion(req.body);
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, data, 'Evaluación creada', 201);
}
export async function getEvaluaciones(req,res){
  const filtros = { ...req.query };
  // si el rol es estudiante, forzar su propio jugadorId (si lo tienes en req.user)
  if (req.user?.rol === 'estudiante' && req.user?.jugadorId) filtros.jugadorId = req.user.jugadorId;
  const [data, err] = await obtenerEvaluaciones(filtros);
  if (err) return error(res, err);
  return success(res, data, 'Evaluaciones obtenidas');
}
export async function getEvaluacionPorId(req,res){
  const [data, err] = await obtenerEvaluacionPorId(parseInt(req.params.id));
  if (err) return notFound(res, err);
  return success(res, data, 'Evaluación encontrada');
}
export async function patchEvaluacion(req,res){
  const { id, ...payload } = req.body;
  const [data, err] = await actualizarEvaluacion(id, payload);
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, data, 'Evaluación actualizada');
}
export async function deleteEvaluacion(req,res){
  const [ok, err] = await eliminarEvaluacion(parseInt(req.params.id));
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, { eliminado: !!ok }, 'Evaluación eliminada');
}
export async function getEvaluacionesPorJugador(req, res) {
  const jugadorId = parseInt(req.params.jugadorId, 10);
  const { pagina = 1, limite = 10, desde, hasta, sesionId } = req.query;

  const [data, err] = await obtenerEvaluaciones({ pagina, limite, jugadorId, desde, hasta, sesionId });
  if (err) return error(res, err);
  return success(res, data, 'Evaluaciones del jugador obtenidas');
}

// GET /evaluaciones/mias (estudiante)
export async function getMisEvaluaciones(req, res) {
  // attachJugadorId ya puso req.user.jugadorId
  const jugadorId = req.user.jugadorId;
  const { pagina = 1, limite = 10, desde, hasta, sesionId } = req.query;

  const [data, err] = await obtenerEvaluaciones({ pagina, limite, jugadorId, desde, hasta, sesionId });
  if (err) return error(res, err);
  return success(res, data, 'Tus evaluaciones');
}