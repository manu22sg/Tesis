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
  try {
    
    const filtros = {
      nombre: req.query.nombre || undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20
    };


    const [result, err] = await obtenerTodosGrupos(filtros);
    
    if (err) {
      console.error('❌ Controller - Error del servicio:', err);
      return error(res, err, 500);
    }

    

    const { grupos, pagination } = result;
    const msg = grupos.length
      ? `${grupos.length} grupo(s) — Página ${pagination.currentPage}/${pagination.totalPages}`
      : 'No se encontraron grupos';


    // Devolver con la estructura correcta
    return res.status(200).json({
      success: true,
      message: msg,
      data: {
        grupos,
        pagination
      }
    });
  } catch (e) {
    console.error('💥 Controller - Exception:', e);
    return error(res, 'Error interno del servidor', 500);
  }
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

export async function obtenerMiembrosDeGrupoController(req, res) {
  const grupoId = parseInt(req.params.id);
  const { pagina, limite, estado, carrera, anioIngreso } = req.query;

  const [resultado, err] = await obtenerMiembrosDeGrupo(
    grupoId, pagina, limite, { estado, carrera, anioIngreso }
  );
  if (err) return error(res, err);
  return success(res, resultado, "Miembros obtenidos correctamente");
}

