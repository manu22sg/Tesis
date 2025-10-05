import { AppDataSource } from '../config/config.db.js';

const estadisticaRepository = AppDataSource.getRepository('EstadisticaCampeonato');
const participanteRepository = AppDataSource.getRepository('ParticipanteEquipo');
const partidoRepository = AppDataSource.getRepository('Partido');
const sancionRepository = AppDataSource.getRepository('Sancion');

class EstadisticaService {
  async registrarEstadistica(data) {
    const { partidoId, usuarioId, equipoId } = data;

    // Validar que el partido existe y está finalizado
    const partido = await partidoRepository.findOne({
      where: { id: partidoId },
      relations: ['campeonato'],
    });

    if (!partido) {
      throw new Error('Partido no encontrado');
    }

    // Validar que el usuario es participante del equipo
    const participante = await participanteRepository.findOne({
      where: { usuarioId, equipoId },
    });

    if (!participante) {
      throw new Error('El usuario no es participante de este equipo');
    }

    // Validar que el equipo jugó este partido
    if (partido.equipo1Id !== equipoId && partido.equipo2Id !== equipoId) {
      throw new Error('El equipo no participó en este partido');
    }

    // Crear o actualizar estadística
    let estadistica = await estadisticaRepository.findOne({
      where: { partidoId, usuarioId, equipoId },
    });

    if (estadistica) {
      Object.assign(estadistica, data);
    } else {
      estadistica = estadisticaRepository.create(data);
    }

    const estadisticaGuardada = await estadisticaRepository.save(estadistica);

    // Verificar si hay que crear sanciones por tarjetas
    if (data.tarjetasRojas > 0) {
      await this.crearSancion({
        usuarioId,
        partidoId,
        campeonatoId: partido.campeonatoId,
        tipo: 'tarjeta_roja',
        partidosSuspension: 1,
      });
    }

    // Verificar acumulación de amarillas (2 amarillas = 1 partido)
    const amarillasAcumuladas = await this.contarTarjetasAmarillas(usuarioId, partido.campeonatoId);
    if (amarillasAcumuladas >= 2) {
      await this.crearSancion({
        usuarioId,
        partidoId,
        campeonatoId: partido.campeonatoId,
        tipo: 'doble_amarilla',
        partidosSuspension: 1,
      });
    }

    return estadisticaGuardada;
  }

  async contarTarjetasAmarillas(usuarioId, campeonatoId) {
    const result = await AppDataSource.query(`
      SELECT COALESCE(SUM(ec.tarjetasAmarillas), 0) as total
      FROM estadisticas_campeonato ec
      INNER JOIN partidos p ON ec.partidoId = p.id
      WHERE ec.usuarioId = $1 
        AND p.campeonatoId = $2
        AND p.estado = 'finalizado'
    `, [usuarioId, campeonatoId]);

    return parseInt(result[0].total);
  }

  async crearSancion(data) {
    // Verificar si ya existe una sanción por este partido
    const sancionExistente = await sancionRepository.findOne({
      where: {
        usuarioId: data.usuarioId,
        partidoId: data.partidoId,
        tipo: data.tipo,
      },
    });

    if (sancionExistente) {
      return sancionExistente;
    }

    const sancion = sancionRepository.create(data);
    return await sancionRepository.save(sancion);
  }

  async obtenerEstadisticasPorPartido(partidoId) {
    return await estadisticaRepository.find({
      where: { partidoId },
      relations: ['usuario', 'equipo'],
    });
  }

  async obtenerEstadisticasPorJugador(usuarioId, campeonatoId) {
    const estadisticas = await AppDataSource.query(`
      SELECT 
        p.fecha,
        p.fase,
        e.nombre as equipo,
        ec.goles,
        ec.asistencias,
        ec.tarjetasAmarillas,
        ec.tarjetasRojas,
        ec.minutosJugados
      FROM estadisticas_campeonato ec
      INNER JOIN partidos p ON ec.partidoId = p.id
      INNER JOIN equipos e ON ec.equipoId = e.id
      WHERE ec.usuarioId = $1 
        AND p.campeonatoId = $2
      ORDER BY p.fecha DESC
    `, [usuarioId, campeonatoId]);

    const totales = await AppDataSource.query(`
      SELECT 
        SUM(ec.goles) as total_goles,
        SUM(ec.asistencias) as total_asistencias,
        SUM(ec.tarjetasAmarillas) as total_amarillas,
        SUM(ec.tarjetasRojas) as total_rojas,
        SUM(ec.minutosJugados) as total_minutos,
        COUNT(DISTINCT ec.partidoId) as partidos_jugados
      FROM estadisticas_campeonato ec
      INNER JOIN partidos p ON ec.partidoId = p.id
      WHERE ec.usuarioId = $1 
        AND p.campeonatoId = $2
    `, [usuarioId, campeonatoId]);

    return {
      detalles: estadisticas,
      totales: totales[0],
    };
  }

  async obtenerSancionesPorJugador(usuarioId, campeonatoId) {
    return await sancionRepository.find({
      where: { usuarioId, campeonatoId },
      relations: ['partido'],
      order: { fechaRegistro: 'DESC' },
    });
  }

  async verificarSuspension(usuarioId, partidoId) {
    const partido = await partidoRepository.findOne({
      where: { id: partidoId },
    });

    const sanciones = await sancionRepository.find({
      where: {
        usuarioId,
        campeonatoId: partido.campeonatoId,
        cumplida: false,
      },
    });

    return sanciones.length > 0;
  }

  async marcarSancionCumplida(sancionId) {
    const sancion = await sancionRepository.findOne({
      where: { id: sancionId },
    });

    if (!sancion) {
      throw new Error('Sanción no encontrada');
    }

    sancion.cumplida = true;
    return await sancionRepository.save(sancion);
  }

  async actualizarEstadistica(id, data) {
    const estadistica = await estadisticaRepository.findOne({
      where: { id },
    });

    if (!estadistica) {
      throw new Error('Estadística no encontrada');
    }

    Object.assign(estadistica, data);
    return await estadisticaRepository.save(estadistica);
  }

  async eliminarEstadistica(id) {
    const resultado = await estadisticaRepository.delete(id);

    if (resultado.affected === 0) {
      throw new Error('Estadística no encontrada');
    }

    return { mensaje: 'Estadística eliminada exitosamente' };
  }
}

export default new EstadisticaService();