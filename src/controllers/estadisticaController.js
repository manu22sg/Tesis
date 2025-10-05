import estadisticaService from '../services/estadisticaServices.js';

class EstadisticaController {
  async registrar(req, res) {
    try {
      const estadistica = await estadisticaService.registrarEstadistica(req.body);

      return res.status(201).json({
        mensaje: 'Estadística registrada exitosamente',
        data: estadistica,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async obtenerPorPartido(req, res) {
    try {
      const { partidoId } = req.params;
      const estadisticas = await estadisticaService.obtenerEstadisticasPorPartido(parseInt(partidoId));

      return res.status(200).json({
        data: estadisticas,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async obtenerPorJugador(req, res) {
    try {
      const { usuarioId, campeonatoId } = req.params;
      const estadisticas = await estadisticaService.obtenerEstadisticasPorJugador(
        parseInt(usuarioId),
        parseInt(campeonatoId)
      );

      return res.status(200).json({
        data: estadisticas,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async obtenerSanciones(req, res) {
    try {
      const { usuarioId, campeonatoId } = req.params;
      const sanciones = await estadisticaService.obtenerSancionesPorJugador(
        parseInt(usuarioId),
        parseInt(campeonatoId)
      );

      return res.status(200).json({
        data: sanciones,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async verificarSuspension(req, res) {
    try {
      const { usuarioId, partidoId } = req.params;
      const suspendido = await estadisticaService.verificarSuspension(
        parseInt(usuarioId),
        parseInt(partidoId)
      );

      return res.status(200).json({
        suspendido,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async marcarSancionCumplida(req, res) {
    try {
      const { sancionId } = req.params;
      const sancion = await estadisticaService.marcarSancionCumplida(parseInt(sancionId));

      return res.status(200).json({
        mensaje: 'Sanción marcada como cumplida',
        data: sancion,
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
      const estadistica = await estadisticaService.actualizarEstadistica(parseInt(id), req.body);

      return res.status(200).json({
        mensaje: 'Estadística actualizada exitosamente',
        data: estadistica,
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
      const resultado = await estadisticaService.eliminarEstadistica(parseInt(id));

      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }
}

export default new EstadisticaController();