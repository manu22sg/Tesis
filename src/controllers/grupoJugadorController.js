import {
  crearGrupo,
  obtenerTodosGrupos,
  obtenerGrupoPorId,
  actualizarGrupo,
  eliminarGrupo,
  // obtenerMiembrosDeGrupo
} from "../services/grupoJugadorServices.js";
import { success, error } from "../utils/responseHandler.js";

export async function crearGrupoController(req, res) {
  const [grupo, err] = await crearGrupo(req.body);
  if (err) return error(res, err);
  return success(res, grupo, "Grupo creado correctamente");
}

export async function obtenerTodosGruposController(req, res) {
  const [grupos, err] = await obtenerTodosGrupos();
  if (err) return error(res, err);
  return success(res, grupos, "Grupos obtenidos correctamente");
}

export async function obtenerGrupoPorIdController(req, res) {
  const [grupo, err] = await obtenerGrupoPorId(parseInt(req.params.id));
  if (err) return error(res, err);
  return success(res, grupo, "Grupo obtenido correctamente");
}

export async function actualizarGrupoController(req, res) {
  const [grupo, err] = await actualizarGrupo(parseInt(req.params.id), req.body);
  if (err) return error(res, err);
  return success(res, grupo, "Grupo actualizado correctamente");
}

export async function eliminarGrupoController(req, res) {
  const [ok, err] = await eliminarGrupo(parseInt(req.params.id));
  if (err) return error(res, err);
  return success(res, ok, "Grupo eliminado correctamente");
}

/*
export async function obtenerMiembrosDeGrupoController(req, res) {
  const grupoId = parseInt(req.params.id);
  const { pagina, limite, estado, carrera, anioIngreso } = req.query;

  const [resultado, err] = await obtenerMiembrosDeGrupo(
    grupoId, pagina, limite, { estado, carrera, anioIngreso }
  );
  if (err) return error(res, err);
  return success(res, resultado, "Miembros obtenidos correctamente");
}

*/