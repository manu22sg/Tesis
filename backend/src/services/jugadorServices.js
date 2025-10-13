import { AppDataSource } from "../config/config.db.js";
import JugadorSchema from "../entity/Jugador.js";
import JugadorGrupoSchema from "../entity/JugadorGrupo.js";
import UsuarioSchema from "../entity/Usuario.js";
import GrupoJugadorSchema from "../entity/GrupoJugador.js";

// ---------- Services


export async function crearJugador(datosJugador) {
  try {
    const jugadorRepository = AppDataSource.getRepository(JugadorSchema);
    const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);

    const usuario = await usuarioRepository.findOne({
      where: { id: datosJugador.usuarioId }
    });
    if (!usuario) {
      return [null, "El usuario no existe"];
    }

    if (usuario.rol !== "estudiante") {
      return [null, 'Solo usuarios con rol "estudiante" pueden registrarse como jugador'];
    }
    if (usuario.estado !== "activo") {
      return [null, "El usuario no está activo"];
    }

    const jugadorExiste = await jugadorRepository.findOne({
      where: { usuarioId: datosJugador.usuarioId }
    });
    if (jugadorExiste) {
      return [null, "El usuario ya está registrado como jugador"];
    }

    const jugador = jugadorRepository.create(datosJugador);
    const jugadorGuardado = await jugadorRepository.save(jugador);
    return [jugadorGuardado, null];

  } catch (error) {
    console.error("Error creando jugador:", error);

    // Manejo de violación de unicidad (Postgres / MySQL)
    if (error?.code === "23505" || error?.code === "ER_DUP_ENTRY") {
      return [null, "El usuario ya está registrado como jugador"];
    }
    return [null, "Error al crear jugador"];
  }
}
export async function obtenerTodosJugadores(pagina = 1, limite = 10, filtros = {}) {
  try {
    const jugadorRepository = AppDataSource.getRepository(JugadorSchema);
    const skip = (pagina - 1) * limite;

    const queryBuilder = jugadorRepository
      .createQueryBuilder("jugador")
      .leftJoinAndSelect("jugador.usuario", "usuario")
      //  ahora se hace join a la tabla intermedia y luego al grupo
      .leftJoinAndSelect("jugador.jugadorGrupos", "jugadorGrupos")
      .leftJoinAndSelect("jugadorGrupos.grupo", "grupo");

    // Aplicar filtros dinámicos
    if (filtros.estado) {
      queryBuilder.andWhere("jugador.estado = :estado", { estado: filtros.estado });
    }
    if (filtros.carrera) {
      queryBuilder.andWhere("jugador.carrera LIKE :carrera", { carrera: `%${filtros.carrera}%` });
    }
    if (filtros.anioIngreso) {
      queryBuilder.andWhere("jugador.anioIngreso = :anioIngreso", { anioIngreso: filtros.anioIngreso });
    }

    const [jugadores, total] = await queryBuilder
      .skip(skip)
      .take(limite)
      .orderBy("jugador.id", "ASC")
      .getManyAndCount();

    const resultado = {
      jugadores,
      total,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total / limite),
    };

    return [resultado, null];
  } catch (error) {
    console.error("Error obteniendo jugadores:", error);
    return [null, "Error al obtener jugadores"];
  }
}


export async function obtenerJugadorPorId(id) {
  try {
    const jugadorRepository = AppDataSource.getRepository(JugadorSchema);

    const jugador = await jugadorRepository
      .createQueryBuilder("jugador")
      .leftJoinAndSelect("jugador.usuario", "usuario")
      // ahora via tabla intermedia
      .leftJoinAndSelect("jugador.jugadorGrupos", "jugadorGrupos")
      .leftJoinAndSelect("jugadorGrupos.grupo", "grupo")
      // otras relaciones
      .leftJoinAndSelect("jugador.asistencias", "asistencias")
      .leftJoinAndSelect("jugador.evaluaciones", "evaluaciones")
      .leftJoinAndSelect("jugador.estadisticas", "estadisticas")
      .leftJoinAndSelect("jugador.lesiones", "lesiones")
      .where("jugador.id = :id", { id })
      .getOne();

    if (!jugador) {
      return [null, "Jugador no encontrado"];
    }

    return [jugador, null];
  } catch (error) {
    console.error("Error obteniendo jugador:", error);
    return [null, "Error al obtener jugador"];
  }
}
export async function actualizarJugador(id, datosActualizacion) {
  try {
    const jugadorRepository = AppDataSource.getRepository(JugadorSchema);
    
    // Obtener jugador existente
    const [jugadorExistente, error] = await obtenerJugadorPorId(id);
    if (error) return [null, error];

    // Actualizar jugador
    Object.assign(jugadorExistente, datosActualizacion);
    const jugadorActualizado = await jugadorRepository.save(jugadorExistente);

    return [jugadorActualizado, null];
  } catch (error) {
    console.error('Error actualizando jugador:', error);
    return [null, 'Error al actualizar jugador'];
  }
}

export async function eliminarJugador(id) {
  try {
    const jugadorRepository = AppDataSource.getRepository(JugadorSchema);
    
    // Verificar que el jugador existe
    const [jugador, error] = await obtenerJugadorPorId(id);
    if (error) return [null, error];

    await jugadorRepository.remove(jugador);
    return ['Jugador eliminado correctamente', null];
  } catch (error) {
    console.error('Error eliminando jugador:', error);
    return [null, 'Error al eliminar jugador'];
  }
}

export async function asignarJugadorAGrupo(jugadorId, grupoId) {
  try {
    const jugadorRepository = AppDataSource.getRepository(JugadorSchema);
    const grupoRepository = AppDataSource.getRepository(GrupoJugadorSchema);
    const jugadorGrupoRepository = AppDataSource.getRepository(JugadorGrupoSchema);

    const jugador = await jugadorRepository.findOne({ where: { id: jugadorId } });
    if (!jugador) return [null, "Jugador no encontrado"];

    const grupo = await grupoRepository.findOne({ where: { id: grupoId } });
    if (!grupo) return [null, "Grupo no encontrado"];

    // (opcional) más eficiente que save()
    try {
      await jugadorGrupoRepository.insert({ jugadorId, grupoId });
    } catch (e) {
      if (e?.code === "23505" || e?.code === "ER_DUP_ENTRY") {
        return [null, "El jugador ya está asignado a este grupo"]; // 409
      }
      throw e;
    }

    const relacionCompleta = await jugadorGrupoRepository.findOne({
      where: { jugadorId, grupoId },
      relations: ["jugador", "jugador.usuario", "grupo"]
    });

    return [relacionCompleta, null];
  } catch (error) {
    console.error("Error asignando jugador a grupo:", error);
    if (error?.code === "23503") return [null, "El jugador o grupo especificado no existe"];
    return [null, "Error al asignar jugador a grupo"];
  }
}

export async function removerJugadorDeGrupo(jugadorId, grupoId) {
  try {
    const jugadorGrupoRepository = AppDataSource.getRepository(JugadorGrupoSchema);

    const relacion = await jugadorGrupoRepository.findOne({ where: { jugadorId, grupoId } });
    if (!relacion) return [null, "El jugador no está asignado a este grupo"];

    await jugadorGrupoRepository.remove(relacion);
    return ["ok", null];
  } catch (error) {
    console.error("Error removiendo jugador del grupo:", error);
    return [null, "Error al remover jugador del grupo"];
  }
}