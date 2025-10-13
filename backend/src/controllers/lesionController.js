import { success, error, notFound } from '../utils/responseHandler.js';
import { crearLesion, obtenerLesiones, obtenerLesionPorId, actualizarLesion, eliminarLesion } from '../services/lesionServices.js';

export async function postCrearLesion(req,res){
  const [data, err] = await crearLesion(req.body);
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, data, 'Lesión registrada', 201);
}
export async function getLesiones(req,res){
  const filtros = { ...req.query };
  if (req.user?.rol === 'estudiante' && req.user?.jugadorId) filtros.jugadorId = req.user.jugadorId;
  const [data, err] = await obtenerLesiones(filtros);
  if (err) return error(res, err);
  return success(res, data, 'Lesiones obtenidas');
}
export async function getLesionPorId(req,res){
  const [data, err] = await obtenerLesionPorId(parseInt(req.params.id));
  if (err) return notFound(res, err);
  return success(res, data, 'Lesión encontrada');
}
export async function patchLesion(req,res){
  const { id, ...payload } = req.body;
  const [data, err] = await actualizarLesion(id, payload);
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, data, 'Lesión actualizada');
}
export async function deleteLesion(req,res){
  const [ok, err] = await eliminarLesion(parseInt(req.params.id));
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, { eliminado: !!ok }, 'Lesión eliminada');
}

export async function getLesionesPorJugador(req, res) {
  const jugadorId = parseInt(req.params.id, 10);
  const { pagina = 1, limite = 10, desde, hasta } = req.query;

  // Si es estudiante, solo puede ver sus propias lesiones
  if (req.user?.rol === 'estudiante' && req.user?.jugadorId !== jugadorId) {
    return error(res, 'No tienes permiso para ver lesiones de otro jugador', 403);
  }

  const [data, err] = await obtenerLesiones({ pagina, limite, jugadorId, desde, hasta });
  if (err) return error(res, err);
  return success(res, data, 'Lesiones del jugador obtenidas');
}
