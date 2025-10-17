import { 
  obtenerDisponibilidadPorFecha, 
  obtenerDisponibilidadPorRango,
  verificarDisponibilidadEspecifica 
} from '../services/horarioServices.js';

export async function getDisponibilidadPorFecha(req, res) {
  try {
    const { fecha } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!fecha) {
      return res.status(400).json({ message: 'Falta el parámetro fecha' });
    }

    const [resultado, error] = await obtenerDisponibilidadPorFecha(fecha, page, limit);
    
    if (error) {
      return res.status(500).json({ message: error });
    }

    return res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function getDisponibilidadPorRango(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: 'Faltan parámetros fechaInicio o fechaFin' });
    }

    const [resultado, error] = await obtenerDisponibilidadPorRango(fechaInicio, fechaFin, page, limit);
    
    if (error) {
      return res.status(500).json({ message: error });
    }

    return res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function verificarDisponibilidad(req, res) {
  try {
    const { canchaId, fecha, horaInicio, horaFin } = req.query;

    if (!canchaId || !fecha || !horaInicio || !horaFin) {
      return res.status(400).json({ message: 'Faltan parámetros requeridos' });
    }

    const [disponible, mensaje] = await verificarDisponibilidadEspecifica(
      parseInt(canchaId), 
      fecha, 
      horaInicio, 
      horaFin
    );

    if (!disponible) {
      return res.status(409).json({ disponible: false, message: mensaje });
    }

    return res.status(200).json({ disponible: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}