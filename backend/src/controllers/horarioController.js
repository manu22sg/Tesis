import { 
  obtenerDisponibilidadPorFecha, 
  verificarDisponibilidadReserva as verificarReserva,
  verificarDisponibilidadSesion as verificarSesion
} from '../services/horarioServices.js';

/**
 * GET /api/horario/disponibilidad?fecha=2025-11-30&tipoUso=reserva
 * Consulta disponibilidad de canchas para una fecha
 */
export async function getDisponibilidadPorFecha(req, res) {
  try {
    const { fecha, canchaId, capacidad, tipoUso } = req.query;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!fecha) {
      return res.status(400).json({ message: 'Falta el parámetro fecha' });
    }

    const [resultado, error] = await obtenerDisponibilidadPorFecha(
      fecha,
      page,
      limit,
      { 
        canchaId: canchaId ? Number(canchaId) : undefined, 
        capacidad,
        tipoUso: tipoUso || 'reserva' // Por defecto 'reserva'
      }
    );

    if (error) {
      return res.status(500).json({ message: error });
    }

    return res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * GET /api/horario/disponibilidad/rango?fechaInicio=...&fechaFin=...&tipoUso=...
 * Consulta disponibilidad para un rango de fechas
 */

/**
 * GET /api/horario/verificar-reserva?canchaId=1&fecha=2025-11-30&inicio=08:00&fin=09:00
 * Verifica disponibilidad específica para RESERVAS
 */
export async function verificarDisponibilidadReserva(req, res) {
  try {
    const { canchaId, fecha, inicio, fin } = req.query;

    if (!canchaId || !fecha || !inicio || !fin) {
      return res.status(400).json({ 
        message: 'Faltan parámetros requeridos' 
      });
    }

    const [disponible, mensaje] = await verificarReserva(
      parseInt(canchaId), 
      fecha, 
      inicio, 
      fin
    );

    if (!disponible) {
      return res.status(409).json({ 
        disponible: false, 
        message: mensaje 
      });
    }

    return res.status(200).json({ disponible: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
}

/**
 * GET /api/horario/verificar-sesion?canchaId=1&fecha=2025-11-30&inicio=08:00&fin=10:00&sesionIdExcluir=5
 * Verifica disponibilidad específica para SESIONES
 */
export async function verificarDisponibilidadSesion(req, res) {
  try {
    const { canchaId, fecha, inicio, fin, sesionIdExcluir } = req.query;

    if (!canchaId || !fecha || !inicio || !fin) {
      return res.status(400).json({ 
        message: 'Faltan parámetros requeridos' 
      });
    }

    const [disponible, mensaje] = await verificarSesion(
      parseInt(canchaId), 
      fecha, 
      inicio, 
      fin,
      sesionIdExcluir ? parseInt(sesionIdExcluir) : null 
    );

    if (!disponible) {
      return res.status(409).json({ 
        disponible: false, 
        message: mensaje 
      });
    }

    return res.status(200).json({ disponible: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
}