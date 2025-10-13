import { AppDataSource } from "../config/config.db.js";
import PartidoCampeonatoSchema from "../entity/PartidoCampeonato.js";
import JugadorCampeonatoSchema from "../entity/JugadorCampeonato.js";
import EstadisticaCampeonatoSchema from "../entity/EstadisticaCampeonato.js";

 // Crear estadísticas por partido
export const crearEstadistica = async (payload) => {
  return await AppDataSource.transaction(async (trx) => {
    const partidoRepo = trx.getRepository(PartidoCampeonatoSchema);
    const jugadorCampRepo = trx.getRepository(JugadorCampeonatoSchema);
    const estadisticaRepo = trx.getRepository(EstadisticaCampeonatoSchema);

    const {
      partidoId,
      jugadorCampeonatoId,
      goles = 0,
      asistencias = 0,
      atajadas = 0,
      tarjetasAmarillas = 0,
      tarjetasRojas = 0,
      minutosJugados = 0,
    } = payload;

    //  Verificar partido
    const partido = await partidoRepo.findOne({
      where: { id: partidoId },
      relations: ["equipoA", "equipoB"],
    });
    if (!partido) throw new Error("El partido no existe");

    //  Verificar jugador inscrito en campeonato
    const jugador = await jugadorCampRepo.findOne({
      where: { id: jugadorCampeonatoId },
      relations: ["equipo"],
    });
    if (!jugador) throw new Error("El jugador no está inscrito en el campeonato");

    //  Validar que el jugador pertenezca a uno de los equipos del partido
    if (![partido.equipoAId, partido.equipoBId].includes(jugador.equipoId)) {
      throw new Error("El jugador no pertenece a los equipos que disputan este partido");
    }

    //  Evitar duplicado (gracias a unique ya definido)
    const existe = await estadisticaRepo.findOne({
      where: { jugadorCampeonatoId, partidoId },
    });
    if (existe) throw new Error("Este jugador ya tiene estadísticas registradas en este partido");

    //  Crear registro
    const nueva = estadisticaRepo.create({
      jugadorCampeonatoId,
      partidoId,
      goles,
      asistencias,
      atajadas,
      tarjetasAmarillas,
      tarjetasRojas,
      minutosJugados,
    });
    const guardada = await estadisticaRepo.save(nueva);

    //  Actualizar marcador del partido si corresponde
    if (goles > 0) {
      if (jugador.equipoId === partido.equipoAId) {
        partido.golesA += goles;
      } else if (jugador.equipoId === partido.equipoBId) {
        partido.golesB += goles;
      }
      await partidoRepo.save(partido);
    }

    //  Actualizar acumulados del jugador
    jugador.golesCampeonato += goles;
    jugador.asistenciasCampeonato += asistencias;
    jugador.atajadasCampeonato += atajadas;
    await jugadorCampRepo.save(jugador);

    return guardada;
  });
};

 // Actualizar estadísticas de un partido
export const actualizarEstadistica = async (id, cambios) => {
  const repo = AppDataSource.getRepository(EstadisticaCampeonatoSchema);
  const registro = await repo.findOne({ where: { id } });
  if (!registro) throw new Error("Estadística no encontrada");

  Object.assign(registro, cambios);
  return await repo.save(registro);
};

 // Listar estadísticas con filtros
export const listarEstadisticas = async (filtros = {}) => {
  const repo = AppDataSource.getRepository(EstadisticaCampeonatoSchema);

  const where = {};
  if (filtros.partidoId) where.partidoId = Number(filtros.partidoId);
  if (filtros.jugadorCampeonatoId)
    where.jugadorCampeonatoId = Number(filtros.jugadorCampeonatoId);

  const [items, total] = await repo.findAndCount({
    where,
    relations: ["jugadorCampeonato", "partido"],
    order: { id: "DESC" },
  });

  return { total, items };
};

 // Eliminar registro
export const eliminarEstadistica = async (id) => {
  const repo = AppDataSource.getRepository(EstadisticaCampeonatoSchema);
  const registro = await repo.findOne({ where: { id } });
  if (!registro) throw new Error("Estadística no encontrada");

  await repo.delete({ id });
  return { ok: true };
};

// Obtener estadística por ID
export const obtenerEstadisticaPorId = async (id) => {
  const repo = AppDataSource.getRepository(EstadisticaCampeonatoSchema);

  const estadistica = await repo.findOne({
    where: { id: Number(id) },
    relations: [
      "jugadorCampeonato",
      "jugadorCampeonato.equipo",
      "partido",
      "partido.equipoA",
      "partido.equipoB"
    ],
  });

  if (!estadistica) return null;

  return {
    id: estadistica.id,
    partidoId: estadistica.partidoId,
    jugadorCampeonatoId: estadistica.jugadorCampeonatoId,
    jugador: estadistica.jugadorCampeonato?.usuarioId
      ? {
          id: estadistica.jugadorCampeonato.usuarioId,
          equipo: estadistica.jugadorCampeonato.equipo?.nombre,
          posicion: estadistica.jugadorCampeonato.posicion,
          numeroCamiseta: estadistica.jugadorCampeonato.numeroCamiseta,
        }
      : null,
    goles: estadistica.goles,
    asistencias: estadistica.asistencias,
    atajadas: estadistica.atajadas,
    tarjetasAmarillas: estadistica.tarjetasAmarillas,
    tarjetasRojas: estadistica.tarjetasRojas,
    minutosJugados: estadistica.minutosJugados,
    partido: {
      id: estadistica.partido.id,
      ronda: estadistica.partido.ronda,
      equipoA: estadistica.partido.equipoA?.nombre,
      equipoB: estadistica.partido.equipoB?.nombre,
      fecha: estadistica.partido.fecha,
      estado: estadistica.partido.estado,
    },
  };
};

 // Obtener estadísticas detalladas por jugadorCampeonatoId
