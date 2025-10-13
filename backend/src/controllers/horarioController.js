import { obtenerDisponibilidadPorFecha,obtenerDisponibilidadPorRango,verificarDisponibilidadEspecifica } from "../services/horarioServices.js";
import { success, error, conflict, unauthorized, forbidden, notFound } from '../utils/responseHandler.js';


export async function getDisponibilidadPorFecha(req, res) {
  try {
    const { fecha } = req.body;

    if (!fecha) {
      // Usamos error(...) con 400 y un detalle en errors
      return error(res, 'Parámetros inválidos', 400, { fecha: 'requerida (YYYY-MM-DD)' });
    }

    const [data, err] = await obtenerDisponibilidadPorFecha(fecha);

    if (err) {
      // si el service retorna un mensaje de validación (ej. rango de fechas), respondemos 400
      return error(res, err, 400);
    }

    // si no hay canchas, success con arreglo vacío 
    return success(res, data, 'Disponibilidad por fecha');
  } catch (e) {
    console.error('getDisponibilidadPorFecha:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function getDisponibilidadPorRango(req, res) {
  try {
    const { inicio, fin } = req.body;

    const errores = {};
    if (!inicio) errores.inicio = 'requerido (YYYY-MM-DD)';
    if (!fin) errores.fin = 'requerido (YYYY-MM-DD)';
    if (Object.keys(errores).length) {
      return error(res, 'Parámetros inválidos', 400, errores);
    }

    const [data, err] = await obtenerDisponibilidadPorRango(inicio, fin);

    if (err) {
      return error(res, err, 400);
    }

    return success(res, data, 'Disponibilidad por rango');
  } catch (e) {
    console.error('getDisponibilidadPorRango:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function getVerificarDisponibilidad(req, res) {
  try {
    const { canchaId, fecha, inicio, fin } = req.body;

    const errores = {};
    if (!canchaId) errores.canchaId = 'requerido (número)';
    if (!fecha) errores.fecha = 'requerida (YYYY-MM-DD)';
    if (!inicio) errores.inicio = 'requerida (HH:mm)';
    if (!fin) errores.fin = 'requerida (HH:mm)';
    if (Object.keys(errores).length) {
      return error(res, 'Parámetros inválidos', 400, errores);
    }

    const canchaIdNum = Number(canchaId);
    if (Number.isNaN(canchaIdNum)) {
      return error(res, 'Parámetros inválidos', 400, { canchaId: 'debe ser numérico' });
    }

    const [ok, err] = await verificarDisponibilidadEspecifica(
      canchaIdNum,
      fecha,
      inicio,
      fin
    );

    if (!ok) {
      // Choque de horario, fuera de rango, etc. 409 es razonable
      return conflict(res, err);
    }

    return success(res, { disponible: true }, 'Horario disponible');
  } catch (e) {
    console.error('getVerificarDisponibilidad:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}
