import { AppDataSource } from "../config/config.db.js";
import AsistenciaSchema, { ESTADOS_ASISTENCIA } from "../entity/Asistencia.js";
import SesionEntrenamientoSchema from "../entity/SesionEntrenamiento.js";
import { parseDateLocal } from '../utils/dateLocal.js';


export async function marcarAsistenciaPorToken({ token, jugadorId, estado, latitud, longitud, origen }) {
  try {
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    // 🔍 Buscar sesión activa con este token
    const sesiones = await sesionRepo.find({ where: { token, tokenActivo: true } });

    if (sesiones.length === 0) return [null, "Token inválido o sesión no activa", 404];
    if (sesiones.length > 1) return [null, "Conflicto: más de una sesión usa este token. Contacte al entrenador.", 409];

    const sesion = sesiones[0];
    const now = new Date();

    // ✅ Validar expiración del token
    if (sesion.tokenExpiracion && now > new Date(sesion.tokenExpiracion)) {
      return [null, "Token expirado", 401];
    }

    // ✅ VALIDAR: No marcar asistencia para sesiones que ya terminaron
    const fechaSesion = parseDateLocal(sesion.fecha);
    const [horaFin, minFin] = sesion.horaFin.split(':').map(Number);
    const finSesion = new Date(fechaSesion);
    finSesion.setHours(horaFin, minFin, 0, 0);

    if (finSesion < now) {
      return [null, "No se puede marcar asistencia para una sesión que ya finalizó", 400];
    }

    // 🔒 Crear registro de asistencia
    const nuevaAsistencia = asistenciaRepo.create({
      jugadorId,
      sesionId: sesion.id,
      estado: estado && ESTADOS_ASISTENCIA.includes(estado) ? estado : "presente",
      latitud,
      longitud,
      origen: origen || "jugador",
    });

    try {
      const guardado = await asistenciaRepo.save(nuevaAsistencia);
      return [guardado, null, 201];
    } catch (e) {
      if (e?.code === "23505" || e?.code === "ER_DUP_ENTRY") {
        return [null, "Ya registraste asistencia para esta sesión", 409];
      }
      throw e;
    }
  } catch (error) {
    console.error("Error marcando asistencia por token:", error);
    return [null, "Error al marcar asistencia", 500];
  }
}


export async function actualizarAsistencia(id, { estado, latitud, longitud, origen }) {
  try {
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);
    const asistencia = await asistenciaRepo.findOne({ where: { id } });
    if (!asistencia) return [null, "Asistencia no encontrada", 404];

    // ✅ Validar estado si se proporciona
    if (estado !== undefined) {
      if (!ESTADOS_ASISTENCIA.includes(estado)) {
        return [null, `Estado inválido. Debe ser uno de: ${ESTADOS_ASISTENCIA.join(', ')}`, 400];
      }
      asistencia.estado = estado;
    }

    // Actualizar otros campos opcionales
    if (latitud !== undefined) asistencia.latitud = latitud;
    if (longitud !== undefined) asistencia.longitud = longitud;
    if (origen !== undefined) asistencia.origen = origen;

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
      .orderBy("a.fechaRegistro", "DESC")  
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