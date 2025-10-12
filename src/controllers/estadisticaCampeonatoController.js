import * as service from "../services/estadisticaCampeonatoServices.js";
import { success, error, notFound, conflict } from "../utils/responseHandler.js";

export const crearEstadistica = async (req, res) => {
  try {
    const data = await service.crearEstadistica(req.body);
    return success(res, data, "Estadística creada correctamente");
  } catch (err) {
    if (err.message.includes("duplicadas") || err.message.includes("ya tiene")) {
      return conflict(res, err.message);
    }
    return error(res, err.message, 400);
  }
};

export const actualizarEstadistica = async (req, res) => {
  try {
    const data = await service.actualizarEstadistica(Number(req.params.id), req.body);
    if (!data) return notFound(res, "Estadística no encontrada");
    return success(res, data, "Estadística actualizada correctamente");
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const listarEstadisticas = async (req, res) => {
  try {
    const data = await service.listarEstadisticas(req.query);
    return success(res, data, "Listado de estadísticas");
  } catch (err) {
    return error(res, err.message);
  }
};

export const eliminarEstadistica = async (req, res) => {
  try {
    const data = await service.eliminarEstadistica(Number(req.params.id));
    return success(res, data, "Estadística eliminada correctamente");
  } catch (err) {
    if (err.message.includes("no encontrada")) return notFound(res, err.message);
    return error(res, err.message);
  }
};

export const obtenerEstadisticaPorId = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await service.obtenerEstadisticaPorId(id);
    if (!data) return notFound(res, "Estadística no encontrada");
    return success(res, data, "Estadística obtenida correctamente");
  } catch (err) {
    console.error("Error obteniendo estadística:", err);
    return error(res, err.message, 400);
  }
};

export const getEstadisticasPorJugadorCampeonato = async (req, res) => {
  try {
    const { jugadorCampId, campId } = req.params;
    const data = await service.obtenerEstadisticasPorJugadorCampeonatoId(
      Number(jugadorCampId),
      Number(campId)
    );

    if (!data) return notFound(res, "No se encontraron estadísticas para este jugador");
    return success(res, data, "Estadísticas obtenidas correctamente");
  } catch (err) {
    return error(res, err.message);
  }
};


export const getEstadisticasPorUsuarioEnCampeonato = async (req, res) => {
  try {
    const { usuarioId, campId } = req.params;
    const data = await service.obtenerEstadisticasJugadorCampeonato(
      Number(usuarioId),
      Number(campId)
    );

    if (!data) return notFound(res, "No se encontraron estadísticas para este jugador en el campeonato");
    return success(res, data, "Estadísticas obtenidas correctamente");
  } catch (err) {
    return error(res, err.message);
  }
};

