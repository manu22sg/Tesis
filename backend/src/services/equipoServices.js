import { AppDataSource } from "../config/config.db.js";
import { Not } from "typeorm";

const EquipoRepo = () => AppDataSource.getRepository("EquipoCampeonato");
const JugadorCampRepo = () => AppDataSource.getRepository("JugadorCampeonato");
const UsuarioRepo = () => AppDataSource.getRepository("Usuario");
const campRepo = () => AppDataSource.getRepository("Campeonato");
const PartidoRepo = () => AppDataSource.getRepository("PartidoCampeonato");


// REGISTRAR EQUIPO (con validaciones de integridad)

export const registrarEquipo = async ({ campeonatoId, nombre, carrera, tipo }) => {
  return await AppDataSource.transaction(async (trx) => {
    const campRepo = trx.getRepository("Campeonato");
    const equipoRepo = trx.getRepository("EquipoCampeonato");
    const jugadorRepo = trx.getRepository("JugadorCampeonato");

    const camp = await campRepo.findOne({ where: { id: Number(campeonatoId) } });
    if (!camp) throw new Error("El campeonato no existe");
    if (camp.estado !== "creado")
      throw new Error("El campeonato ya no permite inscribir equipos");

    // Evitar nombres duplicados
    const existe = await equipoRepo.findOne({
      where: { campeonatoId, nombre },
    });
    if (existe)
throw new Error(`Ya existe un equipo con ese nombre en el campeonato "${camp.nombre}"`);
    //  Evitar carreras duplicadas
    const repetido = await equipoRepo.findOne({
      where: { campeonatoId, carrera },
    });
    if (repetido)
      throw new Error(`La carrera ${carrera} ya tiene un equipo inscrito`);

    // (opcional) tope máximo de equipos, según formato
    const totalEquipos = await equipoRepo.count({ where: { campeonatoId } });
    if (totalEquipos >= 32)
      throw new Error("No se permiten más de 32 equipos en un campeonato");

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
    //  Crear equipo
    const nuevoEquipo = equipoRepo.create({
      campeonatoId,
      nombre,
      carrera,
      tipo: tipoNormalizado,
    });

    const guardado = await equipoRepo.save(nuevoEquipo);

    // Validar jugadores mínimo (posterior, cuando los inscribas)
    const minJugadores =
      camp.formato === "11v11" ? 11 : camp.formato === "7v7" ? 7 : 5;
    const jugadores = await jugadorRepo.count({ where: { equipoId: guardado.id } });
   /* if (jugadores < minJugadores) {
      console.warn(
        ` El equipo ${nombre} tiene menos de ${minJugadores} jugadores (actualmente ${jugadores}).`
      );
    }
*/
    return guardado;
  });
};


//  ACTUALIZAR EQUIPO

export const actualizarEquipo = async (equipoId, cambios) => {
  const repo = EquipoRepo();
  const campRepo = AppDataSource.getRepository("Campeonato");

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
  if (cambios.nombre || cambios.carrera) {
    const existe = await repo.findOne({
      where: {
        campeonatoId: equipo.campeonato.id,
        nombre: cambios.nombre || equipo.nombre,
      },
    });
    if (existe && existe.id !== equipo.id) {
      throw new Error(
        `Ya existe un equipo con el nombre "${cambios.nombre}" en este campeonato`
      );
    }

    const repetido = await repo.findOne({
      where: {
        campeonatoId: equipo.campeonato.id,
        carrera: cambios.carrera || equipo.carrera,
      },
    });
    if (repetido && repetido.id !== equipo.id) {
      throw new Error(
        `La carrera ${cambios.carrera} ya tiene un equipo inscrito en este campeonato`
      );
    }
  }

  // Aplicar cambios válidos
  await repo.update({ id: Number(equipoId) }, cambios);
  return await repo.findOne({ where: { id: Number(equipoId) } });
};



//  ELIMINAR EQUIPO (con validación de dependencias)

export const eliminarEquipo = async (equipoId) => {
  const repo = EquipoRepo();
  const partRepo = PartidoRepo();

  const equipo = await repo.findOne({ where: { id: Number(equipoId) } });
  if (!equipo) throw new Error("El equipo no existe");

  // ✅ BUSCAR PARTIDOS DONDE EL EQUIPO YA JUGÓ (con resultados)
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
    relations: ["jugadores"],
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
  const usuario = await UsuarioRepo().findOne({ where: { id: Number(usuarioId) } });
  if (!usuario) throw new Error("Usuario no existe");

  // Verificar que el equipo pertenezca al mismo campeonato
  const equipo = await EquipoRepo().findOne({ where: { id: Number(equipoId) } });
  if (!equipo) throw new Error("Equipo no encontrado");
  if (equipo.campeonatoId !== Number(campeonatoId))
    throw new Error("El equipo no pertenece a este campeonato");

  // Verificar que el jugador no esté repetido en otro equipo del mismo campeonato
  const yaParticipa = await JugadorCampRepo().findOne({
    where: { campeonatoId: Number(campeonatoId), usuarioId: Number(usuarioId) },
  });
  if (yaParticipa)
    throw new Error("El usuario ya está inscrito en un equipo de este campeonato");

      // Verificar que el número de camiseta no esté repetido en el mismo equipo
  if (numeroCamiseta !== null && numeroCamiseta !== undefined) {
    const camisetaRepetida = await JugadorCampRepo().findOne({
      where: { 
        equipoId: Number(equipoId), 
        numeroCamiseta: Number(numeroCamiseta) 
      },
    });
    if (camisetaRepetida)
      throw new Error(`El número de camiseta ${numeroCamiseta} ya está en uso en este equipo`);
  }

  const repo = JugadorCampRepo();
  const jugador = repo.create({
    campeonatoId: Number(campeonatoId),
    equipoId: Number(equipoId),
    usuarioId: Number(usuarioId),
    numeroCamiseta: numeroCamiseta ?? null,
    posicion: posicion ?? null,
  });

  const guardado = await repo.save(jugador);
  return { message: `Jugador ${usuario.nombre} agregado al equipo ${equipo.nombre}`, jugador: guardado };
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

  // Validar existencia del equipo
  const equipo = await equipoRepo.findOne({ where: { id: Number(equipoId) } });
  if (!equipo) throw new Error("Equipo no encontrado");

  // Buscar jugadores con info de usuario y sus estadísticas
  const jugadores = await repo.find({
    where: { equipoId: Number(equipoId) },
    relations: ["usuario", "estadisticas"],
    order: { id: "ASC" },
  });

  return {
    equipo: {
      id: equipo.id,
      nombre: equipo.nombre,
      carrera: equipo.carrera,
      tipo: equipo.tipo,
      campeonatoId: equipo.campeonatoId,
    },
    totalJugadores: jugadores.length,
    jugadores: jugadores.map((j) => ({
      id: j.id,
      usuarioId: j.usuarioId,
      nombre: j.usuario?.nombre,
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