import { AppDataSource } from "../config/config.db.js";
import { Not } from "typeorm";

const EquipoRepo = () => AppDataSource.getRepository("EquipoCampeonato");
const JugadorCampRepo = () => AppDataSource.getRepository("JugadorCampeonato");
const UsuarioRepo = () => AppDataSource.getRepository("Usuario");
const campRepo = () => AppDataSource.getRepository("Campeonato");
const PartidoRepo = () => AppDataSource.getRepository("PartidoCampeonato");


// REGISTRAR EQUIPO (con validaciones de integridad)

export const registrarEquipo = async ({ campeonatoId, nombre, carreraId, tipo }) => {
  return await AppDataSource.transaction(async (trx) => {
    const campRepo = trx.getRepository("Campeonato");
    const equipoRepo = trx.getRepository("EquipoCampeonato");
    const carreraRepo = trx.getRepository("Carrera");

    const camp = await campRepo.findOne({ where: { id: Number(campeonatoId) } });
    if (!camp) throw new Error("El campeonato no existe");
    if (camp.estado !== "creado")
      throw new Error("El campeonato ya no permite inscribir equipos");

    // Validar carrera existente
    const carrera = await carreraRepo.findOne({ where: { id: Number(carreraId) } });
    if (!carrera) throw new Error("La carrera seleccionada no existe");

    // Evitar nombres duplicados en el mismo campeonato
    const existe = await equipoRepo.findOne({
      where: { campeonatoId: Number(campeonatoId), nombre },
    });
    if (existe)
      throw new Error(`Ya existe un equipo con ese nombre en el campeonato "${camp.nombre}"`);

    // Evitar carreras duplicadas en el mismo campeonato
    const repetido = await equipoRepo.findOne({
      where: { campeonatoId: Number(campeonatoId), carreraId: Number(carreraId) },
    });
    if (repetido)
      throw new Error(`La carrera "${carrera.nombre}" ya tiene un equipo inscrito en este campeonato`);

    // Validar tipo según género de campeonato
    const tipoNormalizado = tipo.trim().toLowerCase();
    const generoCamp = camp.genero.trim().toLowerCase();

    const generosPermitidos = ["masculino", "femenino", "mixto"];
    if (!generosPermitidos.includes(tipoNormalizado)) {
      throw new Error("El tipo del equipo debe ser masculino, femenino o mixto");
    }

    if (tipoNormalizado !== generoCamp) {
      throw new Error(
        `El tipo del equipo (${tipoNormalizado}) no coincide con el género del campeonato (${camp.genero})`
      );
    }

    // Crear equipo
    const nuevoEquipo = equipoRepo.create({
      campeonatoId: Number(campeonatoId),
      nombre,
      carreraId: Number(carreraId),
      tipo: tipoNormalizado,
    });

    const guardado = await equipoRepo.save(nuevoEquipo);
    return await equipoRepo.findOne({
  where: { id: guardado.id },
  relations: ["carrera"]
});

  });
};


//  ACTUALIZAR EQUIPO

