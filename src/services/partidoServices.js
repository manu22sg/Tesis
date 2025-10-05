import { AppDataSource } from '../config/config.db.js';
import { obtenerConfiguracionFormato, ESTADOS_PARTIDO, calcularSiguienteFase } from '../utils/campeonatoHelper.js';

const partidoRepository = AppDataSource.getRepository('Partido');
const equipoRepository = AppDataSource.getRepository('Equipo');
const canchaRepository = AppDataSource.getRepository('Cancha');
const campeonatoRepository = AppDataSource.getRepository('Campeonato');

class PartidoService {
  async obtenerPartidoPorId(id) {
    const partido = await partidoRepository.findOne({
      where: { id },
      relations: ['equipo1', 'equipo2', 'ganador', 'cancha', 'campeonato', 'estadisticas'],
    });

    if (!partido) {
      throw new Error('Partido no encontrado');
    }

    return partido;
  }

  async asignarFechaYCancha(partidoId, data) {
    const { fecha, horaInicio, horaFin, canchaId } = data;
    
    const partido = await this.obtenerPartidoPorId(partidoId);
    const cancha = await canchaRepository.findOne({ where: { id: canchaId } });

    if (!cancha) {
      throw new Error('Cancha no encontrada');
    }

    // Validar capacidad de la cancha
    const config = obtenerConfiguracionFormato(partido.campeonato.formatoJuego);
    if (cancha.capacidadMaxima < config.capacidadCancha) {
      throw new Error(
        `La cancha "${cancha.nombre}" (capacidad: ${cancha.capacidadMaxima}) no es suficiente para ${partido.campeonato.formatoJuego} (requiere: ${config.capacidadCancha})`
      );
    }

    // Validar conflictos de horario
    await this.validarDisponibilidadCancha(canchaId, fecha, horaInicio, horaFin, partidoId);

    // Asignar datos
    partido.fecha = fecha;
    partido.horaInicio = horaInicio;
    partido.horaFin = horaFin;
    partido.canchaId = canchaId;

    return await partidoRepository.save(partido);
  }

  async validarDisponibilidadCancha(canchaId, fecha, horaInicio, horaFin, partidoIdActual = null) {
    // Verificar conflicto con otros partidos
    const query = partidoRepository
      .createQueryBuilder('partido')
      .where('partido.canchaId = :canchaId', { canchaId })
      .andWhere('partido.fecha = :fecha', { fecha })
      .andWhere('partido.estado != :estadoCancelado', { estadoCancelado: 'cancelado' })
      .andWhere(
        '(partido.horaInicio < :horaFin AND partido.horaFin > :horaInicio)',
        { horaInicio, horaFin }
      );

    if (partidoIdActual) {
      query.andWhere('partido.id != :partidoIdActual', { partidoIdActual });
    }

    const conflicto = await query.getOne();

    if (conflicto) {
      throw new Error(
        `Conflicto de horario: La cancha ya está ocupada de ${conflicto.horaInicio} a ${conflicto.horaFin}`
      );
    }

    // TODO: Verificar conflictos con entrenamientos y reservas
    // Esto requiere consultar las tablas sesiones_entrenamiento y reservas_cancha
    
    return true;
  }

  async registrarResultado(partidoId, data) {
  const { golesEquipo1, golesEquipo2, penalesEquipo1, penalesEquipo2, ganadorId, observaciones } = data;
  
  const partido = await this.obtenerPartidoPorId(partidoId);

  // Validaciones
  if (partido.estado === ESTADOS_PARTIDO.FINALIZADO) {
    throw new Error('El partido ya fue finalizado');
  }

  if (!partido.equipo1Id || !partido.equipo2Id) {
    throw new Error('El partido no tiene equipos asignados');
  }

  if (ganadorId !== partido.equipo1Id && ganadorId !== partido.equipo2Id) {
    throw new Error('El ganador debe ser uno de los equipos del partido');
  }

  // 🔥 LÓGICA DE EMPATE Y PENALES
  const hayEmpate = golesEquipo1 === golesEquipo2;
  
  if (hayEmpate) {
    // Si hay empate, DEBE haber penales
    if (penalesEquipo1 === null || penalesEquipo1 === undefined || 
        penalesEquipo2 === null || penalesEquipo2 === undefined) {
      throw new Error('En caso de empate debe registrar el resultado de los penales');
    }

    // No puede haber empate en penales
    if (penalesEquipo1 === penalesEquipo2) {
      throw new Error('No puede haber empate en la tanda de penales');
    }

    // El ganador debe coincidir con quien ganó los penales
    const ganadorPenales = penalesEquipo1 > penalesEquipo2 ? partido.equipo1Id : partido.equipo2Id;
    if (ganadorId !== ganadorPenales) {
      throw new Error('El ganador debe ser el equipo que ganó la tanda de penales');
    }

    partido.definidoPorPenales = true;
    partido.penalesEquipo1 = penalesEquipo1;
    partido.penalesEquipo2 = penalesEquipo2;

  } else {
    // Si NO hay empate, validar que el ganador tenga más goles
    const golesGanador = ganadorId === partido.equipo1Id ? golesEquipo1 : golesEquipo2;
    const golesPerdedor = ganadorId === partido.equipo1Id ? golesEquipo2 : golesEquipo1;

    if (golesGanador <= golesPerdedor) {
      throw new Error('El ganador debe tener más goles que el perdedor');
    }

    // Si no hay empate, no debería haber penales registrados
    if (penalesEquipo1 || penalesEquipo2) {
      throw new Error('No se pueden registrar penales cuando hay un ganador en tiempo regular');
    }

    partido.definidoPorPenales = false;
    partido.penalesEquipo1 = null;
    partido.penalesEquipo2 = null;
  }

  // Registrar resultado
  partido.golesEquipo1 = golesEquipo1;
  partido.golesEquipo2 = golesEquipo2;
  partido.ganadorId = ganadorId;
  partido.estado = ESTADOS_PARTIDO.FINALIZADO;
  partido.observaciones = observaciones;

  await partidoRepository.save(partido);

  // Marcar equipo perdedor como eliminado
  const equipoPerdedor = ganadorId === partido.equipo1Id ? partido.equipo2 : partido.equipo1;
  equipoPerdedor.eliminado = true;
  await equipoRepository.save(equipoPerdedor);

  // Avanzar ganador al siguiente partido
  await this.avanzarGanadorASiguienteFase(partido);

  // Verificar si es la final
  if (partido.fase === 'final') {
    await this.finalizarCampeonato(partido.campeonatoId, ganadorId);
  }

  return partido;
}


