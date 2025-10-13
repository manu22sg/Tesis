import { AppDataSource } from "../config/config.db.js";
import { In } from "typeorm";
import PartidoCampeonatoSchema from "../entity/PartidoCampeonato.js";
import CanchaSchema from "../entity/Cancha.js";
import SesionEntrenamientoSchema from "../entity/SesionEntrenamiento.js";
import ReservaCanchaSchema from "../entity/ReservaCancha.js";
import CampeonatoSchema from "../entity/Campeonato.js";
import { parseDateLocal, formatYMD } from "../utils/dateLocal.js";
  const PartidoRepo = () => AppDataSource.getRepository(PartidoCampeonatoSchema);

 //  Verifica disponibilidad de cancha contra sesiones, reservas y otros partidos
async function verificarDisponibilidadCancha(manager, canchaId, fecha, horaInicio, horaFin) {
  try {
    const fechaLocal = formatYMD(parseDateLocal(fecha));

    const canchaRepo  = manager.getRepository(CanchaSchema);
    const sesionRepo  = manager.getRepository(SesionEntrenamientoSchema);
    const reservaRepo = manager.getRepository(ReservaCanchaSchema);
    const partidoRepo = manager.getRepository(PartidoCampeonatoSchema);

    //  Cancha disponible
    const cancha = await canchaRepo.findOne({ where: { id: canchaId, estado: "disponible" } });
    if (!cancha) return [false, "Cancha inexistente o no disponible"];

    //  Conflictos con sesiones
    const sesiones = await sesionRepo.find({ where: { canchaId, fecha: fechaLocal } });
    for (const s of sesiones) {
      if (hayConflictoHorario({ horaInicio, horaFin }, s)) {
        return [false, `Conflicto con sesión de entrenamiento (ID: ${s.id})`];
      }
    }

    //  Conflictos con reservas pendientes/aprobadas
    const reservas = await reservaRepo.find({
      where: { canchaId, fechaSolicitud: fechaLocal, estado: In(["pendiente", "aprobada"]) },
    });
    for (const r of reservas) {
      if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
        return [false, `Ya existe una reserva (${r.estado}) en ese horario`];
      }
    }

    //  Conflictos con otros partidos programados
    const partidos = await partidoRepo.find({
      where: { canchaId, fecha: fechaLocal, estado: In(["programado", "en_juego"]) },
    });
    for (const p of partidos) {
      if (hayConflictoHorario({ horaInicio, horaFin }, p)) {
        return [false, `Ya existe un partido en la misma cancha y horario (ID: ${p.id})`];
      }
    }

    return [true, null];
  } catch (e) {
    console.error("verificarDisponibilidadCancha error:", e);
    return [false, "Error interno al verificar disponibilidad"];
  }
}

 // Programar un partido: asignar cancha, fecha y hora con validaciones temporales
export async function programarPartido(id, { canchaId, fecha, horaInicio, horaFin }) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const manager = queryRunner.manager;
    const partidoRepo = manager.getRepository(PartidoCampeonatoSchema);
    const campRepo = manager.getRepository(CampeonatoSchema);
    const canchaRepo = manager.getRepository(CanchaSchema);

    const partido = await partidoRepo.findOne({ where: { id: Number(id) } });
    if (!partido) return [null, "Partido no encontrado"];

    const camp = await campRepo.findOne({ where: { id: partido.campeonatoId } });
    if (!camp) return [null, "Campeonato no encontrado"];

    const cancha = await canchaRepo.findOne({ where: { id: canchaId } });
    if (!cancha) return [null, "Cancha no encontrada"];
    if (cancha.estado !== "disponible")
      return [null, "La cancha no está disponible"];

    const minJugadores =
      camp.formato === "11v11" ? 11 : camp.formato === "7v7" ? 7 : 5;
    if (cancha.capacidadMaxima < minJugadores)
      return [null, `La cancha ${cancha.nombre} no soporta formato ${camp.formato}`];

    const fechaLocal = formatYMD(parseDateLocal(fecha));
    const hoy = formatYMD(new Date());
    const ahora = new Date();

    if (fechaLocal < hoy)
      return [null, "No se puede programar un partido en una fecha pasada"];

    if (fechaLocal === hoy) {
      const [h, m] = horaInicio.split(":").map(Number);
      const horaActualMin = ahora.getHours() * 60 + ahora.getMinutes();
      const horaPartidoMin = h * 60 + m;
      if (horaPartidoMin <= horaActualMin)
        return [null, "No se puede programar un partido en una hora ya pasada"];
    }

    const [ok, err] = await verificarDisponibilidadCancha(
      manager,
      canchaId,
      fecha,
      horaInicio,
      horaFin
    );
    if (!ok) return [null, err];

    // 6️⃣ Guardar actualización
    partido.canchaId = canchaId;
    partido.fecha = fechaLocal;
    partido.horaInicio = horaInicio; 
    partido.horaFin = horaFin;      
    partido.estado = "programado";

    const actualizado = await partidoRepo.save(partido);
    await queryRunner.commitTransaction();

    return [actualizado, null];
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Error programando partido:", error);
    return [null, "Error interno del servidor"];
  } finally {
    await queryRunner.release();
  }
}

/** Helper horario */
function hayConflictoHorario(a, b) {
  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const i1 = toMin(a.horaInicio),
    f1 = toMin(a.horaFin);
  const i2 = toMin(b.horaInicio),
    f2 = toMin(b.horaFin);
  return !(f1 <= i2 || f2 <= i1);
}

export const registrarResultado = async ({ partidoId, golesA, golesB }) => {
  const repo = PartidoRepo();
  const partido = await repo.findOne({
    where: { id: Number(partidoId) },
    relations: ["campeonato", "equipoA", "equipoB"],
  });

  if (!partido) throw new Error("Partido no encontrado");

  //  Validar estado
  if (partido.estado === "finalizado")
    throw new Error("El partido ya fue finalizado anteriormente");
  if (!["programado", "en_juego"].includes(partido.estado))
    throw new Error(`No se puede registrar resultado en estado ${partido.estado}`);

  //  Validar goles
  const gA = Number(golesA);
  const gB = Number(golesB);
  if (isNaN(gA) || isNaN(gB) || gA < 0 || gB < 0)
    throw new Error("Los goles deben ser números válidos y no negativos");

  //  Determinar ganador automáticamente
  let ganador = null;
  if (gA > gB) ganador = partido.equipoAId;
  else if (gB > gA) ganador = partido.equipoBId;
  else ganador = null; // empate

  //  Actualizar partido
  partido.golesA = gA;
  partido.golesB = gB;
  partido.ganadorId = ganador;
  partido.estado = "finalizado";

  const actualizado = await repo.save(partido);

  //  (opcional) actualizar estadísticas globales o de jugadores
  // await actualizarEstadisticasGenerales(partido);

  return actualizado;
};



export const obtenerPartidosPorCampeonato = async (campeonatoId, filtros = {}) => {
  const repo = PartidoRepo();

  const where = { campeonatoId: Number(campeonatoId) };
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.ronda) where.ronda = filtros.ronda;

  return await repo.find({
    where,
    relations: ["equipoA", "equipoB", "cancha"],
    order: { id: "ASC" },
  });
};
