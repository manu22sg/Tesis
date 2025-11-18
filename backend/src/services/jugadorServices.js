import { AppDataSource } from "../config/config.db.js";
import JugadorSchema from "../entity/Jugador.js";
import JugadorGrupoSchema from "../entity/JugadorGrupo.js";
import UsuarioSchema from "../entity/Usuario.js";
import GrupoJugadorSchema from "../entity/GrupoJugador.js";
import CarreraSchema from "../entity/Carrera.js";

export async function crearJugador(datosJugador) {
  try {
    const jugadorRepository = AppDataSource.getRepository(JugadorSchema);
    const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);

    const usuario = await usuarioRepository.findOne({
      where: { id: datosJugador.usuarioId },
      relations: ["carrera"] // Incluir carrera para validaciones
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

    // Validar que el estudiante tenga carrera asignada
    if (!usuario.carreraId) {
      return [null, "El estudiante debe tener una carrera asignada"];
    }

    const jugadorExiste = await jugadorRepository.findOne({
      where: { usuarioId: datosJugador.usuarioId }
    });
    
    if (jugadorExiste) {
      return [null, "El usuario ya está registrado como jugador"];
    }

    const jugador = jugadorRepository.create(datosJugador);
    const jugadorGuardado = await jugadorRepository.save(jugador);
    
    // Recargar con relaciones completas
    const jugadorCompleto = await jugadorRepository.findOne({
      where: { id: jugadorGuardado.id },
      relations: ["usuario", "usuario.carrera"]
    });

    return [jugadorCompleto, null];

  } catch (error) {
    console.error("Error creando jugador:", error);

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
      .leftJoinAndSelect("usuario.carrera", "carrera") // Incluir carrera
      .leftJoinAndSelect("jugador.jugadorGrupos", "jugadorGrupos")
      .leftJoinAndSelect("jugadorGrupos.grupo", "grupo");

    // Búsqueda general por nombre o RUT
    if (filtros.q) {
      queryBuilder.andWhere(
        "(usuario.nombre ILIKE :q OR usuario.rut LIKE :q)",
        { q: `%${filtros.q}%` }
      );
    }

    if (filtros.estado) {
      queryBuilder.andWhere("jugador.estado = :estado", { estado: filtros.estado });
    }

    if (filtros.grupoId) {
      queryBuilder.andWhere("grupo.id = :grupoId", { grupoId: filtros.grupoId });
    }

    // ACTUALIZADO: Filtrar por carrera usando el ID de la carrera del usuario
    if (filtros.carreraId) {
      queryBuilder.andWhere("usuario.carreraId = :carreraId", { 
        carreraId: filtros.carreraId 
      });
    }

    // Filtro alternativo: buscar por nombre de carrera
    if (filtros.carreraNombre) {
      queryBuilder.andWhere("LOWER(carrera.nombre) LIKE LOWER(:carreraNombre)", { 
        carreraNombre: `%${filtros.carreraNombre}%` 
      });
    }

    if (filtros.anioIngreso) {
      queryBuilder.andWhere("jugador.anioIngreso = :anioIngreso", { 
        anioIngreso: filtros.anioIngreso 
      });
    }

    // Filtros adicionales útiles
    if (filtros.posicion) {
      queryBuilder.andWhere("jugador.posicion = :posicion", { 
        posicion: filtros.posicion 
      });
    }

    if (filtros.piernaHabil) {
      queryBuilder.andWhere("jugador.piernaHabil = :piernaHabil", { 
        piernaHabil: filtros.piernaHabil 
      });
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
      .leftJoinAndSelect("usuario.carrera", "carrera") // Incluir carrera
      .leftJoinAndSelect("jugador.jugadorGrupos", "jugadorGrupos")
      .leftJoinAndSelect("jugadorGrupos.grupo", "grupo")
      .leftJoinAndSelect("jugador.asistencias", "asistencias")
      .leftJoinAndSelect("jugador.evaluaciones", "evaluaciones")
      .leftJoinAndSelect("jugador.estadisticas", "estadisticas")
      .leftJoinAndSelect("jugador.lesiones", "lesiones")
      .leftJoinAndSelect("jugador.alineaciones", "alineaciones")
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
    
    const [jugadorExistente, error] = await obtenerJugadorPorId(id);
    if (error) return [null, error];

    // Validaciones adicionales si se actualiza información física
    if (datosActualizacion.peso && datosActualizacion.altura) {
      // Calcular IMC automáticamente
      const alturaMetros = datosActualizacion.altura / 100;
      datosActualizacion.imc = (datosActualizacion.peso / (alturaMetros * alturaMetros)).toFixed(2);
    }

    Object.assign(jugadorExistente, datosActualizacion);
    const jugadorActualizado = await jugadorRepository.save(jugadorExistente);

    // Recargar con relaciones
    const jugadorCompleto = await obtenerJugadorPorId(jugadorActualizado.id);
    return jugadorCompleto;

  } catch (error) {
    console.error('Error actualizando jugador:', error);
    return [null, 'Error al actualizar jugador'];
  }
}

export async function eliminarJugador(id) {
  try {
    const jugadorRepository = AppDataSource.getRepository(JugadorSchema);
    
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

    const jugador = await jugadorRepository.findOne({ 
      where: { id: jugadorId },
      relations: ["usuario", "usuario.carrera"]
    });
    if (!jugador) return [null, "Jugador no encontrado"];

    const grupo = await grupoRepository.findOne({ where: { id: grupoId } });
    if (!grupo) return [null, "Grupo no encontrado"];

    try {
      await jugadorGrupoRepository.insert({ jugadorId, grupoId });
    } catch (e) {
      if (e?.code === "23505" || e?.code === "ER_DUP_ENTRY") {
        return [null, "El jugador ya está asignado a este grupo"];
      }
      throw e;
    }

    const relacionCompleta = await jugadorGrupoRepository.findOne({
      where: { jugadorId, grupoId },
      relations: ["jugador", "jugador.usuario", "jugador.usuario.carrera", "grupo"]
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

    const relacion = await jugadorGrupoRepository.findOne({ 
      where: { jugadorId, grupoId } 
    });
    
    if (!relacion) return [null, "El jugador no está asignado a este grupo"];

    await jugadorGrupoRepository.remove(relacion);
    return ["Jugador removido del grupo correctamente", null];
  } catch (error) {
    console.error("Error removiendo jugador del grupo:", error);
    return [null, "Error al remover jugador del grupo"];
  }
}

// NUEVA FUNCIÓN: Obtener estadísticas de jugadores por carrera
export async function obtenerEstadisticasPorCarrera() {
  try {
    const jugadorRepository = AppDataSource.getRepository(JugadorSchema);

    const estadisticas = await jugadorRepository
      .createQueryBuilder("jugador")
      .leftJoin("jugador.usuario", "usuario")
      .leftJoin("usuario.carrera", "carrera")
      .select("carrera.id", "carreraId")
      .addSelect("carrera.nombre", "carreraNombre")
      .addSelect("COUNT(jugador.id)", "totalJugadores")
      .addSelect("COUNT(CASE WHEN jugador.estado = 'activo' THEN 1 END)", "jugadoresActivos")
      .groupBy("carrera.id")
      .addGroupBy("carrera.nombre")
      .getRawMany();

    return [estadisticas, null];
  } catch (error) {
    console.error("Error obteniendo estadísticas por carrera:", error);
    return [null, "Error al obtener estadísticas"];
  }
}