import {
  registrarEquipo, actualizarEquipo, eliminarEquipo,
  listarEquiposPorCampeonato,
  insertarUsuarioEnEquipo, quitarUsuarioDelEquipo, listarJugadoresPorEquipo
} from "../services/equipoServices.js";
import { success, error, notFound } from "../utils/responseHandler.js";

export const postEquipo = async (req, res) => {
  try { res.status(201).json(await registrarEquipo(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
};

export const putEquipo = async (req, res) => {
  try { res.json(await actualizarEquipo(req.params.equipoId, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
};

export const deleteEquipo = async (req, res) => {
  try { res.json(await eliminarEquipo(req.params.equipoId)); }
  catch (e) { res.status(400).json({ error: e.message }); }
};

export const getEquiposDeCampeonato = async (req, res) => {
  try { res.json(await listarEquiposPorCampeonato(req.params.campeonatoId)); }
  catch (e) { res.status(400).json({ error: e.message }); }
};

export const postAgregarUsuarioAEquipo = async (req, res) => {
  try {
    const { campeonatoId, equipoId, usuarioId, numeroCamiseta, posicion } = req.body;
    res.status(201).json(await insertarUsuarioEnEquipo({ campeonatoId, equipoId, usuarioId, numeroCamiseta, posicion }));
  } catch (e) { res.status(400).json({ error: e.message }); }
};

export const deleteUsuarioDeEquipo = async (req, res) => {
  try {
    const { campeonatoId, equipoId, usuarioId } = req.params;
    res.json(await quitarUsuarioDelEquipo({ campeonatoId, equipoId, usuarioId }));
  } catch (e) { res.status(400).json({ error: e.message }); }
};

export const listarJugadoresEquipo = async (req, res) => {
  try {
    const equipoId = Number(req.params.id);
    const data = await listarJugadoresPorEquipo(equipoId);
    return success(res, data, "Jugadores del equipo obtenidos correctamente");
  } catch (err) {
    if (err.message.includes("no encontrado")) return notFound(res, err.message);
    return error(res, err.message);
  }
};

