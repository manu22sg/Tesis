import { AppDataSource } from '../config/config.db.js';
import { obtenerConfiguracionFormato, ESTADOS_CAMPEONATO } from '../utils/campeonatoHelper.js';

const equipoRepository = AppDataSource.getRepository('Equipo');
const campeonatoRepository = AppDataSource.getRepository('Campeonato');
const usuarioRepository = AppDataSource.getRepository('Usuario');
const participanteRepository = AppDataSource.getRepository('ParticipanteEquipo');

class EquipoService {
  async crearEquipo(data) {
    // Validar que el campeonato existe y está en estado válido
    const campeonato = await campeonatoRepository.findOne({
      where: { id: data.campeonatoId },
    });

    if (!campeonato) {
      throw new Error('Campeonato no encontrado');
    }

    if (![ESTADOS_CAMPEONATO.PLANIFICACION, ESTADOS_CAMPEONATO.INSCRIPCION].includes(campeonato.estado)) {
      throw new Error('El campeonato no está aceptando nuevos equipos');
    }

    // Verificar que no exista un equipo con el mismo nombre en el campeonato
    const equipoExistente = await equipoRepository.findOne({
      where: {
        nombre: data.nombre,
        campeonatoId: data.campeonatoId,
      },
    });

    if (equipoExistente) {
      throw new Error('Ya existe un equipo con ese nombre en el campeonato');
    }

    const equipo = equipoRepository.create(data);
    return await equipoRepository.save(equipo);
  }

  async obtenerEquiposPorCampeonato(campeonatoId) {
    return await equipoRepository.find({
      where: { campeonatoId },
      relations: ['participantes', 'participantes.usuario', 'capitan'],
    });
  }

  async obtenerEquipoPorId(id) {
    const equipo = await equipoRepository.findOne({
      where: { id },
      relations: ['participantes', 'participantes.usuario', 'campeonato', 'capitan'],
    });

    if (!equipo) {
      throw new Error('Equipo no encontrado');
    }

    return equipo;
  }

  async inscribirParticipantes(equipoId, ruts) {
    const equipo = await this.obtenerEquipoPorId(equipoId);

    // Validar que el campeonato permite inscripciones
    if (![ESTADOS_CAMPEONATO.PLANIFICACION, ESTADOS_CAMPEONATO.INSCRIPCION].includes(equipo.campeonato.estado)) {
      throw new Error('El campeonato no está aceptando nuevos participantes');
    }

    const participantesCreados = [];
    const errores = [];

    for (const rut of ruts) {
      try {
        // Buscar usuario por RUT
        const usuario = await usuarioRepository.findOne({ where: { rut } });

        if (!usuario) {
          errores.push({ rut, error: 'Usuario no encontrado' });
          continue;
        }

        // Verificar que no esté en otro equipo del mismo campeonato
        const yaInscrito = await participanteRepository.findOne({
          where: {
            usuarioId: usuario.id,
            equipo: { campeonatoId: equipo.campeonatoId },
          },
          relations: ['equipo'],
        });

        if (yaInscrito) {
          errores.push({ 
            rut, 
            error: `Ya está inscrito en el equipo "${yaInscrito.equipo.nombre}"` 
          });
          continue;
        }

        // Crear participante
        const participante = participanteRepository.create({
          usuarioId: usuario.id,
          equipoId: equipo.id,
        });

        await participanteRepository.save(participante);
        participantesCreados.push({ rut, nombre: usuario.nombre });

      } catch (error) {
        errores.push({ rut, error: error.message });
      }
    }

    return {
      exitosos: participantesCreados,
      errores,
      total: participantesCreados.length,
    };
  }

  async asignarNumeroJugador(equipoId, usuarioId, numeroJugador) {
    const participante = await participanteRepository.findOne({
      where: { equipoId, usuarioId },
    });

    if (!participante) {
      throw new Error('Participante no encontrado en este equipo');
    }

    // Verificar que el número no esté ocupado
    const numeroOcupado = await participanteRepository.findOne({
      where: { equipoId, numeroJugador },
    });

    if (numeroOcupado && numeroOcupado.usuarioId !== usuarioId) {
      throw new Error(`El número ${numeroJugador} ya está asignado a otro jugador`);
    }

    participante.numeroJugador = numeroJugador;
    return await participanteRepository.save(participante);
  }

  async removerParticipante(equipoId, usuarioId) {
    const equipo = await this.obtenerEquipoPorId(equipoId);

    if (equipo.campeonato.estado === ESTADOS_CAMPEONATO.EN_CURSO) {
      throw new Error('No se pueden remover participantes de un campeonato en curso');
    }

    const resultado = await participanteRepository.delete({ equipoId, usuarioId });

    if (resultado.affected === 0) {
      throw new Error('Participante no encontrado en este equipo');
    }

    return { mensaje: 'Participante removido exitosamente' };
  }

  async actualizarEquipo(id, data) {
    const equipo = await this.obtenerEquipoPorId(id);

    // No permitir cambios si el campeonato ya inició
    if (equipo.campeonato.estado === ESTADOS_CAMPEONATO.EN_CURSO && 
        (data.nombre || data.carrera)) {
      throw new Error('No se puede modificar información del equipo durante el campeonato');
    }

    Object.assign(equipo, data);
    return await equipoRepository.save(equipo);
  }

  async eliminarEquipo(id) {
    const equipo = await this.obtenerEquipoPorId(id);

    if (equipo.campeonato.estado !== ESTADOS_CAMPEONATO.PLANIFICACION) {
      throw new Error('Solo se pueden eliminar equipos en etapa de planificación');
    }

    await equipoRepository.remove(equipo);
    return { mensaje: 'Equipo eliminado exitosamente' };
  }

  async obtenerEstadisticasEquipo(equipoId) {
    const estadisticas = await AppDataSource.query(`
      SELECT 
        u.nombre,
        u.rut,
        pe.numeroJugador,
        pe.posicion,
        SUM(ec.goles) as goles,
        SUM(ec.asistencias) as asistencias,
        SUM(ec.tarjetasAmarillas) as tarjetas_amarillas,
        SUM(ec.tarjetasRojas) as tarjetas_rojas,
        SUM(ec.minutosJugados) as minutos_jugados,
        COUNT(DISTINCT ec.partidoId) as partidos_jugados
      FROM participante_equipo pe
      INNER JOIN usuarios u ON pe.usuarioId = u.id
      LEFT JOIN estadisticas_campeonato ec ON ec.usuarioId = u.id AND ec.equipoId = pe.equipoId
      WHERE pe.equipoId = $1
      GROUP BY u.id, u.nombre, u.rut, pe.numeroJugador, pe.posicion
      ORDER BY goles DESC, asistencias DESC
    `, [equipoId]);

    return estadisticas;
  }
}

export default new EquipoService();