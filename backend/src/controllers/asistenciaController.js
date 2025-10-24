import {
  actualizarAsistencia,
  eliminarAsistencia,
  listarAsistenciasDeSesion,
  marcarAsistenciaPorToken
} from "../services/asistenciaServices.js";
import { success, error } from "../utils/responseHandler.js";
import JugadorSchema from "../entity/Jugador.js";
import { AppDataSource } from '../config/config.db.js';

// ✅ ÚNICO método para marcar asistencia (por token en body)
export async function postMarcarAsistenciaPorToken(req, res) {
  try {
    const usuarioId = req.user.id;

    const jugadorRepo = AppDataSource.getRepository(JugadorSchema);
    const jugador = await jugadorRepo.findOne({ where: { usuarioId } });
    if (!jugador) return error(res, "Este usuario no tiene perfil de jugador", 400);

    const { token, estado, latitud, longitud, origen } = req.body;
    if (!token) return error(res, "Debe proporcionar un token válido", 400);

    const [resultado, err, status = 200] = await marcarAsistenciaPorToken({
      token,
      jugadorId: jugador.id,
      estado,
      latitud,
      longitud,
      origen,
    });

    if (err) return error(res, err, status);
    return success(res, resultado, "Asistencia registrada correctamente", status);
  } catch (e) {
    console.error("postMarcarAsistenciaPorToken:", e);
    return error(res, "Error interno del servidor", 500);
  }
}

export async function actualizarAsistenciaController(req, res) {
  const id = parseInt(req.params.id);
  const { estado, latitud, longitud, origen } = req.body;

  const [data, err, status] = await actualizarAsistencia(id, { estado, latitud, longitud, origen });
  if (err) return error(res, err, status || 400);
  return success(res, data, "Asistencia actualizada correctamente");
}

export async function eliminarAsistenciaController(req, res) {
  const id = parseInt(req.params.id);
  const [ok, err, status] = await eliminarAsistencia(id);
  if (err) return error(res, err, status || 400);
  return success(res, { removed: true }, "Asistencia eliminada correctamente");
}

export async function listarAsistenciasDeSesionController(req, res) {
  const sesionId = parseInt(req.params.id);
  const { pagina, limite, estado } = req.query;
  const [data, err, status] = await listarAsistenciasDeSesion(sesionId, { pagina, limite, estado });
  if (err) return error(res, err, status || 400);
  return success(res, data, "Asistencias obtenidas correctamente");
}