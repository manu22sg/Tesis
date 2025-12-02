"use strict";
import JugadorSchema from "../entity/Jugador.js";
import EstadisticaBasicaSchema from "../entity/EstadisticaBasica.js";
import SesionEntrenamientoSchema from "../entity/SesionEntrenamiento.js";
import { AppDataSource } from "./config.db.js";

/**
 * Genera un número aleatorio entre min y max (inclusivo)
 */
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Genera estadísticas realistas según la posición del jugador
 */
function generarEstadisticasPorPosicion(posicion) {
  const base = {
    goles: 0,
    asistencias: 0,
    tirosAlArco: 0,
    tirosTotales: 0,
    regatesExitosos: 0,
    regatesIntentados: 0,
    pasesCompletados: 0,
    pasesIntentados: 0,
    intercepciones: 0,
    recuperaciones: 0,
    duelosGanados: 0,
    duelosTotales: 0,
    despejes: 0,
    atajadas: 0,
    golesRecibidos: 0,
    arcosInvictos: 0,
    tarjetasAmarillas: 0,
    tarjetasRojas: 0,
    minutosJugados: random(45, 90)
  };

  // Portero
  if (posicion === "Portero") {
    return {
      ...base,
      atajadas: random(2, 8),
      golesRecibidos: random(0, 3),
      arcosInvictos: random(0, 1),
      pasesCompletados: random(15, 30),
      pasesIntentados: random(20, 35),
      despejes: random(1, 4),
      tarjetasAmarillas: random(0, 1) === 1 ? 1 : 0
    };
  }

  // Defensas (todos los tipos)
  if (
    posicion.includes("Defensa") ||
    posicion.includes("Lateral")
  ) {
    return {
      ...base,
      intercepciones: random(3, 8),
      recuperaciones: random(4, 10),
      despejes: random(3, 8),
      duelosGanados: random(4, 10),
      duelosTotales: random(6, 15),
      pasesCompletados: random(25, 45),
      pasesIntentados: random(30, 55),
      asistencias: random(0, 1),
      tirosAlArco: random(0, 1),
      tirosTotales: random(0, 2),
      tarjetasAmarillas: random(0, 2),
      tarjetasRojas: random(0, 1) === 10 ? 1 : 0 // 10% probabilidad
    };
  }

  // Mediocampistas (todos los tipos)
  if (posicion.includes("Mediocentro")) {
    return {
      ...base,
      goles: random(0, 2),
      asistencias: random(0, 3),
      tirosAlArco: random(1, 4),
      tirosTotales: random(2, 6),
      regatesExitosos: random(2, 6),
      regatesIntentados: random(3, 9),
      pasesCompletados: random(30, 55),
      pasesIntentados: random(35, 65),
      intercepciones: random(1, 4),
      recuperaciones: random(3, 8),
      duelosGanados: random(3, 8),
      duelosTotales: random(5, 12),
      tarjetasAmarillas: random(0, 2),
      tarjetasRojas: random(0, 1) === 15 ? 1 : 0 // 6.7% probabilidad
    };
  }

  // Delanteros (Extremos y Delantero Centro)
  if (
    posicion.includes("Extremo") ||
    posicion === "Delantero Centro"
  ) {
    return {
      ...base,
      goles: random(0, 3),
      asistencias: random(0, 2),
      tirosAlArco: random(2, 6),
      tirosTotales: random(4, 10),
      regatesExitosos: random(3, 8),
      regatesIntentados: random(5, 12),
      pasesCompletados: random(15, 30),
      pasesIntentados: random(20, 40),
      recuperaciones: random(1, 4),
      duelosGanados: random(3, 7),
      duelosTotales: random(5, 10),
      tarjetasAmarillas: random(0, 1),
      tarjetasRojas: random(0, 1) === 20 ? 1 : 0 // 5% probabilidad
    };
  }

  return base;
}

/**
 * Crea sesiones de entrenamiento para un grupo si no tiene suficientes
 */