export const actualizarEquipo = async (equipoId, cambios) => {
  const repo = EquipoRepo();

  const equipo = await repo.findOne({
    where: { id: Number(equipoId) },
    relations: ["campeonato"],
  });
  if (!equipo) throw new Error("Equipo no encontrado");

  // Evitar cambiar campeonato
  if (cambios.campeonatoId && cambios.campeonatoId !== equipo.campeonato.id) {
    throw new Error("No se puede cambiar el campeonato del equipo");
  }

  // Validar tipo si se intenta modificar
  if (cambios.tipo) {
    const tipoNuevo = cambios.tipo.trim().toLowerCase();
    const generoCamp = equipo.campeonato.genero.trim().toLowerCase();

    const generosPermitidos = ["masculino", "femenino", "mixto"];
    if (!generosPermitidos.includes(tipoNuevo)) {
      throw new Error("El tipo del equipo debe ser masculino, femenino o mixto");
    }

    if (tipoNuevo !== generoCamp) {
      throw new Error(
        `El tipo del equipo (${tipoNuevo}) no coincide con el género del campeonato (${equipo.campeonato.genero})`
      );
    }
  }

  // Evitar duplicados por nombre o carrera dentro del mismo campeonato
  if (cambios.nombre || cambios.carreraId) {
    const nombreNuevo = cambios.nombre || equipo.nombre;
    const carreraIdNueva = cambios.carreraId || equipo.carreraId;

    // Nombre duplicado
    const existe = await repo.findOne({
      where: {
        campeonatoId: equipo.campeonato.id,
        nombre: nombreNuevo,
      },
    });
    if (existe && existe.id !== equipo.id) {
      throw new Error(
        `Ya existe un equipo con el nombre "${nombreNuevo}" en este campeonato`
      );
    }

    // Carrera duplicada
    const repetido = await repo.findOne({
      where: {
        campeonatoId: equipo.campeonato.id,
        carreraId: carreraIdNueva,
      },
    });
    if (repetido && repetido.id !== equipo.id) {
      throw new Error(
        `La carrera seleccionada ya tiene un equipo inscrito en este campeonato`
      );
    }
  }

  await repo.update({ id: Number(equipoId) }, cambios);
 return await repo.findOne({
  where: { id: Number(equipoId) },
  relations: ["carrera"]
});

};



//  ELIMINAR EQUIPO (con validación de dependencias)

export const eliminarEquipo = async (equipoId) => {
  const repo = EquipoRepo();
  const partRepo = PartidoRepo();

  const equipo = await repo.findOne({ where: { id: Number(equipoId) } });
  if (!equipo) throw new Error("El equipo no existe");

  // BUSCAR PARTIDOS DONDE EL EQUIPO YA JUGÓ (con resultados)
  const partidosJugados = await partRepo.find({
    where: [
      { equipoAId: Number(equipoId) }, 
      { equipoBId: Number(equipoId) }
    ]
  });

  // Filtrar solo los partidos que ya tienen resultados REALES (finalizados)
  const partidosConResultados = partidosJugados.filter(partido => {
    // Si el estado es 'pendiente', NO tiene resultados (aunque tenga 0-0 inicial)
    if (partido.estado === 'pendiente') {
      return false;
    }

    // Si el estado es 'finalizado' o tiene ganador, SÍ tiene resultados
    if (partido.estado === 'finalizado' || partido.ganadorId !== null) {
      return true;
    }

    // Si tiene marcadores diferentes a null y NO es 0-0 inicial, tiene resultados
    const golesA = partido.golesEquipoA ?? partido.golesA;
    const golesB = partido.golesEquipoB ?? partido.golesB;
    
    // Solo considerar que tiene resultados si:
    // 1. Los goles no son null Y
    // 2. NO es el 0-0 inicial (al menos uno debe ser > 0 O ambos null)
    if (golesA !== null && golesB !== null) {
      // Si ambos son 0 y el estado es pendiente, es valor inicial
      if (golesA === 0 && golesB === 0) {
        return false;
      }
      // Cualquier otro marcador es resultado real
      return true;
    }

    return false;
  });

  if (partidosConResultados.length > 0) {
    throw new Error(
      `No se puede eliminar el equipo "${equipo.nombre}". ` +
      `Ya participó en ${partidosConResultados.length} partido(s) con resultados.`
    );
  }

  // Si el equipo está en partidos pendientes, eliminar esos partidos primero
  if (partidosJugados.length > 0) {
    const partidosPendientes = partidosJugados.filter(p => 
      p.estado === 'pendiente' || 
      (p.golesEquipoA === null && p.golesEquipoB === null)
    );
    
    if (partidosPendientes.length > 0) {
      // Eliminar los partidos pendientes donde participa el equipo
      await partRepo.remove(partidosPendientes);
    }
  }

  // Eliminar el equipo
  await repo.delete({ id: Number(equipoId) });
  
  return { 
    ok: true,
    message: `Equipo "${equipo.nombre}" eliminado exitosamente`
  };
};



