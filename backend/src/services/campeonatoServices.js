import { AppDataSource } from "../config/config.db.js";
import { MoreThanOrEqual } from "typeorm";

const CampeonatoRepo = () => AppDataSource.getRepository("Campeonato");
const EquipoRepo = () => AppDataSource.getRepository("EquipoCampeonato");
const PartidoRepo = () => AppDataSource.getRepository("PartidoCampeonato");
const CanchaRepo = () => AppDataSource.getRepository("Cancha");

// -----------------------------------------------------------
// 📘 CREAR CAMPEONATO (con validaciones de reglas de negocio)
// -----------------------------------------------------------
export const crearCampeonato = async (payload) => {
  const repo = CampeonatoRepo();
  const canchaRepo = CanchaRepo();

  // ⚙️ Validaciones básicas
  const { nombre, formato, genero, anio, semestre, entrenadorId } = payload;
  if (!nombre || !formato || !genero || !anio || !semestre) {
    throw new Error("Faltan campos obligatorios para crear el campeonato");
  }

  // ⚠️ Evitar duplicados por año/semestre
  const existe = await repo.findOne({
    where: { nombre, anio, semestre },
  });
  if (existe)
    throw new Error(
      `Ya existe un campeonato llamado "${nombre}" en ${anio}-${semestre}`
    );

  // ⚠️ Evitar múltiples campeonatos activos del mismo tipo/género
  const activo = await repo.findOne({
    where: { formato, genero, estado: "creado" },
  });
  if (activo)
    throw new Error(
      `Ya hay un campeonato activo de formato ${formato} (${genero}). Finaliza el actual antes de crear uno nuevo.`
    );

  // ⚙️ Verificar disponibilidad mínima de canchas
  const minJugadores =
    formato === "11v11" ? 11 : formato === "7v7" ? 7 : 5;
  const canchaValida = await canchaRepo.findOne({
    where: {
      estado: "disponible",
      capacidadMaxima: MoreThanOrEqual(minJugadores),
    },
  });
  if (!canchaValida) {
    throw new Error(
      `No hay canchas disponibles con capacidad para ${minJugadores} jugadores (${formato})`
    );
  }

  // ⚙️ Crear campeonato
  const campeonato = repo.create({
    nombre,
    formato,
    genero,
    anio,
    semestre,
    estado: "creado",
    entrenadorId: entrenadorId || null,
  });

  return await repo.save(campeonato);
};

// -----------------------------------------------------------
//  LISTAR CAMPEONATOS (ordenado por fecha)
// -----------------------------------------------------------
export const listarCampeonatos = async () => {
  const repo = CampeonatoRepo();
  return await repo.find({
    relations: ["equipos", "partidos"],
    order: { fechaCreacion: "DESC" },
  });
};

// -----------------------------------------------------------
//  OBTENER DETALLE
// -----------------------------------------------------------
export const obtenerCampeonato = async (id) => {
  const repo = CampeonatoRepo();
  return await repo.findOne({
    where: { id: Number(id) },
    relations: ["equipos", "partidos"],
  });
};

// -----------------------------------------------------------
//  ACTUALIZAR (con validaciones lógicas)
// -----------------------------------------------------------
export const actualizarCampeonato = async (id, cambios) => {
  const repo = CampeonatoRepo();
  const camp = await repo.findOne({ where: { id: Number(id) } });
  if (!camp) throw new Error("Campeonato no encontrado");

  // Evitar modificar un campeonato finalizado
  if (camp.estado === "finalizado") {
    throw new Error("No se puede modificar un campeonato finalizado");
  }

  await repo.update({ id: Number(id) }, cambios);
  return await obtenerCampeonato(id);
};

// -----------------------------------------------------------
//  ELIMINAR (con validación de dependencias)
// -----------------------------------------------------------
export const eliminarCampeonato = async (id) => {
  const repo = CampeonatoRepo();
  const partRepo = PartidoRepo();
  const equipoRepo = EquipoRepo();

  const camp = await repo.findOne({ where: { id: Number(id) } });
  if (!camp) throw new Error("El campeonato no existe");

  // Permitir eliminar si está finalizado o cancelado
  if (["finalizado", "cancelado"].includes(camp.estado)) {
    await partRepo.delete({ campeonatoId: id });
    await equipoRepo.delete({ campeonatoId: id });
    await repo.delete({ id: Number(id) });
    return { ok: true };
  }

  // Bloquear si tiene equipos o partidos en otros estados
  const equipos = await equipoRepo.count({ where: { campeonatoId: id } });
  const partidos = await partRepo.count({ where: { campeonatoId: id } });

  if (equipos > 0 || partidos > 0) {
    throw new Error(
      "No se puede eliminar un campeonato en curso o con datos activos"
    );
  }

  await repo.delete({ id: Number(id) });
  return { ok: true };
};
