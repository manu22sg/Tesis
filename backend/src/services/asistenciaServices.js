import { AppDataSource } from "../config/config.db.js";
import AsistenciaSchema, { ESTADOS_ASISTENCIA } from "../entity/Asistencia.js";
import SesionEntrenamientoSchema from "../entity/SesionEntrenamiento.js";

export async function marcarAsistencia({ sesionId, jugadorId, token, estado, latitud, longitud, origen }) {
  try {
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    // 1) Validar sesión y token
    const sesion = await sesionRepo.findOne({ where: { id: sesionId } });
    if (!sesion) return [null, "Sesión no encontrada", 404];
    const now = new Date();

    if (!sesion.tokenActivo || !sesion.token || sesion.token !== token) {
      return [null, "Token inválido o inactivo", 401];
    }
    if (sesion.tokenExpiracion && now > new Date(sesion.tokenExpiracion)) {
      return [null, "Token expirado", 401];
    }

    // 2) Alta asistencia (única por jugador/sesión). Deja estado por defecto 'presente'
    const nuevo = asistenciaRepo.create({
      jugadorId,
      sesionId,
      estado: estado && ESTADOS_ASISTENCIA.includes(estado) ? estado : "presente",
      latitud,
      longitud,
      origen: origen || "jugador",
    });

    try {
      const guardado = await asistenciaRepo.save(nuevo);
      // opcional: traer con relaciones 
      return [guardado, null, 201];
    } catch (e) {
      // UNIQUE violation (jugadorId, sesionId)
      if (e?.code === "23505" || e?.code === "ER_DUP_ENTRY") {
        return [null, "La asistencia ya fue registrada para este jugador en esta sesión", 409];
      }
      throw e;
    }
  } catch (error) {
    console.error("Error marcando asistencia:", error);
    return [null, "Error al marcar asistencia", 500];
  }
}

export async function actualizarAsistencia(id, { estado, latitud, longitud, origen }) {
  try {
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);
    const asistencia = await asistenciaRepo.findOne({ where: { id } });
    if (!asistencia) return [null, "Asistencia no encontrada", 404];

    asistencia.estado = estado;
    if (latitud !== undefined) asistencia.latitud = latitud;
    if (longitud !== undefined) asistencia.longitud = longitud;
    asistencia.origen = origen || "entrenador";

    const actualizado = await asistenciaRepo.save(asistencia);
    return [actualizado, null, 200];
  } catch (error) {
    console.error("Error actualizando asistencia:", error);
    return [null, "Error al actualizar asistencia", 500];
  }
}

export async function eliminarAsistencia(id) {
  try {
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);
    const asistencia = await asistenciaRepo.findOne({ where: { id } });
    if (!asistencia) return [null, "Asistencia no encontrada", 404];

    await asistenciaRepo.remove(asistencia);
    return [true, null, 200];
  } catch (error) {
    console.error("Error eliminando asistencia:", error);
    return [null, "Error al eliminar asistencia", 500];
  }
}

export async function listarAsistenciasDeSesion(sesionId, { pagina = 1, limite = 10, estado }) {
  try {
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);
    const skip = (pagina - 1) * limite;

    const qb = asistenciaRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.jugador", "jugador")
      .leftJoinAndSelect("jugador.usuario", "usuario")
      .where("a.sesionId = :sesionId", { sesionId });

    if (estado) qb.andWhere("a.estado = :estado", { estado });

    const [items, total] = await qb
      .orderBy("a.id", "ASC")
      .skip(skip)
      .take(limite)
      .getManyAndCount();

    return [{
      asistencias: items,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    }, null, 200];
  } catch (error) {
    console.error("Error listando asistencias:", error);
    return [null, "Error al obtener asistencias", 500];
  }
}