//  LISTAR EQUIPOS POR CAMPEONATO

export const listarEquiposPorCampeonato = async (campeonatoId) => {
  const repo = EquipoRepo();
  return await repo.find({
    where: { campeonatoId: Number(campeonatoId) },
    relations: ["jugadores", "carrera"],
    order: { id: "ASC" },
  });
};


//  AGREGAR USUARIO A EQUIPO (con validaciones)

export const insertarUsuarioEnEquipo = async ({
  campeonatoId,
  equipoId,
  usuarioId,
  numeroCamiseta,
  posicion,
}) => {
  const usuarioRepo = UsuarioRepo();
  const equipoRepo = EquipoRepo();
  const jugadorRepo = JugadorCampRepo();
  const campeonatoRepositorio = campRepo();

  // 1. Obtener usuario con carrera
  const usuario = await usuarioRepo.findOne({
    where: { id: Number(usuarioId) },
    relations: ["carrera"],
  });
  if (!usuario) throw new Error("Usuario no existe");

  if (!usuario.carreraId || !usuario.carrera) {
    throw new Error(
      `El usuario ${usuario.nombre} no tiene una carrera asociada en el sistema`
    );
  }

  // 2. Obtener equipo con carrera
  const equipo = await equipoRepo.findOne({
    where: { id: Number(equipoId) },
    relations: ["carrera"],
  });
  if (!equipo) throw new Error("Equipo no encontrado");

  if (equipo.campeonatoId !== Number(campeonatoId))
    throw new Error("El equipo no pertenece a este campeonato");

  if (!equipo.carreraId || !equipo.carrera) {
    throw new Error(
      `El equipo "${equipo.nombre}" no tiene una carrera asociada en el sistema`
    );
  }

  // 3. Obtener campeonato
  const campeonato = await campeonatoRepositorio.findOne({
    where: { id: Number(campeonatoId) }
  });
  if (!campeonato) throw new Error("Campeonato no encontrado");

  // 3.1 VALIDACIÓN DE GÉNERO DEL CAMPEONATO
  const generoCamp = campeonato.genero?.trim().toLowerCase(); // masculino | femenino | mixto
  const sexoUsuario = usuario.sexo?.trim().toLowerCase();

  if (!sexoUsuario) {
    throw new Error(`El usuario ${usuario.nombre} no tiene sexo registrado en el sistema`);
  }

  if (generoCamp !== "mixto") {
    if (sexoUsuario !== generoCamp) {
      throw new Error(
        `Este campeonato es ${generoCamp}. ` +
        `El usuario ${usuario.nombre} es de sexo ${sexoUsuario}, por lo que no puede inscribirse.`
      );
    }
  }

  //  VALIDACIONES DE TIPO DE CAMPEONATO (YA EXISTENTES)
  if (campeonato.tipoCampeonato === 'mechon') {
    const anioActual = new Date().getFullYear();

    if (!usuario.anioIngresoUniversidad) {
      throw new Error(
        `El usuario ${usuario.nombre || ''} ${usuario.apellido || ''} no tiene registrado su año de ingreso a la carrera`
      );
    }

    if (usuario.anioIngresoUniversidad !== anioActual) {
      throw new Error(
        `Este campeonato es solo para mechones del año ${anioActual}. ` +
        `El usuario ${usuario.nombre || ''} ${usuario.apellido || ''} ingresó en ${usuario.anioIngresoUniversidad}`
      );
    }
  } else if (campeonato.tipoCampeonato === 'intercarrera') {
    if (usuario.carreraId !== equipo.carreraId) {
      throw new Error(
        `El usuario ${usuario.nombre} pertenece a la carrera "${usuario.carrera.nombre}" ` +
        `y no puede inscribirse en un equipo de "${equipo.carrera.nombre}"`
      );
    }
  }

  // 4. Validar que no esté en otro equipo
  const yaParticipa = await jugadorRepo.findOne({
    where: {
      campeonatoId: Number(campeonatoId),
      usuarioId: Number(usuarioId),
    },
  });
  if (yaParticipa) {
    throw new Error(
      `El usuario ${usuario.nombre} ya está inscrito en otro equipo de este campeonato`
    );
  }

  // 5. Validar número de camiseta
  if (numeroCamiseta !== null && numeroCamiseta !== undefined) {
    const camisetaRepetida = await jugadorRepo.findOne({
      where: {
        equipoId: Number(equipoId),
        numeroCamiseta: Number(numeroCamiseta),
      },
    });
    if (camisetaRepetida) {
      throw new Error(
        `El número de camiseta ${numeroCamiseta} ya está en uso en este equipo`
      );
    }
  }

  // 6. Validación de límite por formato
  const limites = {
  "5v5":  { min: 10,  max: 20 },
  "7v7":  { min: 14,  max: 28 },
  "8v8":  { min: 16,  max: 32 },  // puedes ajustar el max según tus reglas
  "11v11":{ min: 22, max: 44 }
};
  const formato = campeonato.formato?.toLowerCase();
  const reglas = limites[formato] || limites["11v11"];

  const jugadoresActuales = await jugadorRepo.count({
    where: { equipoId: Number(equipoId) },
  });

  if (jugadoresActuales >= reglas.max) {
    throw new Error(
      `Este equipo ya alcanzó el máximo permitido de jugadores (${reglas.max}) para el formato ${campeonato.formato}`
    );
  }

  // 7. Insertar jugador
  const jugador = jugadorRepo.create({
    campeonatoId: Number(campeonatoId),
    equipoId: Number(equipoId),
    usuarioId: Number(usuarioId),
    numeroCamiseta: numeroCamiseta ?? null,
    posicion: posicion ?? null,
  });

  const guardado = await jugadorRepo.save(jugador);

  return {
    message: `Jugador ${usuario.nombre} agregado al equipo ${equipo.nombre}`,
    jugador: guardado,
  };
};



