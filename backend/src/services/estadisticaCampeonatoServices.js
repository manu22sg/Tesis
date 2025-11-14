import { AppDataSource } from "../config/config.db.js";
import PartidoCampeonatoSchema from "../entity/PartidoCampeonato.js";
import JugadorCampeonatoSchema from "../entity/JugadorCampeonato.js";
import EstadisticaCampeonatoSchema from "../entity/EstadisticaCampeonato.js";

// ⭐ Calcular total de goles por equipo en estadísticas
const calcularGolesEquipo = async (manager, partidoId, equipoId, excluirEstadisticaId = null) => {
  const estadRepo = manager.getRepository(EstadisticaCampeonatoSchema);
  const jugadorRepo = manager.getRepository(JugadorCampeonatoSchema);

  const estadisticas = await estadRepo.find({
    where: { partidoId },
    relations: ["jugadorCampeonato"],
  });

  let totalGoles = 0;
  for (const est of estadisticas) {
    if (excluirEstadisticaId && est.id === excluirEstadisticaId) continue;

    const jugador = await jugadorRepo.findOne({
      where: { id: est.jugadorCampeonatoId },
    });

    if (jugador && jugador.equipoId === equipoId) {
      totalGoles += est.goles;
    }
  }

  return totalGoles;
};

// ⭐ Calcular total de asistencias por equipo en estadísticas
const calcularAsistenciasEquipo = async (manager, partidoId, equipoId, excluirEstadisticaId = null) => {
  const estadRepo = manager.getRepository(EstadisticaCampeonatoSchema);
  const jugadorRepo = manager.getRepository(JugadorCampeonatoSchema);

  const estadisticas = await estadRepo.find({
    where: { partidoId },
    relations: ["jugadorCampeonato"],
  });

  let totalAsistencias = 0;
  for (const est of estadisticas) {
    if (excluirEstadisticaId && est.id === excluirEstadisticaId) continue;

    const jugador = await jugadorRepo.findOne({
      where: { id: est.jugadorCampeonatoId },
    });

    if (jugador && jugador.equipoId === equipoId) {
      totalAsistencias += est.asistencias;
    }
  }

  return totalAsistencias;
};

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

    if (tarjetasAmarillas < 0 || tarjetasAmarillas > 2) {
      throw new Error("Las tarjetas amarillas deben ser 0, 1 o 2");
    }
    if (tarjetasRojas < 0 || tarjetasRojas > 1) {
      throw new Error("Las tarjetas rojas deben ser 0 o 1");
    }
    

    // Verificar partido
    const partido = await partidoRepo.findOne({
      where: { id: partidoId },
      relations: ["equipoA", "equipoB"],
    });
    if (!partido) throw new Error("El partido no existe");

    // Verificar jugador inscrito en campeonato
    const jugador = await jugadorCampRepo.findOne({
      where: { id: jugadorCampeonatoId },
      relations: ["equipo"],
    });
    if (!jugador) throw new Error("El jugador no está inscrito en el campeonato");

    // Validar que el jugador pertenezca a uno de los equipos del partido
    if (![partido.equipoAId, partido.equipoBId].includes(jugador.equipoId)) {
      throw new Error("El jugador no pertenece a los equipos que disputan este partido");
    }

    // Evitar duplicado
    const existe = await estadisticaRepo.findOne({
      where: { jugadorCampeonatoId, partidoId },
    });
    if (existe) throw new Error("Este jugador ya tiene estadísticas registradas en este partido");

    const esEquipoA = jugador.equipoId === partido.equipoAId;
    const golesEquipo = esEquipoA ? partido.golesA : partido.golesB;
    
    // ⭐ VALIDAR GOLES
    if (goles > golesEquipo) {
      throw new Error(
        `El jugador no puede tener ${goles} goles cuando su equipo solo marcó ${golesEquipo}`
      );
    }
    

    const golesActualesEquipo = await calcularGolesEquipo(trx, partidoId, jugador.equipoId);
    const nuevoTotalGoles = golesActualesEquipo + goles;

    if (nuevoTotalGoles > golesEquipo) {
      throw new Error(
        `No se pueden agregar ${goles} goles. El equipo marcó ${golesEquipo} goles y ya hay ${golesActualesEquipo} registrados. Faltan ${golesEquipo - golesActualesEquipo} por asignar`
      );
    }

    // ⭐ VALIDAR ASISTENCIAS (no pueden ser más que los goles del equipo)
    if (asistencias > golesEquipo) {
      throw new Error(
        `El jugador no puede tener ${asistencias} asistencias cuando su equipo solo marcó ${golesEquipo} goles`
      );
    }

    const asistenciasActualesEquipo = await calcularAsistenciasEquipo(trx, partidoId, jugador.equipoId);
    const nuevoTotalAsistencias = asistenciasActualesEquipo + asistencias;
    const maxAsistenciasJugador = Math.max(0, golesEquipo - goles); // goles del equipo que NO los hizo él
    if (asistencias > maxAsistenciasJugador) {
    throw new Error(
    `El jugador no puede tener ${asistencias} asistencias cuando convirtió ${goles} de los ${golesEquipo} goles del equipo`
    );
  }
    if (nuevoTotalAsistencias > golesEquipo) {
  throw new Error(
    `No se pueden agregar ${asistencias} asistencias. El equipo marcó ${golesEquipo} goles y ya hay ${asistenciasActualesEquipo} asistencias registradas`
  );
}
const mins = Number(minutosJugados ?? 0);
    if (isNaN(mins) || mins < 0) {
      throw new Error("Los minutos jugados deben ser un número válido y no negativo");
    }
    if (!partido.definidoPorPenales && mins > 90) {
      throw new Error("Los minutos jugados no pueden superar 90 si el partido no se definió por penales");
    }
    // (opcional) si sí hubo penales, limita a 120 (90 + 30 de alargue)
    if (partido.definidoPorPenales && mins > 120) {
      throw new Error("Los minutos jugados no pueden superar 120 en un partido definido por penales");
    }


    // Las asistencias pueden ser igual o menor a los goles (no todos los goles tienen asistencia)
    if (nuevoTotalAsistencias > golesEquipo) {
      throw new Error(
        `No se pueden agregar ${asistencias} asistencias. El equipo marcó ${golesEquipo} goles y ya hay ${asistenciasActualesEquipo} asistencias registradas`
      );
    }

    // Crear registro
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

    // Actualizar acumulados del jugador
    jugador.golesCampeonato += goles;
    jugador.asistenciasCampeonato += asistencias;
    jugador.atajadasCampeonato += atajadas;
    await jugadorCampRepo.save(jugador);

    return guardada;
  });
};

