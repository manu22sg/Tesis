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
      relations: ["jugadorGrupos"], // ← Solo cargar jugadorGrupos, sin usuario anidado
      order: { nombre: 'ASC' },
      skip,
      take: limit
    };

    // Aplicar filtro por nombre si se proporciona (case-insensitive)
    // ILike funciona en PostgreSQL, Like en MySQL/MariaDB es case-insensitive por defecto
    if (filtros.nombre) {
      queryOptions.where = {
        // Usa ILike para PostgreSQL, Like para MySQL/MariaDB
        nombre: ILike(`%${filtros.nombre}%`) // ← Case-insensitive en todos los DB
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
      relations: ["jugadorGrupos", "jugadorGrupos.jugador", "jugadorGrupos.jugador.usuario"],
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



export async function obtenerMiembrosDeGrupo(grupoId, pagina = 1, limite = 10, filtros = {}) {
  try {
    const repo = AppDataSource.getRepository(JugadorGrupoSchema);
    const skip = (pagina - 1) * limite;

    const qb = repo
      .createQueryBuilder("jg")
      .leftJoinAndSelect("jg.jugador", "jugador")
      .leftJoinAndSelect("jugador.usuario", "usuario")
      .where("jg.grupoId = :grupoId", { grupoId });

    // Filtros opcionales sobre Jugador
    if (filtros.estado) qb.andWhere("jugador.estado = :estado", { estado: filtros.estado });
    if (filtros.carrera) qb.andWhere("jugador.carrera ILIKE :carrera", { carrera: `%${filtros.carrera}%` });
    if (filtros.anioIngreso) qb.andWhere("jugador.anioIngreso = :anioIngreso", { anioIngreso: filtros.anioIngreso });

    const [relaciones, total] = await qb
      .orderBy("jugador.id", "ASC")
      .skip(skip)
      .take(limite)
      .getManyAndCount();

    const miembros = relaciones.map(r => ({
      jugadorId: r.jugador.id,
      usuarioId: r.jugador.usuarioId,
      nombre: r.jugador.usuario?.nombre,
      email: r.jugador.usuario?.email,
      carrera: r.jugador.carrera,
      estado: r.jugador.estado,
      anioIngreso: r.jugador.anioIngreso,
      fechaAsignacion: r.fechaAsignacion,
    }));

    return [{
      miembros,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    }, null];

  } catch (error) {
    console.error("Error listando miembros del grupo:", error);
    return [null, "Error al listar miembros del grupo"];
  }
}