  async avanzarGanadorASiguienteFase(partido) {
    const siguienteFase = calcularSiguienteFase(partido.fase);
    
    if (!siguienteFase) {
      return; // Ya es la final
    }

    // Encontrar el siguiente partido en la fase siguiente
    // Lógica: Los partidos 1 y 2 avanzan al partido siguiente (numeroPartido menor en siguiente fase)
    const siguientePartido = await partidoRepository
      .createQueryBuilder('partido')
      .where('partido.campeonatoId = :campeonatoId', { campeonatoId: partido.campeonatoId })
      .andWhere('partido.fase = :siguienteFase', { siguienteFase })
      .andWhere('(partido.equipo1Id IS NULL OR partido.equipo2Id IS NULL)')
      .orderBy('partido.numeroPartido', 'ASC')
      .getOne();

    if (siguientePartido) {
      if (!siguientePartido.equipo1Id) {
        siguientePartido.equipo1Id = partido.ganadorId;
      } else if (!siguientePartido.equipo2Id) {
        siguientePartido.equipo2Id = partido.ganadorId;
      }

      await partidoRepository.save(siguientePartido);
    }
  }

  async finalizarCampeonato(campeonatoId, ganadorId) {
    const campeonato = await campeonatoRepository.findOne({
      where: { id: campeonatoId },
    });

    campeonato.campeonId = ganadorId;
    campeonato.estado = 'finalizado';

    // Asignar posiciones finales
    const equipoGanador = await equipoRepository.findOne({ where: { id: ganadorId } });
    equipoGanador.posicionFinal = 1;
    await equipoRepository.save(equipoGanador);

    // Encontrar subcampeón (perdedor de la final)
    const partidoFinal = await partidoRepository.findOne({
      where: { campeonatoId, fase: 'final' },
    });

    const subcampeonId = partidoFinal.equipo1Id === ganadorId 
      ? partidoFinal.equipo2Id 
      : partidoFinal.equipo1Id;

    const subcampeon = await equipoRepository.findOne({ where: { id: subcampeonId } });
    subcampeon.posicionFinal = 2;
    await equipoRepository.save(subcampeon);

    // Asignar tercer lugar (perdedores de semifinal)
    const partidosSemifinal = await partidoRepository.find({
      where: { campeonatoId, fase: 'semifinal' },
    });

    let posicion = 3;
    for (const partidoSemi of partidosSemifinal) {
      const perdedorId = partidoSemi.equipo1Id === partidoSemi.ganadorId 
        ? partidoSemi.equipo2Id 
        : partidoSemi.equipo1Id;
      
      const perdedor = await equipoRepository.findOne({ where: { id: perdedorId } });
      perdedor.posicionFinal = posicion;
      await equipoRepository.save(perdedor);
    }

    await campeonatoRepository.save(campeonato);
  }

  async obtenerPartidosPorCampeonato(campeonatoId, filtros = {}) {
    const { fase, estado } = filtros;
    const where = { campeonatoId };

    if (fase) where.fase = fase;
    if (estado) where.estado = estado;

    return await partidoRepository.find({
      where,
      relations: ['equipo1', 'equipo2', 'ganador', 'cancha'],
      order: { numeroPartido: 'ASC' },
    });
  }

  async actualizarPartido(partidoId, data) {
    const partido = await this.obtenerPartidoPorId(partidoId);

    if (partido.estado === ESTADOS_PARTIDO.FINALIZADO) {
      throw new Error('No se puede modificar un partido finalizado');
    }

    Object.assign(partido, data);
    return await partidoRepository.save(partido);
  }
}

export default new PartidoService();