//  QUITAR USUARIO DE EQUIPO

export const quitarUsuarioDelEquipo = async ({
  campeonatoId,
  equipoId,
  usuarioId,
}) => {
  const repo = JugadorCampRepo();
  await repo.delete({
    campeonatoId: Number(campeonatoId),
    equipoId: Number(equipoId),
    usuarioId: Number(usuarioId),
  });
  return { ok: true };
};


export const listarJugadoresPorEquipo = async (equipoId) => {
  const repo = AppDataSource.getRepository("JugadorCampeonato");
  const equipoRepo = AppDataSource.getRepository("EquipoCampeonato");

  const equipo = await equipoRepo.findOne({
    where: { id: Number(equipoId) },
    relations: ["carrera"],
  });
  if (!equipo) throw new Error("Equipo no encontrado");

  const jugadores = await repo.find({
    where: { equipoId: Number(equipoId) },
    relations: ["usuario", "estadisticas"],
    order: { id: "ASC" },
  });

  return {
    equipo: {
      id: equipo.id,
      nombre: equipo.nombre,
      carreraId: equipo.carreraId,
      carreraNombre: equipo.carrera?.nombre || null,
      tipo: equipo.tipo,
      campeonatoId: equipo.campeonatoId,
    },
    totalJugadores: jugadores.length,
    jugadores: jugadores.map((j) => ({
      id: j.id,
      usuarioId: j.usuarioId,
      nombre: j.usuario?.nombre,
      apellido: j.usuario?.apellido,

      rut: j.usuario?.rut,
      posicion: j.posicion,
      numeroCamiseta: j.numeroCamiseta,
      goles: j.golesCampeonato,
      asistencias: j.asistenciasCampeonato,
      atajadas: j.atajadasCampeonato,
      fechaInscripcion: j.fechaInscripcion,
    })),
  };
};
