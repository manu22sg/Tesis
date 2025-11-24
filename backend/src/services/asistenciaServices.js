import { AppDataSource } from "../config/config.db.js";
import AsistenciaSchema, { ESTADOS_ASISTENCIA } from "../entity/Asistencia.js";
import SesionEntrenamientoSchema from "../entity/SesionEntrenamiento.js";
import { parseDateLocal } from '../utils/dateLocal.js';
import { estaDentroDelRadio } from "../utils/geoLib.js";

export async function marcarAsistenciaPorToken({ token, jugadorId, estado, latitud, longitud, origen }) {
  try {
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    const sesiones = await sesionRepo.find({ where: { token, tokenActivo: true } });
    if (sesiones.length === 0) return [null, "Token inválido o sesión no activa", 404];
    if (sesiones.length > 1) return [null, "Conflicto: más de una sesión usa este token. Contacte al entrenador.", 409];

    const sesion = sesiones[0];
    const now = new Date();

    // Expiración y fin
    if (sesion.tokenExpiracion && now > new Date(sesion.tokenExpiracion)) return [null, "Token expirado", 401];
    const fechaSesion = parseDateLocal(sesion.fecha);
    const [horaFin, minFin] = sesion.horaFin.split(":").map(Number);
    const finSesion = new Date(fechaSesion); finSesion.setHours(horaFin, minFin, 0, 0);
    if (finSesion < now) return [null, "No se puede marcar asistencia para una sesión que ya finalizó", 400];

    // Requerir ubicación SOLO si la sesión fue activada con geofence (coords presentes)
    const requiereGeo = sesion.latitudToken != null && sesion.longitudToken != null;
    if (requiereGeo) {
      // el jugador DEBE mandar su ubicación
      const latFaltante = latitud == null || Number.isNaN(Number(latitud));
      const lngFaltante = longitud == null || Number.isNaN(Number(longitud));
      if (latFaltante || lngFaltante) {
        return [null, "Debe permitir el acceso a su ubicación para marcar asistencia", 400];
      }

      const { dentro, distancia } = estaDentroDelRadio(
        Number(latitud),
        Number(longitud),
        Number(sesion.latitudToken),
        Number(sesion.longitudToken),
        100 // metros
      );
      if (!dentro) {
        return [null, `Debe estar cerca del lugar del entrenamiento`, 403];
      }
    } else {
      // Si NO requiere geofence, ignoramos cualquier lat/lon que venga (no bloqueamos)
      latitud = undefined;
      longitud = undefined;
    }

    // Crear registro de asistencia
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

export async function listarAsistenciasDeSesion(sesionId, { pagina = 1, limite = 50, estado, jugadorId }) {
  try {
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);
    const skip = (pagina - 1) * limite;

    const qb = asistenciaRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.jugador", "jugador")
      .leftJoinAndSelect("jugador.usuario", "usuario")
      .where("a.sesionId = :sesionId", { sesionId });

    if (estado) qb.andWhere("a.estado = :estado", { estado });
    
    // ✅ AGREGAR ESTE FILTRO
    if (jugadorId) qb.andWhere("a.jugadorId = :jugadorId", { jugadorId });

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

export async function registrarAsistenciaManual({ 
  sesionId, 
  jugadorId, 
  estado, 
  observacion 
}) {
  try {
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    // 1. Verificar que la sesión existe
    const sesion = await sesionRepo.findOne({ where: { id: sesionId } });
    if (!sesion) return [null, "Sesión no encontrada", 404];

    

    // 3. Crear asistencia manual (sin validación de geofence ni ubicación)
    const nuevaAsistencia = asistenciaRepo.create({
      jugadorId,
      sesionId,
      estado: estado && ESTADOS_ASISTENCIA.includes(estado) ? estado : "presente",
      origen: "entrenador", 
      latitud: null,
      longitud: null,
      observacion // opcional: para que el entrenador agregue notas
    });

    try {
      const guardado = await asistenciaRepo.save(nuevaAsistencia);
      return [guardado, null, 201];
    } catch (e) {
      if (e?.code === "23505" || e?.code === "ER_DUP_ENTRY") {
        return [null, "Ya existe registro de asistencia para este jugador en esta sesión", 409];
      }
      throw e;
    }
  } catch (error) {
    console.error("Error registrando asistencia manual:", error);
    return [null, "Error al registrar asistencia", 500];
  }
}



export async function listarAsistenciasDeJugador(jugadorId, { pagina = 1, limite = 50, estado, sesionId }) {
  try {
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);
    const skip = (pagina - 1) * limite;

    const qb = asistenciaRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.sesion", "sesion")
      .leftJoinAndSelect("sesion.cancha", "cancha")
      .leftJoinAndSelect("sesion.grupo", "grupo")
      .where("a.jugadorId = :jugadorId", { jugadorId });

    if (estado) qb.andWhere("a.estado = :estado", { estado });
    if (sesionId) qb.andWhere("a.sesionId = :sesionId", { sesionId });

    const [items, total] = await qb
      .orderBy("sesion.fecha", "DESC")
      .addOrderBy("sesion.horaInicio", "DESC")
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
    console.error("Error listando asistencias del jugador:", error);
    return [null, "Error al obtener asistencias del jugador", 500];
  }
}

export async function obtenerEstadisticasAsistenciaJugador(jugadorId) {
  try {
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);

    const asistencias = await asistenciaRepo.find({
      where: { jugadorId }
    });

    const total = asistencias.length;
    const presente = asistencias.filter(a => a.estado === 'presente').length;
    const ausente = asistencias.filter(a => a.estado === 'ausente').length;
    const justificado = asistencias.filter(a => a.estado === 'justificado').length;

    const porcentajePresente = total > 0 ? ((presente / total) * 100).toFixed(1) : 0;
    const porcentajeAusente = total > 0 ? ((ausente / total) * 100).toFixed(1) : 0;
    const porcentajeJustificado = total > 0 ? ((justificado / total) * 100).toFixed(1) : 0;

    return [{
      total,
      presente,
      ausente,
      justificado,
      porcentajePresente,
      porcentajeAusente,
      porcentajeJustificado
    }, null, 200];
  } catch (error) {
    console.error("Error obteniendo estadísticas de asistencia:", error);
    return [null, "Error al obtener estadísticas", 500];
  }
}
