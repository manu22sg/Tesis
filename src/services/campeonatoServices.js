import { AppDataSource } from '../config/config.db.js';
import {
  obtenerConfiguracionFormato,
  esPotenciaDeDos,
  calcularFaseSegunEquipos,
  barajarArray,
  ESTADOS_CAMPEONATO,
  calcularSiguienteFase,
} from '../utils/campeonatoHelper.js';

const campeonatoRepository = AppDataSource.getRepository('Campeonato');
const equipoRepository = AppDataSource.getRepository('Equipo');
const partidoRepository = AppDataSource.getRepository('Partido');
const participanteRepository = AppDataSource.getRepository('ParticipanteEquipo');

class CampeonatoService {
  async crearCampeonato(data) {
    // Validar formato de juego
    const config = obtenerConfiguracionFormato(data.formatoJuego);
    
    const campeonato = campeonatoRepository.create({
      ...data,
      estado: ESTADOS_CAMPEONATO.PLANIFICACION,
    });

    return await campeonatoRepository.save(campeonato);
  }

  async obtenerCampeonatos(filtros = {}) {
    const { estado, modalidad, activos } = filtros;
    const where = {};

    if (estado) where.estado = estado;
    if (modalidad) where.modalidad = modalidad;
    if (activos) {
      where.estado = [
        ESTADOS_CAMPEONATO.PLANIFICACION,
        ESTADOS_CAMPEONATO.INSCRIPCION,
        ESTADOS_CAMPEONATO.EN_CURSO,
      ];
    }

    return await campeonatoRepository.find({
      where,
      relations: ['equipos', 'campeon'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  async obtenerCampeonatoPorId(id) {
    const campeonato = await campeonatoRepository.findOne({
      where: { id },
      relations: ['equipos', 'partidos', 'campeon'],
    });

    if (!campeonato) {
      throw new Error('Campeonato no encontrado');
    }

    // Agregar información calculada
    const config = obtenerConfiguracionFormato(campeonato.formatoJuego);
    return {
      ...campeonato,
      jugadoresPorEquipo: config.jugadores,
      capacidadMinimaCancha: config.capacidadCancha,
    };
  }

  async actualizarCampeonato(id, data) {
    const campeonato = await this.obtenerCampeonatoPorId(id);

    // No permitir cambiar formato si ya hay equipos inscritos
    if (data.formatoJuego && campeonato.equipos.length > 0) {
      throw new Error('No se puede cambiar el formato con equipos ya inscritos');
    }

    Object.assign(campeonato, data);
    return await campeonatoRepository.save(campeonato);
  }

  async eliminarCampeonato(id) {
    const campeonato = await this.obtenerCampeonatoPorId(id);

    if (campeonato.estado === ESTADOS_CAMPEONATO.EN_CURSO) {
      throw new Error('No se puede eliminar un campeonato en curso');
    }

    await campeonatoRepository.remove(campeonato);
    return { mensaje: 'Campeonato eliminado exitosamente' };
  }

 async generarFixture(campeonatoId) {
  const id = parseInt(campeonatoId);
  console.log('🔍 Generando fixture para campeonato ID:', id);

  // Obtener el campeonato con equipos
  const campeonato = await campeonatoRepository.findOne({
    where: { id },
    relations: ['equipos'], // no necesitamos traer partidos todavía
  });

  if (!campeonato) throw new Error('Campeonato no encontrado');
  console.log('✅ Campeonato encontrado:', campeonato.id, campeonato.nombre);

  // Validación de estado
  if (campeonato.estado !== ESTADOS_CAMPEONATO.INSCRIPCION) {
    throw new Error('El campeonato debe estar en estado "inscripcion"');
  }

  const equipos = campeonato.equipos;
  const numeroEquipos = equipos.length;

  // Validar potencia de 2
  if (!esPotenciaDeDos(numeroEquipos)) {
    throw new Error(
      `Número de equipos debe ser potencia de 2. Actual: ${numeroEquipos}`
    );
  }

  // Validar jugadores por equipo
  const config = obtenerConfiguracionFormato(campeonato.formatoJuego);
  for (const equipo of equipos) {
    const participantes = await participanteRepository.count({
      where: { equipoId: equipo.id },
    });
    if (participantes < config.jugadores) {
      throw new Error(
        `El equipo "${equipo.nombre}" necesita mínimo ${config.jugadores} jugadores. Actual: ${participantes}`
      );
    }
  }

  // Barajar equipos aleatoriamente
  const equiposBarajados = barajarArray(equipos);

  // Array para guardar partidos
  const partidos = [];
  let numeroPartido = 1;

  // Función para crear partidos de una ronda
  const crearRonda = (equiposRonda, fase) => {
    const partidosRonda = [];
    for (let i = 0; i < equiposRonda.length; i += 2) {
      const partido = partidoRepository.create({
        campeonatoId: campeonato.id, 
        equipo1Id: equiposRonda[i] ? equiposRonda[i].id : null,
        equipo2Id: equiposRonda[i + 1] ? equiposRonda[i + 1].id : null,
        fase,
        numeroPartido: numeroPartido++,
        estado: 'programado',
      });
      partidosRonda.push(partido);
    }
    return partidosRonda;
  };

  // Crear solo la primera ronda (cuartos de final si hay 8 equipos)
  const faseInicial = calcularFaseSegunEquipos(numeroEquipos);
  const primeraRonda = crearRonda(equiposBarajados, faseInicial);
  partidos.push(...primeraRonda);

  // Guardar partidos uno por uno para capturar errores
  for (const p of partidos) {
    console.log('📝 Partido a guardar:', {
      numeroPartido: p.numeroPartido,
      fase: p.fase,
      campeonatoId: p.campeonatoId,
      equipo1Id: p.equipo1Id,
      equipo2Id: p.equipo2Id,
    });

    try {
      await partidoRepository.save(p);
    } catch (err) {
      console.error('❌ Error guardando partido:', p);
      throw err;
    }
  }

  // Cambiar estado del campeonato
  campeonato.estado = ESTADOS_CAMPEONATO.EN_CURSO;
  await campeonatoRepository.save(campeonato);

  console.log('🎉 Fixture generado exitosamente');
  return {
    mensaje: 'Fixture generado exitosamente',
    totalPartidos: partidos.length,
    primeraFase: faseInicial,
  };
}

async obtenerFixture(campeonatoId) {
  const campeonato = await campeonatoRepository.findOne({
    where: { id: campeonatoId },
    relations: ['equipos'], // traemos los equipos
  });
  if (!campeonato) throw new Error('Campeonato no encontrado');

  const numeroEquipos = campeonato.equipos.length;
  const faseInicial = calcularFaseSegunEquipos(numeroEquipos);

  const partidos = await partidoRepository.find({
    where: { campeonatoId, fase: faseInicial },
    relations: ['equipo1', 'equipo2', 'cancha', 'ganador'],
    order: { numeroPartido: 'ASC' },
  });

  const fixture = partidos.map((partido) => ({
    id: partido.id,
    numeroPartido: partido.numeroPartido,
    equipo1: partido.equipo1
      ? { id: partido.equipo1.id, nombre: partido.equipo1.nombre }
      : null,
    equipo2: partido.equipo2
      ? { id: partido.equipo2.id, nombre: partido.equipo2.nombre }
      : null,
    golesEquipo1: partido.golesEquipo1,
    golesEquipo2: partido.golesEquipo2,
    estado: partido.estado,
    cancha: partido.cancha ? { id: partido.cancha.id, nombre: partido.cancha.nombre } : null,
    ganador: partido.ganador ? { id: partido.ganador.id, nombre: partido.ganador.nombre } : null,
  }));

  return { fase: faseInicial, partidos: fixture };
}










  async obtenerEstadisticasCampeonato(campeonatoId) {
    // Obtener tabla de goleadores
    const goleadores = await AppDataSource.query(`
      SELECT 
        u.nombre,
        u.rut,
        e.nombre as equipo,
        SUM(ec.goles) as total_goles,
        SUM(ec.asistencias) as total_asistencias,
        COUNT(DISTINCT ec.partidoId) as partidos_jugados
      FROM estadisticas_campeonato ec
      INNER JOIN usuarios u ON ec.usuarioId = u.id
      INNER JOIN equipos e ON ec.equipoId = e.id
      WHERE e.campeonatoId = $1
      GROUP BY u.id, u.nombre, u.rut, e.nombre
      ORDER BY total_goles DESC, total_asistencias DESC
      LIMIT 10
    `, [campeonatoId]);

    // Obtener equipos con más goles
    const equipos = await AppDataSource.query(`
      SELECT 
        e.nombre,
        e.carrera,
        COUNT(DISTINCT p.id) as partidos_jugados,
        SUM(CASE WHEN p.equipo1Id = e.id THEN p.golesEquipo1 
                 WHEN p.equipo2Id = e.id THEN p.golesEquipo2 
                 ELSE 0 END) as goles_favor,
        SUM(CASE WHEN p.equipo1Id = e.id THEN p.golesEquipo2 
                 WHEN p.equipo2Id = e.id THEN p.golesEquipo1 
                 ELSE 0 END) as goles_contra,
        SUM(CASE WHEN p.ganadorId = e.id THEN 1 ELSE 0 END) as victorias
      FROM equipos e
      LEFT JOIN partidos p ON (p.equipo1Id = e.id OR p.equipo2Id = e.id) 
                           AND p.estado = 'finalizado'
      WHERE e.campeonatoId = $1
      GROUP BY e.id, e.nombre, e.carrera
      ORDER BY victorias DESC, goles_favor DESC
    `, [campeonatoId]);

    return {
      goleadores,
      equipos,
    };
  }
}

export default new CampeonatoService();