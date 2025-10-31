import { success, error, notFound, conflict } from '../utils/responseHandler.js';
import {
  crearAlineacion,
  obtenerAlineacionPorSesion,
  agregarJugadorAlineacion,
  actualizarAlineacionJugador,
  quitarJugadorDeAlineacion,
  eliminarAlineacion,
  actualizarPosicionesJugadores
} from '../services/alineacionServices.js';

export async function postCrearAlineacion(req, res) {
  const [data, err] = await crearAlineacion(req.body);
  if (err) return error(res, err, err.includes('Ya existe') || err.includes('No se puede repetir') ? 409 : 400);
  return success(res, data, 'Alineación creada', 201);
}

export async function getAlineacionPorSesion(req, res) {
  const sesionId = parseInt(req.params.sesionId, 10);
  const [data, err] = await obtenerAlineacionPorSesion(sesionId);
  if (err) return notFound(res, err);
  return success(res, data, 'Alineación de la sesión');
}

export async function postAgregarJugador(req, res) {
  const [data, err] = await agregarJugadorAlineacion(req.body);
  if (err) return error(res, err, err.includes('ya está') ? 409 : 400);
  return success(res, data, 'Jugador agregado a la alineación', 201);
}

export async function patchAlineacionJugador(req, res) {
  const [data, err] = await actualizarAlineacionJugador(req.body);
  if (err) return error(res, err, err.includes('no encontrado') ? 404 : 400);
  return success(res, data, 'Registro de alineación actualizado');
}

export async function deleteAlineacionJugador(req, res) {
  const alineacionId = parseInt(req.params.alineacionId, 10);
  const jugadorId    = parseInt(req.params.jugadorId, 10);
  const [ok, err] = await quitarJugadorDeAlineacion(alineacionId, jugadorId);
  if (err) return error(res, err, err.includes('no encontrado') ? 404 : 400);
  return success(res, { eliminado: !!ok }, 'Jugador removido de la alineación');
}

export async function deleteAlineacion(req, res) {
  const id = parseInt(req.params.id, 10);
  const [ok, err] = await eliminarAlineacion(id);
  if (err) return error(res, err, err.includes('no encontrada') ? 404 : 400);
  return success(res, { eliminada: !!ok }, 'Alineación eliminada');
}

export async function patchActualizarPosiciones(req, res) {
  const { alineacionId, jugadores } = req.body;
  
  const [data, err] = await actualizarPosicionesJugadores(alineacionId, jugadores);
  if (err) return error(res, err, 400);
  return success(res, data, 'Posiciones actualizadas');
}
