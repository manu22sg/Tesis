import { success, error, notFound } from '../utils/responseHandler.js';
import {
  upsertEstadistica,
  obtenerEstadisticasPorJugador,
  obtenerEstadisticasPorSesion,
  obtenerEstadisticaPorId,
  eliminarEstadistica
} from '../services/estadisticaServices.js';

export async function postUpsertEstadistica(req,res){
  const [data, err] = await upsertEstadistica(req.body);
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, data, 'Estadística guardada', 201);
}

export async function getEstadisticasPorJugador(req,res){
  const jugadorId = parseInt(req.params.jugadorId,10);
  const { pagina=1, limite=10 } = req.query;
  // regla estudiante: solo sus propias “mías”
  if (req.user?.rol === 'estudiante' && req.user?.jugadorId !== jugadorId) {
    return error(res,'No tienes permiso para ver estadísticas de otro jugador',403);
  }
  const [data, err] = await obtenerEstadisticasPorJugador({ jugadorId, pagina, limite });
  if (err) return error(res, err);
  return success(res, data, 'Estadísticas por jugador');
}

export async function getMisEstadisticas(req,res){
  // attachJugadorId debe haber corrido para estudiantes
  const jugadorId = req.user?.jugadorId;
  const { pagina=1, limite=10 } = req.query;
  const [data, err] = await obtenerEstadisticasPorJugador({ jugadorId, pagina, limite });
  if (err) return error(res, err);
  return success(res, data, 'Mis estadísticas');
}

export async function getEstadisticasPorSesion(req,res){
  const sesionId = parseInt(req.params.sesionId,10);
  const { pagina=1, limite=10 } = req.query;
  const [data, err] = await obtenerEstadisticasPorSesion({ sesionId, pagina, limite });
  if (err) return error(res, err);
  return success(res, data, 'Estadísticas por sesión');
}

export async function getEstadisticaPorId(req,res){
  const id = parseInt(req.params.id,10);
  const [data, err] = await obtenerEstadisticaPorId(id);
  if (err) return notFound(res, err);
  return success(res, data, 'Estadística encontrada');
}

export async function deleteEstadistica(req,res){
  const id = parseInt(req.params.id,10);
  const [ok, err] = await eliminarEstadistica(id);
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, { eliminado: !!ok }, 'Estadística eliminada');
}
