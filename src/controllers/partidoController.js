import partidoService from '../services/partidoServices.js';
import { asignarFechaPartidoSchema, registrarResultadoSchema } from '../validations/partidoValidations.js';

class PartidoController {
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const partido = await partidoService.obtenerPartidoPorId(parseInt(id));

      return res.status(200).json({
        data: partido,
      });
    } catch (error) {
      return res.status(404).json({
        error: error.message,
      });
    }
  }

  async listarPorCampeonato(req, res) {
    try {
      const { campeonatoId } = req.params;
      const { fase, estado } = req.query;

      const partidos = await partidoService.obtenerPartidosPorCampeonato(
        parseInt(campeonatoId),
        { fase, estado }
      );

      return res.status(200).json({
        data: partidos,
        total: partidos.length,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async asignarFechaYCancha(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = asignarFechaPartidoSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          error: error.details[0].message,
        });
      }

      const partido = await partidoService.asignarFechaYCancha(parseInt(id), value);

      return res.status(200).json({
        mensaje: 'Fecha y cancha asignadas exitosamente',
        data: partido,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async registrarResultado(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = registrarResultadoSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          error: error.details[0].message,
        });
      }

      const partido = await partidoService.registrarResultado(parseInt(id), value);

      return res.status(200).json({
        mensaje: 'Resultado registrado exitosamente',
        data: partido,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const partido = await partidoService.actualizarPartido(parseInt(id), req.body);

      return res.status(200).json({
        mensaje: 'Partido actualizado exitosamente',
        data: partido,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }
}

export default new PartidoController();