import campeonatoService from '../services/campeonatoServices.js';
import { crearCampeonatoSchema, actualizarCampeonatoSchema } from '../validations/campeonatoValidations.js';

class CampeonatoController {
  async crear(req, res) {
    try {
      const { error, value } = crearCampeonatoSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          error: error.details[0].message,
        });
      }

      const campeonato = await campeonatoService.crearCampeonato(value);
      
      return res.status(201).json({
        mensaje: 'Campeonato creado exitosamente',
        data: campeonato,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async listar(req, res) {
    try {
      const { estado, modalidad, activos } = req.query;
      
      const campeonatos = await campeonatoService.obtenerCampeonatos({
        estado,
        modalidad,
        activos: activos === 'true',
      });

      return res.status(200).json({
        data: campeonatos,
        total: campeonatos.length,
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
      const campeonato = await campeonatoService.obtenerCampeonatoPorId(parseInt(id));

      return res.status(200).json({
        data: campeonato,
      });
    } catch (error) {
      return res.status(404).json({
        error: error.message,
      });
    }
  }

  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = actualizarCampeonatoSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          error: error.details[0].message,
        });
      }

      const campeonato = await campeonatoService.actualizarCampeonato(parseInt(id), value);

      return res.status(200).json({
        mensaje: 'Campeonato actualizado exitosamente',
        data: campeonato,
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
      const resultado = await campeonatoService.eliminarCampeonato(parseInt(id));

      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async generarFixture(req, res) {
    try {
      const { id } = req.params;
      const resultado = await campeonatoService.generarFixture(parseInt(id));

      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }

  async obtenerFixture(req, res) {
    try {
      const { id } = req.params;
      const fixture = await campeonatoService.obtenerFixture(parseInt(id));

      return res.status(200).json({
        data: fixture,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }

  async obtenerEstadisticas(req, res) {
    try {
      const { id } = req.params;
      const estadisticas = await campeonatoService.obtenerEstadisticasCampeonato(parseInt(id));

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

export default new CampeonatoController();