export const actualizarEstadistica = async (id, cambios) => {
  return await AppDataSource.transaction(async (trx) => {
    const estadisticaRepo = trx.getRepository(EstadisticaCampeonatoSchema);
    const partidoRepo = trx.getRepository(PartidoCampeonatoSchema);
    const jugadorCampRepo = trx.getRepository(JugadorCampeonatoSchema);

    const registro = await estadisticaRepo.findOne({ 
      where: { id },
      relations: ["jugadorCampeonato", "partido"]
    });
    if (!registro) throw new Error("Estadística no encontrada");

    const partido = await partidoRepo.findOne({
      where: { id: registro.partidoId },
    });
    if (!partido) throw new Error("Partido no encontrado");

    const jugador = await jugadorCampRepo.findOne({
      where: { id: registro.jugadorCampeonatoId },
    });
    if (!jugador) throw new Error("Jugador no encontrado");

    const nuevasAmarillas = (cambios.tarjetasAmarillas !== undefined)
      ? Number(cambios.tarjetasAmarillas) : registro.tarjetasAmarillas;
    const nuevasRojas = (cambios.tarjetasRojas !== undefined)
      ? Number(cambios.tarjetasRojas) : registro.tarjetasRojas;

    if (nuevasAmarillas < 0 || nuevasAmarillas > 2) {
      throw new Error("Las tarjetas amarillas deben ser 0, 1 o 2");
    }
    if (nuevasRojas < 0 || nuevasRojas > 1) {
      throw new Error("Las tarjetas rojas deben ser 0 o 1");
    }

    const esEquipoA = jugador.equipoId === partido.equipoAId;
    const golesEquipo = esEquipoA ? partido.golesA : partido.golesB;

    // Determinar los goles del jugador tras la actualización (si viene en cambios)
    const golesJugadorActualizado = (cambios.goles !== undefined)
      ? Number(cambios.goles)
      : registro.goles;

    //Validar GOLES si se están actualizando
    if (cambios.goles !== undefined) {
      const nuevosGoles = golesJugadorActualizado;

      if (nuevosGoles > golesEquipo) {
        throw new Error(
          `El jugador no puede tener ${nuevosGoles} goles cuando su equipo solo marcó ${golesEquipo}`
        );
      }
        if (cambios.minutosJugados !== undefined) {
      const minsAct = Number(cambios.minutosJugados);
      if (isNaN(minsAct) || minsAct < 0) {
        throw new Error("Los minutos jugados deben ser un número válido y no negativo");
      }
      if (!partido.definidoPorPenales && minsAct > 90) {
        throw new Error("Los minutos jugados no pueden superar 90 si el partido no se definió por penales");
      }
      // (opcional) si sí hubo penales, limita a 120
      if (partido.definidoPorPenales && minsAct > 120) {
        throw new Error("Los minutos jugados no pueden superar 120 en un partido definido por penales");
      }
    }

      const golesActualesEquipo = await calcularGolesEquipo(
        trx, registro.partidoId, jugador.equipoId, id
      );
      const nuevoTotalGoles = golesActualesEquipo + nuevosGoles;

      if (nuevoTotalGoles > golesEquipo) {
        throw new Error(
          `No se pueden asignar ${nuevosGoles} goles. El equipo marcó ${golesEquipo} y ya hay ${golesActualesEquipo} registrados en otras estadísticas`
        );
      }

      // Actualizar acumulados del jugador
      const diferenciaGoles = nuevosGoles - registro.goles;
      jugador.golesCampeonato += diferenciaGoles;
    }

    // Validar ASISTENCIAS si se están actualizando
    if (cambios.asistencias !== undefined) {
      const nuevasAsistencias = Number(cambios.asistencias);

      // (1) Tope por jugador: no puede asistirse sus propios goles
      const maxAsistenciasJugador = Math.max(0, golesEquipo - golesJugadorActualizado);
      if (nuevasAsistencias > maxAsistenciasJugador) {
        throw new Error(
          `El jugador no puede tener ${nuevasAsistencias} asistencias cuando convirtió ` +
          `${golesJugadorActualizado} de los ${golesEquipo} goles del equipo`
        );
      }

      // (2) Tope por equipo: la suma de asistencias del equipo no puede superar sus goles
      const asistenciasActualesEquipo = await calcularAsistenciasEquipo(
        trx, registro.partidoId, jugador.equipoId, id
      );
      const nuevoTotalAsistencias = asistenciasActualesEquipo + nuevasAsistencias;

      if (nuevoTotalAsistencias > golesEquipo) {
        throw new Error(
          `No se pueden asignar ${nuevasAsistencias} asistencias. El equipo marcó ${golesEquipo} ` +
          `goles y ya hay ${asistenciasActualesEquipo} registradas en otras estadísticas`
        );
      }

      // Actualizar acumulados del jugador
      const diferencia = nuevasAsistencias - registro.asistencias;
      jugador.asistenciasCampeonato += diferencia;
    }

    // Actualizar atajadas si cambian
    if (cambios.atajadas !== undefined) {
      const diferencia = Number(cambios.atajadas) - registro.atajadas;
      jugador.atajadasCampeonato += diferencia;
    }

    // Guardar cambios
    Object.assign(registro, cambios);
    await estadisticaRepo.save(registro);
    await jugadorCampRepo.save(jugador);

    return registro;
  });
};

