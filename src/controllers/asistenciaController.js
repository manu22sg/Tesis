import {
  marcarAsistencia,
  actualizarAsistencia,
  eliminarAsistencia,
  listarAsistenciasDeSesion
} from "../services/asistenciaServices.js";
import { success, error } from "../utils/responseHandler.js";

export async function marcarAsistenciaController(req, res) {
  const sesionId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(sesionId)) return error(res, 'Sesión inválida', 400);

  const jugadorId = req.user?.jugadorId;
  if (!jugadorId) return error(res, 'El usuario no tiene jugador asociado', 403);

  const { token, estado, latitud, longitud, origen } = req.body;
  const [data, err, status] = await marcarAsistencia({ sesionId, jugadorId, token, estado, latitud, longitud, origen });

  if (err) return error(res, err, status || 400);
  return success(res, data, "Asistencia registrada correctamente", 201);
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
