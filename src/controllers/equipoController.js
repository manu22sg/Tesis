import equipoService from '../services/equipoServices.js';
import { crearEquipoSchema, inscribirParticipantesSchema } from '../validations/equipoValidations.js';

class EquipoController {
  async crear(req, res) {
    try {
      const { error, value } = crearEquipoSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          error: error.details[0].message,
        });
      }

      const equipo = await equipoService.crearEquipo(value);

      return res.status(201).json({
        mensaje: 'Equipo creado exitosamente',
        data: equipo,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async listarPorCampeonato(req, res) {
    try {
      const { campeonatoId } = req.params;
      const equipos = await equipoService.obtenerEquiposPorCampeonato(parseInt(campeonatoId));

      return res.status(200).json({
        data: equipos,
        total: equipos.length,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const equipo = await equipoService.obtenerEquipoPorId(parseInt(id));

      return res.status(200).json({
        data: equipo,
      });
    } catch (error) {
      return res.status(404).json({
        error: error.message,
      });
    }
  }

  async inscribirParticipantes(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = inscribirParticipantesSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          error: error.details[0].message,
        });
      }

      const resultado = await equipoService.inscribirParticipantes(parseInt(id), value.ruts);

      return res.status(200).json({
        mensaje: `${resultado.total} participantes inscritos exitosamente`,
        ...resultado,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async asignarNumeroJugador(req, res) {
    try {
      const { id, usuarioId } = req.params;
      const { numeroJugador } = req.body;

      if (!numeroJugador || numeroJugador < 1) {
        return res.status(400).json({
          error: 'Número de jugador debe ser mayor a 0',
        });
      }

      const participante = await equipoService.asignarNumeroJugador(
        parseInt(id),
        parseInt(usuarioId),
        numeroJugador
      );

      return res.status(200).json({
        mensaje: 'Número asignado exitosamente',
        data: participante,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async removerParticipante(req, res) {
    try {
      const { id, usuarioId } = req.params;
      const resultado = await equipoService.removerParticipante(
        parseInt(id),
        parseInt(usuarioId)
      );

      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const equipo = await equipoService.actualizarEquipo(parseInt(id), req.body);

      return res.status(200).json({
        mensaje: 'Equipo actualizado exitosamente',
        data: equipo,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const resultado = await equipoService.eliminarEquipo(parseInt(id));

      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async obtenerEstadisticas(req, res) {
    try {
      const { id } = req.params;
      const estadisticas = await equipoService.obtenerEstadisticasEquipo(parseInt(id));

      return res.status(200).json({
        data: estadisticas,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }
}

export default new EquipoController();