export const obtenerEstadisticasPorJugadorCampeonatoId = async (jugadorCampId, campeonatoId) => {
  const estadRepo = AppDataSource.getRepository(EstadisticaCampeonatoSchema);
  const jugadorRepo = AppDataSource.getRepository(JugadorCampeonatoSchema);

  // 🔍 Validar jugadorCampeonato en el torneo correspondiente
  const jugador = await jugadorRepo.findOne({
    where: { id: jugadorCampId, campeonatoId },
    relations: ["equipo"],
  });

  if (!jugador)
    throw new Error("El jugador no pertenece a este campeonato o no existe");

  const resultados = await estadRepo.find({
    where: { jugadorCampeonatoId: jugadorCampId },
    relations: ["partido", "partido.equipoA", "partido.equipoB"],
    order: { id: "ASC" },
  });

  if (!resultados.length) {
    return { totalPartidos: 0, totales: {}, detalle: [] };
  }

  const totales = resultados.reduce(
    (acc, e) => {
      acc.goles += e.goles;
      acc.asistencias += e.asistencias;
      acc.atajadas += e.atajadas;
      acc.tarjetasAmarillas += e.tarjetasAmarillas;
      acc.tarjetasRojas += e.tarjetasRojas;
      acc.minutosJugados += e.minutosJugados;
      return acc;
    },
    { goles: 0, asistencias: 0, atajadas: 0, tarjetasAmarillas: 0, tarjetasRojas: 0, minutosJugados: 0 }
  );

  return {
    jugador: {
      id: jugador.usuarioId,
      nombreEquipo: jugador.equipo?.nombre,
      carrera: jugador.equipo?.carrera,
      numeroCamiseta: jugador.numeroCamiseta,
      posicion: jugador.posicion,
    },
    totalPartidos: resultados.length,
    totales,
    detalle: resultados.map((r) => ({
      partidoId: r.partidoId,
      ronda: r.partido?.ronda,
      fecha: r.partido?.fecha,
      equipoA: r.partido?.equipoA?.nombre,
      equipoB: r.partido?.equipoB?.nombre,
      goles: r.goles,
      asistencias: r.asistencias,
      atajadas: r.atajadas,
      amarillas: r.tarjetasAmarillas,
      rojas: r.tarjetasRojas,
      minutos: r.minutosJugados,
    })),
  };
};
// Obtener estadísticas detalladas por usuarioId en un campeonato
export const obtenerEstadisticasJugadorCampeonato = async (usuarioId, campeonatoId) => {
  const estadRepo = AppDataSource.getRepository(EstadisticaCampeonatoSchema);
  const jugadorRepo = AppDataSource.getRepository(JugadorCampeonatoSchema);

  const jugador = await jugadorRepo.findOne({
    where: { usuarioId, campeonatoId },
    relations: ["equipo"],
  });

  if (!jugador)
    throw new Error("El jugador no está inscrito en este campeonato");

  const resultados = await estadRepo.find({
    where: { jugadorCampeonatoId: jugador.id },
    relations: ["partido", "partido.equipoA", "partido.equipoB"],
    order: { id: "ASC" },
  });

  if (!resultados.length) {
    return { totalPartidos: 0, totales: {}, detalle: [] };
  }

  const totales = resultados.reduce(
    (acc, e) => {
      acc.goles += e.goles;
      acc.asistencias += e.asistencias;
      acc.atajadas += e.atajadas;
      acc.tarjetasAmarillas += e.tarjetasAmarillas;
      acc.tarjetasRojas += e.tarjetasRojas;
      acc.minutosJugados += e.minutosJugados;
      return acc;
    },
    { goles: 0, asistencias: 0, atajadas: 0, tarjetasAmarillas: 0, tarjetasRojas: 0, minutosJugados: 0 }
  );

  return {
    jugador: {
      id: jugador.usuarioId,
      nombreEquipo: jugador.equipo?.nombre,
      carrera: jugador.equipo?.carrera,
      numeroCamiseta: jugador.numeroCamiseta,
      posicion: jugador.posicion,
    },
    totalPartidos: resultados.length,
    totales,
    detalle: resultados.map((r) => ({
      partidoId: r.partidoId,
      ronda: r.partido?.ronda,
      fecha: r.partido?.fecha,
      equipoA: r.partido?.equipoA?.nombre,
      equipoB: r.partido?.equipoB?.nombre,
      goles: r.goles,
      asistencias: r.asistencias,
      atajadas: r.atajadas,
      amarillas: r.tarjetasAmarillas,
      rojas: r.tarjetasRojas,
      minutos: r.minutosJugados,
    })),
  };
};