async function crearSesionesParaGrupo(grupoId, cantidadNecesaria) {
  const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);
  
  const sesionesCreadas = [];
  const fechaBase = new Date();
  
  for (let i = 0; i < cantidadNecesaria; i++) {
    const fechaSesion = new Date(fechaBase);
    fechaSesion.setDate(fechaBase.getDate() - (i * 7)); // Una sesión cada 7 días
    
    const sesion = sesionRepo.create({
      grupoId,
      fecha: fechaSesion,
      horaInicio: "17:00:00",
      horaFin: "19:00:00",
      tipoSesion: "Entrenamiento",
      objetivos: "Sesión generada automáticamente para estadísticas históricas"
    });
    
    sesionesCreadas.push(sesion);
  }
  
  return await sesionRepo.save(sesionesCreadas);
}

/**
 * Crea estadísticas para todos los jugadores activos
 */
async function createEstadisticas() {
  try {
    const jugadorRepo = AppDataSource.getRepository(JugadorSchema);
    const estadisticaRepo = AppDataSource.getRepository(EstadisticaBasicaSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    // Verificar si ya existen estadísticas
    const count = await estadisticaRepo.count();
    if (count > 0) {
      console.log("⚠️  Ya existen estadísticas en la base de datos. No se crearán nuevas.");
      return;
    }

    // Obtener todos los jugadores activos con sus grupos
    const jugadores = await jugadorRepo.find({
      where: { estado: "activo" },
      relations: ["jugadorGrupos", "jugadorGrupos.grupo"]
    });

    if (jugadores.length === 0) {
      console.log("⚠️  No hay jugadores activos. No se pueden crear estadísticas.");
      return;
    }

    console.log(`📊 Generando estadísticas para ${jugadores.length} jugadores...`);

    const todasLasEstadisticas = [];
    const ESTADISTICAS_POR_JUGADOR = 10;

    for (const jugador of jugadores) {
      // Obtener el grupo del jugador (tomamos el primero si tiene varios)
      const grupoDelJugador = jugador.jugadorGrupos?.[0]?.grupo;
      
      if (!grupoDelJugador) {
        console.log(`⚠️  Jugador ${jugador.id} no tiene grupo asignado. Se omite.`);
        continue;
      }

      const grupoId = grupoDelJugador.id;

      // Obtener sesiones del grupo (ordenadas por fecha DESC)
      let sesionesDelGrupo = await sesionRepo.find({
        where: { grupoId },
        order: { fecha: "DESC" },
        take: ESTADISTICAS_POR_JUGADOR
      });

      // Si no hay suficientes sesiones, crear las faltantes
      if (sesionesDelGrupo.length < ESTADISTICAS_POR_JUGADOR) {
        const faltantes = ESTADISTICAS_POR_JUGADOR - sesionesDelGrupo.length;
        console.log(`   ℹ️  Creando ${faltantes} sesiones para el grupo ${grupoId}...`);
        
        const nuevasSesiones = await crearSesionesParaGrupo(grupoId, faltantes);
        sesionesDelGrupo = [...sesionesDelGrupo, ...nuevasSesiones];
      }

      // Generar estadísticas para cada sesión
      for (let i = 0; i < ESTADISTICAS_POR_JUGADOR; i++) {
        const sesion = sesionesDelGrupo[i];
        const estadisticas = generarEstadisticasPorPosicion(jugador.posicion);
        
        const estadistica = estadisticaRepo.create({
          jugadorId: jugador.id,
          sesionId: sesion.id,
          fechaRegistro: sesion.fecha,
          ...estadisticas
        });

        todasLasEstadisticas.push(estadistica);
      }
    }

    // Guardar todas las estadísticas
    if (todasLasEstadisticas.length > 0) {
      await estadisticaRepo.save(todasLasEstadisticas);
      console.log(`✅ Se crearon ${todasLasEstadisticas.length} registros de estadísticas`);
      console.log(`   (${ESTADISTICAS_POR_JUGADOR} registros por cada jugador)`);
    } else {
      console.log("⚠️  No se generaron estadísticas (todos los jugadores sin grupo).");
    }

  } catch (error) {
    console.error("❌ Error al crear estadísticas:", error);
    throw error;
  }
}

export { createEstadisticas };