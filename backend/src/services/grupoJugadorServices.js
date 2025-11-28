import { AppDataSource } from "../config/config.db.js";
import GrupoJugadorSchema from "../entity/GrupoJugador.js";
import { ILike } from 'typeorm';

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
export async function obtenerTodosGrupos(filtros = {}) {
  try {
    const repo = AppDataSource.getRepository(GrupoJugadorSchema);

    // Parámetros de paginación
    const page = Math.max(1, filtros.page || 1);
    const limit = Math.min(100, Math.max(1, filtros.limit || 20));
    const skip = (page - 1) * limit;

    // Construir opciones de consulta
    const queryOptions = {
      relations: [
        "jugadorGrupos",
        "jugadorGrupos.jugador",
        "jugadorGrupos.jugador.usuario",
        "jugadorGrupos.jugador.usuario.carrera" // ← Agregar carrera
      ],
      order: { nombre: 'ASC' },
      skip,
      take: limit
    };

    // Aplicar filtro por nombre si se proporciona (case-insensitive)
    if (filtros.nombre) {
      queryOptions.where = {
        nombre: ILike(`%${filtros.nombre}%`)
      };
    }

    // Obtener grupos y total para la paginación
    const [grupos, total] = await repo.findAndCount(queryOptions);

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const paginationMeta = {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null
    };

    return [{ grupos, pagination: paginationMeta }, null];
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
      relations: [
        "jugadorGrupos",
        "jugadorGrupos.jugador",
        "jugadorGrupos.jugador.usuario",
        "jugadorGrupos.jugador.usuario.carrera" 
      ],
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



export async function obtenerGruposParaExportar(filtros = {}) {
  try {
    const repo = AppDataSource.getRepository(GrupoJugadorSchema);

    const where = {};

    if (filtros.nombre) {
      where.nombre = ILike(`%${filtros.nombre}%`);
    }

    const grupos = await repo.find({
      where,
      relations: [
        "jugadorGrupos",
        "jugadorGrupos.jugador",
        "jugadorGrupos.jugador.usuario",
        "jugadorGrupos.jugador.usuario.carrera"
      ],
      order: { nombre: "ASC" },
    });

    return [grupos, null];
  } catch (error) {
    console.error("Error obteniendo grupos para exportar:", error);
    return [null, "Error al obtener grupos para exportar"];
  }
}

export async function obtenerEstadisticasEntrenador() {
  try {
    const grupoRepo = AppDataSource.getRepository(GrupoJugadorSchema);
    
    // Obtener todos los grupos con sus relaciones
    const grupos = await grupoRepo.find({
      relations: [
        "jugadorGrupos",
        "jugadorGrupos.jugador"
      ]
    });

    // Calcular estadísticas
    const totalGrupos = grupos.length;
    
    // Contar jugadores únicos (un jugador puede estar en varios grupos)
    const jugadoresUnicos = new Set();
    grupos.forEach(grupo => {
      grupo.jugadorGrupos?.forEach(jg => {
        if (jg.jugador?.id) {
          jugadoresUnicos.add(jg.jugador.id);
        }
      });
    });
    
    const totalJugadoresInscritos = jugadoresUnicos.size;

    // Obtener detalles de cada grupo
    const detallesGrupos = grupos.map(grupo => ({
      id: grupo.id,
      nombre: grupo.nombre,
      cantidadJugadores: grupo.jugadorGrupos?.length || 0,
      fechaCreacion: grupo.fechaCreacion
    }));

    return [{
      totalGrupos,
      totalJugadoresInscritos,
      grupos: detallesGrupos
    }, null];

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return [null, 'Error al obtener estadísticas'];
  }
}
