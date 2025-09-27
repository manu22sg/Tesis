import { AppDataSource } from "../config/config.db.js";
import GrupoJugadorSchema from "../entity/GrupoJugador.js";

// Crear grupo
export async function crearGrupo(datosGrupo) {
  try {
    const repo = AppDataSource.getRepository(GrupoJugadorSchema);

    const existe = await repo.findOne({ where: { nombre: datosGrupo.nombre } });
    if (existe) return [null, "Ya existe un grupo con ese nombre"];

    const grupo = repo.create(datosGrupo);
    const guardado = await repo.save(grupo);
    return [guardado, null];
  } catch (error) {
    console.error("Error creando grupo:", error);
    return [null, "Error al crear grupo"];
  }
}

// Obtener todos
export async function obtenerTodosGrupos() {
  try {
    const repo = AppDataSource.getRepository(GrupoJugadorSchema);
    const grupos = await repo.find({ relations: ["jugadorGrupos"] });
    return [grupos, null];
  } catch (error) {
    console.error("Error obteniendo grupos:", error);
    return [null, "Error al obtener grupos"];
  }
}

// Obtener por ID
export async function obtenerGrupoPorId(id) {
  try {
    const repo = AppDataSource.getRepository(GrupoJugadorSchema);
    const grupo = await repo.findOne({
      where: { id },
      relations: ["jugadorGrupos", "jugadorGrupos.jugador"],
    });

    if (!grupo) return [null, "Grupo no encontrado"];
    return [grupo, null];
  } catch (error) {
    console.error("Error obteniendo grupo:", error);
    return [null, "Error al obtener grupo"];
  }
}

// Actualizar
export async function actualizarGrupo(id, datos) {
  try {
    const repo = AppDataSource.getRepository(GrupoJugadorSchema);
    const grupo = await repo.findOne({ where: { id } });
    if (!grupo) return [null, "Grupo no encontrado"];

    Object.assign(grupo, datos);
    const actualizado = await repo.save(grupo);
    return [actualizado, null];
  } catch (error) {
    console.error("Error actualizando grupo:", error);
    return [null, "Error al actualizar grupo"];
  }
}

// Eliminar
export async function eliminarGrupo(id) {
  try {
    const repo = AppDataSource.getRepository(GrupoJugadorSchema);
    const grupo = await repo.findOne({ where: { id } });
    if (!grupo) return [null, "Grupo no encontrado"];

    await repo.remove(grupo);
    return [true, null];
  } catch (error) {
    console.error("Error eliminando grupo:", error);
    return [null, "Error al eliminar grupo"];
  }
}
