import { AppDataSource } from "../config/config.db.js";
import { In,Not } from "typeorm";
import PartidoCampeonatoSchema from "../entity/PartidoCampeonato.js";
import CanchaSchema from "../entity/Cancha.js";
import SesionEntrenamientoSchema from "../entity/SesionEntrenamiento.js";
import ReservaCanchaSchema from "../entity/ReservaCancha.js";
import CampeonatoSchema from "../entity/Campeonato.js";
import { parseDateLocal, formatYMD } from "../utils/dateLocal.js";
import UsuarioSchema from "../entity/Usuario.js";

  const PartidoRepo = () => AppDataSource.getRepository(PartidoCampeonatoSchema);

async function verificarDisponibilidadCancha(manager, canchaId, fecha, horaInicio, horaFin, partidoIdExcluir = null) {
  try {
    const fechaLocal = formatYMD(parseDateLocal(fecha));

    const canchaRepo  = manager.getRepository(CanchaSchema);
    const sesionRepo  = manager.getRepository(SesionEntrenamientoSchema);
    const reservaRepo = manager.getRepository(ReservaCanchaSchema);
    const partidoRepo = manager.getRepository(PartidoCampeonatoSchema);

    //Cancha disponible
    const cancha = await canchaRepo.findOne({ where: { id: canchaId, estado: "disponible" } });
    if (!cancha) return [false, "Cancha inexistente o no disponible"];

    // Conflictos con sesiones
    const sesiones = await sesionRepo.find({ where: { canchaId, fecha: fechaLocal } });
    for (const s of sesiones) {
      if (hayConflictoHorario({ horaInicio, horaFin }, s)) {
        return [false, `Conflicto con sesión programada (${s.horaInicio} - ${s.horaFin})`];
      }
    }

    //Conflictos con reservas pendientes/aprobadas
    const reservas = await reservaRepo.find({
      where: { canchaId, fechaReserva: fechaLocal, estado: In(["aprobada"]) },
    });
    for (const r of reservas) {
      if (hayConflictoHorario({ horaInicio, horaFin }, r)) {
        return [false, `Ya existe una reserva (${r.estado}) en ese horario`];
      }
    }

    //onflictos con otros partidos programados (EXCLUYENDO el actual si se está actualizando)
    const wherePartidos = { 
      canchaId, 
      fecha: fechaLocal, 
      estado: In(["programado", "en_juego"]) 
    };
    
    // Si se está reprogramando, excluir el partido actual
    if (partidoIdExcluir) {
      wherePartidos.id = Not(partidoIdExcluir);
    }

    const partidos = await partidoRepo.find({ where: wherePartidos });
    
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
export async function programarPartido(id, { canchaId, fecha, horaInicio, horaFin, arbitroId }) {
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

    //Solo validar cancha si está cambiando
    if (canchaId && canchaId !== partido.canchaId) {
      const cancha = await canchaRepo.findOne({ where: { id: canchaId } });
      if (!cancha) return [null, "Cancha no encontrada"];
      if (cancha.estado !== "disponible")
        return [null, "La cancha no está disponible"];

      const minJugadores =
        camp.formato === "11v11" ? 22 :
        camp.formato === "8v8"  ? 16  :
        camp.formato === "7v7"  ? 14  :
        10;

      if (cancha.capacidadMaxima < minJugadores)
        return [null, `La cancha ${cancha.nombre} no soporta formato ${camp.formato}`];
    }
    
    if (arbitroId) {
      const usuarioRepo = manager.getRepository(UsuarioSchema);
      const arbitro = await usuarioRepo.findOne({ where: { id: arbitroId } });
      if (!arbitro) return [null, "Árbitro no encontrado"];
    }

    //Usar valores actuales si no se proporcionan nuevos
    const nuevaCanchaId = canchaId ?? partido.canchaId;
    const nuevaFecha = fecha ?? partido.fecha;
    const nuevaHoraInicio = horaInicio ?? partido.horaInicio;
    const nuevaHoraFin = horaFin ?? partido.horaFin;
    partido.arbitroId = arbitroId ?? partido.arbitroId;

    const fechaLocal = formatYMD(parseDateLocal(nuevaFecha));
    const hoy = formatYMD(new Date());
    const ahora = new Date();

    if (fechaLocal < hoy)
      return [null, "No se puede programar un partido en una fecha pasada"];

    if (fechaLocal === hoy) {
      const [h, m] = nuevaHoraInicio.split(":").map(Number);
      const horaActualMin = ahora.getHours() * 60 + ahora.getMinutes();
      const horaPartidoMin = h * 60 + m;
      if (horaPartidoMin <= horaActualMin)
        return [null, "No se puede programar un partido en una hora ya pasada"];
    }

    //Verificar disponibilidad excluyendo el partido actual
    const [ok, err] = await verificarDisponibilidadCancha(
      manager,
      nuevaCanchaId,
      nuevaFecha,
      nuevaHoraInicio,
      nuevaHoraFin,
      id
    );
    if (!ok) return [null, err];

    // Guardar actualización
    partido.canchaId = nuevaCanchaId;
    partido.fecha = fechaLocal;
    partido.horaInicio = nuevaHoraInicio; 
    partido.horaFin = nuevaHoraFin;
    
    // Mantener estado si ya está programado
    if (partido.estado === "pendiente") {
      partido.estado = "programado";
    }

    await partidoRepo.save(partido);
    
    // ✅ CAMBIO IMPORTANTE: Recargar con relaciones ANTES de hacer commit
    const partidoActualizado = await partidoRepo.findOne({
      where: { id: Number(id) },
      relations: ["equipoA", "equipoB", "cancha", "arbitro"]
    });
    
    
    await queryRunner.commitTransaction();

    return [partidoActualizado, null];
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

export const registrarResultado = async ({ 
  partidoId, 
  golesA, 
  golesB, 
  penalesA = null, 
  penalesB = null 
}) => {
  const repo = PartidoRepo();
  const partido = await repo.findOne({
    where: { id: Number(partidoId) },
    relations: ["campeonato", "equipoA", "equipoB"],
  });

  if (!partido) throw new Error("Partido no encontrado");

  // Validar estado
  if (partido.estado === "finalizado")
    throw new Error("El partido ya fue finalizado anteriormente");
  if (!["pendiente", "programado", "en_juego"].includes(partido.estado))
    throw new Error(`No se puede registrar resultado en estado ${partido.estado}`);

  // Validar goles
  const gA = Number(golesA);
  const gB = Number(golesB);
  if (isNaN(gA) || isNaN(gB) || gA < 0 || gB < 0)
    throw new Error("Los goles deben ser números válidos y no negativos");

  //  Validar penales si hay empate
  let ganador = null;
  let definidoPorPenales = false;
  
  if (gA > gB) {
    ganador = partido.equipoAId;
  } else if (gB > gA) {
    ganador = partido.equipoBId;
  } else {
    // EMPATE - Verificar si es eliminación directa
    const esEliminacionDirecta = ["octavos", "cuartos", "semifinal", "final"].includes(
      partido.ronda?.toLowerCase()
    );


    if (esEliminacionDirecta) {
      // En eliminación directa SE REQUIEREN penales
      if (penalesA === null || penalesB === null) {
        console.log(penalesA, penalesB);
        throw new Error(
          "En eliminación directa no puede haber empate. Debes definir el resultado por penales."
        );
      }

      const pA = Number(penalesA);
      const pB = Number(penalesB);

      if (isNaN(pA) || isNaN(pB) || pA < 0 || pB < 0) {
        throw new Error("Los penales deben ser números válidos y no negativos");
      }

      if (pA === pB) {
        throw new Error("Los penales no pueden terminar empatados. Debe haber un ganador.");
      }

      ganador = pA > pB ? partido.equipoAId : partido.equipoBId;
      definidoPorPenales = true;

      partido.penalesA = pA;
      partido.penalesB = pB;
    } else {
      // En fase de grupos puede quedar empate
      ganador = null;
    }
  }

  // Actualizar partido
  partido.golesA = gA;
  partido.golesB = gB;
  partido.ganadorId = ganador;
  partido.definidoPorPenales = definidoPorPenales;
  partido.estado = "finalizado";

  const actualizado = await repo.save(partido);

  return actualizado;
};



export const obtenerPartidosPorCampeonato = async (campeonatoId, filtros = {}) => {
  const repo = PartidoRepo();

  const where = { campeonatoId: Number(campeonatoId) };
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.ronda) where.ronda = filtros.ronda;

  return await repo.find({
    where,
    relations: ["equipoA", "equipoB", "cancha", "arbitro"],
    order: { id: "ASC" },
  });
};


export const obtenerPartidosConRelaciones = async (campeonatoId) => {
  const repo = PartidoRepo();
  return await repo.find({
    where: { campeonatoId: Number(campeonatoId) },
    relations: ["equipoA", "equipoB", "cancha", "arbitro"],
    order: { id: "ASC" }
  });
};