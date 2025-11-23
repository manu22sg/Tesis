import {
  buscarJugadoresCampeonato,
  obtenerPerfilJugadorCampeonato,
  obtenerEstadisticasDetalladas
} from '../services/jugadorCampeonatoServices.js';

/**
 * GET /api/ojeador
 * Buscar jugadores que participaron en campeonatos
 */
export async function buscarJugadoresController(req, res) {
  try {
    const { q, carreraId, anio, pagina, limite } = req.query;

    const filtros = {
      q: q || '',
      carreraId: carreraId ? Number(carreraId) : undefined,
      anio: anio ? Number(anio) : undefined,
      pagina: pagina ? Number(pagina) : 1,
      limite: limite ? Number(limite) : 20
    };

    const [resultado, error] = await buscarJugadoresCampeonato(filtros);

    if (error) {
      return res.status(500).json({ message: error });
    }

    return res.status(200).json({
      success: true,
      ...resultado
    });

  } catch (error) {
    console.error('Error en buscarJugadoresController:', error);
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
}

/**
 * GET /api/ojeador/:usuarioId
 * Obtener perfil completo de un jugador con su historial
 */
export async function obtenerPerfilController(req, res) {
  try {
    const { usuarioId } = req.params;

    if (!usuarioId || isNaN(Number(usuarioId))) {
      return res.status(400).json({
        message: 'ID de usuario inválido'
      });
    }

    const [perfil, error] = await obtenerPerfilJugadorCampeonato(Number(usuarioId));

    if (error) {
      const status = error === 'Usuario no encontrado' ? 404 : 500;
      return res.status(status).json({ message: error });
    }

    return res.status(200).json({
      success: true,
      data: perfil
    });

  } catch (error) {
    console.error('Error en obtenerPerfilController:', error);
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
}

/**
 * GET /api/ojeador/:usuarioId/campeonato/:campeonatoId
 * Obtener estadísticas detalladas partido por partido
 */
export async function obtenerEstadisticasDetalladasController(req, res) {
  try {
    const { usuarioId, campeonatoId } = req.params;

    if (!usuarioId || isNaN(Number(usuarioId))) {
      return res.status(400).json({
        message: 'ID de usuario inválido'
      });
    }

    if (!campeonatoId || isNaN(Number(campeonatoId))) {
      return res.status(400).json({
        message: 'ID de campeonato inválido'
      });
    }

    const [estadisticas, error] = await obtenerEstadisticasDetalladas(
      Number(usuarioId),
      Number(campeonatoId)
    );

    if (error) {
      const status = error.includes('no participó') ? 404 : 500;
      return res.status(status).json({ message: error });
    }

    return res.status(200).json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('Error en obtenerEstadisticasDetalladasController:', error);
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
}