// ⭐ ELIMINAR con actualización de acumulados
export const eliminarEstadistica = async (id) => {
  return await AppDataSource.transaction(async (trx) => {
    const estadisticaRepo = trx.getRepository(EstadisticaCampeonatoSchema);
    const jugadorCampRepo = trx.getRepository(JugadorCampeonatoSchema);

    const registro = await estadisticaRepo.findOne({ where: { id } });
    if (!registro) throw new Error("Estadística no encontrada");

    // Restar acumulados del jugador
    const jugador = await jugadorCampRepo.findOne({
      where: { id: registro.jugadorCampeonatoId },
    });

    if (jugador) {
      jugador.golesCampeonato -= registro.goles;
      jugador.asistenciasCampeonato -= registro.asistencias;
      jugador.atajadasCampeonato -= registro.atajadas;
      await jugadorCampRepo.save(jugador);
    }

    await estadisticaRepo.delete({ id });
    return { ok: true };
  });
};

// Listar estadísticas con filtros
export const listarEstadisticas = async (filtros = {}) => {
  const repo = AppDataSource.getRepository(EstadisticaCampeonatoSchema);

  const where = {};

  if (filtros.partidoId)
    where.partidoId = Number(filtros.partidoId);

  if (filtros.jugadorCampeonatoId)
    where.jugadorCampeonatoId = Number(filtros.jugadorCampeonatoId);

  const query = repo
    .createQueryBuilder("estad")
    .leftJoinAndSelect("estad.jugadorCampeonato", "jug")
    .leftJoinAndSelect("estad.partido", "partido")
    .leftJoinAndSelect("jug.equipo", "equipo");

  // ⭐⭐ AQUI FILTRAMOS POR CAMPEONATO CORRECTAMENTE ⭐⭐
  if (filtros.campeonatoId) {
    query.andWhere("jug.campeonatoId = :campId", {
      campId: Number(filtros.campeonatoId),
    });
  }

  query.orderBy("estad.id", "DESC");

  const [items, total] = await query.getManyAndCount();

  return { total, items };
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

export const obtenerEstadisticasPorJugadorCampeonatoId = async (jugadorCampId, campeonatoId) => {
  const estadRepo = AppDataSource.getRepository(EstadisticaCampeonatoSchema);
  const jugadorRepo = AppDataSource.getRepository(JugadorCampeonatoSchema);

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

export const listarJugadoresPorEquipoYCampeonato = async (equipoId, campeonatoId) => {
  const repo = AppDataSource.getRepository(JugadorCampeonatoSchema);
  
  const jugadores = await repo.find({
    where: {
      equipoId: Number(equipoId),
      campeonatoId: Number(campeonatoId)
    },
    relations: ["usuario", "equipo"],
    order: {
      numeroCamiseta: "ASC"
    }
  });

  return jugadores;
};