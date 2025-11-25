import { AppDataSource } from "../config/config.db.js";
import JugadorCampeonatoSchema from "../entity/JugadorCampeonato.js";
import EstadisticaCampeonatoSchema from "../entity/EstadisticaCampeonato.js";
import UsuarioSchema from "../entity/Usuario.js";
import CampeonatoSchema from "../entity/Campeonato.js";
import EquipoCampeonatoSchema from "../entity/EquipoCampeonato.js";
import { obtenerEstadisticasJugadorCampeonato } from "./estadisticaCampeonatoServices.js";

/**
 * Buscar jugadores que hayan participado en campeonatos
 * Con estadísticas agregadas y filtros
 */
export async function buscarJugadoresCampeonato(filtros = {}) {
  try {
    const {
      q = '',
      carreraId,
      anio,
      page = 1,
      limit = 20
    } = filtros;

    const skip = (page - 1) * limit;


    // Query corregido con alias que respetan mayúsculas/minúsculas
    const qb = AppDataSource
      .getRepository(UsuarioSchema)
      .createQueryBuilder('u')
      .leftJoin('u.carrera', 'carrera')
      .leftJoin(JugadorCampeonatoSchema, 'jc', 'jc.usuarioId = u.id')
      .leftJoin(CampeonatoSchema, 'camp', 'camp.id = jc.campeonatoId')
      .select('u.id', 'usuarioId')
      .addSelect('u.nombre', 'nombre')
      .addSelect('u.rut', 'rut')
      .addSelect('carrera.id', 'carreraId')
      .addSelect('carrera.nombre', 'carreraNombre')
      .addSelect('COUNT(DISTINCT jc.campeonatoId)', 'totalCampeonatos')
      .addSelect('COALESCE(SUM(jc.golesCampeonato), 0)', 'totalGoles')
      .addSelect('COALESCE(SUM(jc.asistenciasCampeonato), 0)', 'totalAsistencias')
      .addSelect('COALESCE(SUM(jc.atajadasCampeonato), 0)', 'totalAtajadas')
      .where('jc.id IS NOT NULL')
      .groupBy('u.id')
      .addGroupBy('u.nombre')
      .addGroupBy('u.rut')
      .addGroupBy('carrera.id')
      .addGroupBy('carrera.nombre');

    // Filtros
    if (q.trim()) {
      qb.andWhere(
        '(LOWER(u.nombre) LIKE :q OR LOWER(u.rut) LIKE :q)',
        { q: `%${q.toLowerCase()}%` }
      );
    }

    if (carreraId) {
      qb.andWhere('u.carreraId = :carreraId', { carreraId: Number(carreraId) });
    }

    if (anio) {
      qb.andWhere('camp.anio = :anio', { anio: Number(anio) });
    }
    qb.andWhere('camp.estado IN (:...estados)', { 
      estados: ['en_juego', 'finalizado'] 
    });


    // Contar total
    const totalQuery = qb.clone();
    const totalResults = await totalQuery.getRawMany();
    const total = totalResults.length;


    // Ejecutar query con paginación
    const jugadores = await qb
      .orderBy('"totalGoles"', 'DESC')  
      .addOrderBy('u.nombre', 'ASC')
      .offset(skip)
      .limit(limit)
      .getRawMany();


    return [{
      jugadores: jugadores.map(j => {
        return {
          usuarioId: Number(j.usuarioId || j.usuarioid),
          nombre: j.nombre,
          rut: j.rut,
          carreraId: j.carreraId || j.carreraid ? Number(j.carreraId || j.carreraid) : null,
          carreraNombre: j.carreraNombre || j.carreranombre || null,
          totalCampeonatos: Number(j.totalCampeonatos || j.totalcampeonatos) || 0,
          totalGoles: Number(j.totalGoles || j.totalgoles) || 0,
          totalAsistencias: Number(j.totalAsistencias || j.totalasistencias) || 0,
          totalAtajadas: Number(j.totalAtajadas || j.totalatajadas) || 0
        };
      }),
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }, null];

  } catch (error) {
    console.error('❌ Error buscando jugadores de campeonato:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Obtener perfil completo de un jugador con todo su historial
 */
export async function obtenerPerfilJugadorCampeonato(usuarioId) {
  try {
    const usuarioRepo = AppDataSource.getRepository(UsuarioSchema);
    const jugadorCampRepo = AppDataSource.getRepository(JugadorCampeonatoSchema);
    const estadisticaRepo = AppDataSource.getRepository(EstadisticaCampeonatoSchema);

    // 1. Datos básicos del usuario
    const usuario = await usuarioRepo.findOne({
      where: { id: Number(usuarioId) },
      relations: ['carrera']
    });

    if (!usuario) {
      return [null, 'Usuario no encontrado'];
    }

    // 2. Todas las participaciones en campeonatos (solo en_juego y finalizado)
    const participaciones = await jugadorCampRepo
      .createQueryBuilder('jc')
      .leftJoinAndSelect('jc.campeonato', 'campeonato')
      .leftJoinAndSelect('jc.equipo', 'equipo')
      .leftJoinAndSelect('equipo.carrera', 'carrera')
       
      .leftJoinAndSelect('jc.estadisticas', 'estadisticas')
      .leftJoinAndSelect('estadisticas.partido', 'partido')
      .leftJoinAndSelect('partido.equipoA', 'equipoA')  // 🆕 Agregar esta línea
  .leftJoinAndSelect('partido.equipoB', 'equipoB')
      .where('jc.usuarioId = :usuarioId', { usuarioId: Number(usuarioId) })
      .andWhere('campeonato.estado IN (:...estados)', { 
        estados: ['en_juego', 'finalizado'] 
      })
      .orderBy('campeonato.anio', 'DESC')
      .addOrderBy('campeonato.semestre', 'DESC')
      .getMany();

    // 3. Calcular totales generales
    const totalesGenerales = {
      campeonatos: participaciones.length,
      goles: participaciones.reduce((sum, p) => sum + (p.golesCampeonato || 0), 0),
      asistencias: participaciones.reduce((sum, p) => sum + (p.asistenciasCampeonato || 0), 0),
      atajadas: participaciones.reduce((sum, p) => sum + (p.atajadasCampeonato || 0), 0),
      tarjetasAmarillas: 0,
      tarjetasRojas: 0,
      partidosJugados: 0,
      minutosJugados: 0
    };

    // 4. Calcular estadísticas detalladas por partido
    const partidosUnicos = new Set();
    
    participaciones.forEach(participacion => {
      if (participacion.estadisticas) {
        participacion.estadisticas.forEach(est => {
          partidosUnicos.add(est.partidoId);
          totalesGenerales.tarjetasAmarillas += est.tarjetasAmarillas || 0;
          totalesGenerales.tarjetasRojas += est.tarjetasRojas || 0;
          totalesGenerales.minutosJugados += est.minutosJugados || 0;
        });
      }
    });

    totalesGenerales.partidosJugados = partidosUnicos.size;

    // 5. Formatear historial por campeonato
    const historialCampeonatos = participaciones.map(p => {
  // Contar partidos únicos de este campeonato
  const partidosEnCampeonato = new Set(
    (p.estadisticas || []).map(e => e.partidoId)
  ).size;

  // Sumar estadísticas de todos los partidos
  const estadisticasPartidos = p.estadisticas || [];
  const tarjetasAmarillas = estadisticasPartidos.reduce(
    (sum, e) => sum + (e.tarjetasAmarillas || 0), 0
  );
  const tarjetasRojas = estadisticasPartidos.reduce(
    (sum, e) => sum + (e.tarjetasRojas || 0), 0
  );
  const minutosJugados = estadisticasPartidos.reduce(
    (sum, e) => sum + (e.minutosJugados || 0), 0
  );

  // 🆕 Extraer información de los partidos con resultados
  const partidosDetalle = estadisticasPartidos
  .filter(est => est.partido) // Solo partidos que existen
  .map(est => ({
    partidoId: est.partidoId,
    fecha: est.partido.fecha || null,
    ronda: est.partido.ronda || null,
    equipoANombre: est.partido.equipoA?.nombre || 'N/A',
    equipoBNombre: est.partido.equipoB?.nombre || 'N/A',
    golesA: est.partido.golesA ?? null,
    golesB: est.partido.golesB ?? null,
    resultado: (est.partido.golesA !== null && est.partido.golesB !== null) 
      ? `${est.partido.golesA} - ${est.partido.golesB}` 
      : null,
    estado: est.partido.estado || null,
    definidoPorPenales: est.partido.definidoPorPenales || false,
    penalesA: est.partido.penalesA ?? null,
    penalesB: est.partido.penalesB ?? null,
    golesJugador: est.goles || 0,
    asistenciasJugador: est.asistencias || 0,
    atajadasJugador: est.atajadas || 0,
    tarjetasAmarillasJugador: est.tarjetasAmarillas || 0,
    tarjetasRojasJugador: est.tarjetasRojas || 0,
    minutosJugados: est.minutosJugados || 0

    }));

  return {
    campeonatoId: p.campeonato.id,
    campeonatoNombre: p.campeonato.nombre,
    anio: p.campeonato.anio,
    semestre: p.campeonato.semestre,
    formato: p.campeonato.formato,
    genero: p.campeonato.genero,
    equipoId: p.equipo.id,
    equipoNombre: p.equipo.nombre,
    equipoCarrera: p.equipo.carrera?.nombre || null,
    posicion: p.posicion,
    numeroCamiseta: p.numeroCamiseta,
    estadisticas: {
      goles: p.golesCampeonato || 0,
      asistencias: p.asistenciasCampeonato || 0,
      atajadas: p.atajadasCampeonato || 0,
      tarjetasAmarillas,
      tarjetasRojas,
      partidosJugados: partidosEnCampeonato,
      minutosJugados
    },
    partidos: partidosDetalle, 
    fechaInscripcion: p.fechaInscripcion
  };
});

    // 6. Calcular promedios
    const promedios = {
      golesPartido: totalesGenerales.partidosJugados > 0
        ? (totalesGenerales.goles / totalesGenerales.partidosJugados).toFixed(2)
        : '0.00',
      asistenciasPartido: totalesGenerales.partidosJugados > 0
        ? (totalesGenerales.asistencias / totalesGenerales.partidosJugados).toFixed(2)
        : '0.00',
      minutosPartido: totalesGenerales.partidosJugados > 0
        ? Math.round(totalesGenerales.minutosJugados / totalesGenerales.partidosJugados)
        : 0
    };

    return [{
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rut: usuario.rut,
        email: usuario.email,
        carreraId: usuario.carrera?.id || null,
        carreraNombre: usuario.carrera?.nombre || null
      },
      totalesGenerales,
      promedios,
      historialCampeonatos
    }, null];

  } catch (error) {
    console.error('Error obteniendo perfil de jugador:', error);
    return [null, 'Error interno del servidor'];
  }
}


/**
 * Obtener estadísticas detalladas partido por partido
 * Reutiliza la función existente de estadisticas.services.js
 */
export async function obtenerEstadisticasDetalladas(usuarioId, campeonatoId) {
  try {
    
    const resultado = await obtenerEstadisticasJugadorCampeonato(
      Number(usuarioId),
      Number(campeonatoId)
    );

    return [resultado, null];

  } catch (error) {
    console.error('Error obteniendo estadísticas detalladas:', error);
    const mensaje = error.message === 'El jugador no está inscrito en este campeonato'
      ? error.message
      : 'Error interno del servidor';
    return [null, mensaje];
  }
}