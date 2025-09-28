// controllers/reservaController.js
import {
  crearReserva,
  obtenerReservasUsuario,
  obtenerTodasLasReservas,
  obtenerReservaPorId
} from '../services/reservaServices.js';
import { success, error, notFound, conflict } from '../utils/responseHandler.js';

export async function postCrearReserva(req, res) {
  try {
    const datosReserva = req.body;
    const usuarioId = req.user?.id; // viene del auth
    const [reserva, err] = await crearReserva(datosReserva, usuarioId);
    if (err) {
      if (err.includes('Conflicto') ||
          err.includes('Ya existe una reserva') ||
          err.includes('no están registrados') ||
          err.includes('Se requieren exactamente') ||
          err.includes('No se pueden repetir')) {
        return conflict(res, err);
      }
      if (err.includes('inexistente') || err.includes('no disponible')) {
        return error(res, err, 400);
      }
      return error(res, err, 500);
    }
    return success(res, reserva, 'Reserva creada exitosamente. Esperando aprobación del entrenador.', 201);
  } catch (e) {
    console.error('postCrearReserva:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function getReservasUsuario(req, res) {
  try {
    const filtros = req.query;          // ⬅️ query
    const usuarioId = req.user?.id;
    const [result, err] = await obtenerReservasUsuario(usuarioId, filtros);
    if (err) return error(res, err, 500);

    const { reservas, pagination } = result;
    const mensaje = reservas.length > 0
      ? `${reservas.length} reserva(s) encontrada(s) - Página ${pagination.currentPage} de ${pagination.totalPages}`
      : 'No tienes reservas registradas';

    return success(res, { reservas, pagination }, mensaje);
  } catch (e) {
    console.error('getReservasUsuario:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function getTodasLasReservas(req, res) {
  try {
    const filtros = req.query;          // ⬅️ query
    const [result, err] = await obtenerTodasLasReservas(filtros);
    if (err) return error(res, err, 500);

    const { reservas, pagination } = result;
    const mensaje = reservas.length > 0
      ? `${reservas.length} reserva(s) encontrada(s) - Página ${pagination.currentPage} de ${pagination.totalPages}`
      : 'No se encontraron reservas';

    return success(res, { reservas, pagination }, mensaje);
  } catch (e) {
    console.error('getTodasLasReservas:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function getReservaPorId(req, res) {
  try {
    const { id } = req.body;
    const [reserva, err] = await obtenerReservaPorId(id);
    if (err) {
      if (err === 'Reserva no encontrada') return notFound(res, err);
      return error(res, err, 500);
    }
    return success(res, reserva, 'Reserva encontrada');
  } catch (e) {
    console.error('getReservaPorId:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}
