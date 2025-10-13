import { AppDataSource } from '../config/config.db.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';
import GrupoJugadorSchema from '../entity/GrupoJugador.js';
import EntrenamientoSesionSchema from '../entity/EntrenamientoSesion.js';
import { parseDateLocal, formatYMD } from '../utils/dateLocal.js';
import ReservaCanchaSchema  from '../entity/ReservaCancha.js';
import CanchaSchema from '../entity/Cancha.js';
import { In } from 'typeorm';
// Crear una nueva Sesión de Entrenamiento
export async function crearSesion(datos) {
  try {
    const sesionRepo  = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const grupoRepo   = AppDataSource.getRepository(GrupoJugadorSchema);
    const canchaRepo  = AppDataSource.getRepository(CanchaSchema);
    const reservaRepo = AppDataSource.getRepository(ReservaCanchaSchema);

    const { canchaId, grupoId, fecha, horaInicio, horaFin, tipoSesion, objetivos } = datos;

    // 0) Normalizar fecha a YYYY-MM-DD local (importantísimo)
    const fechaLocal = formatYMD(parseDateLocal(fecha));

    // 1) Validar cancha
    if (!canchaId) return [null, 'Debe especificar una cancha'];
    const cancha = await canchaRepo.findOne({ where: { id: canchaId } });
    if (!cancha) return [null, 'Cancha no encontrada'];

    // 2) Validar grupo si viene
    if (grupoId) {
      const grupo = await grupoRepo.findOne({ where: { id: grupoId } });
      if (!grupo) return [null, 'Grupo no encontrado'];
    }

    // 3) Solape con OTRAS sesiones en MISMA cancha y fecha
    const nuevaVentana = { horaInicio, horaFin };
    const sesionesMismaCancha = await sesionRepo.find({ where: { canchaId, fecha: fechaLocal } });
    for (const s of sesionesMismaCancha) {
      if (hayConflictoHorario(nuevaVentana, s)) {
        return [null, `Ya existe una sesión en la misma cancha y horario (id: ${s.id})`];
      }
    }

    // 4) Solape con sesiones del MISMO grupo (si aplica)
    if (grupoId) {
      const sesionesMismoGrupo = await sesionRepo.find({ where: { grupoId, fecha: fechaLocal } });
      for (const s of sesionesMismoGrupo) {
        if (hayConflictoHorario(nuevaVentana, s)) {
          return [null, `Ya existe una sesión para este grupo en ese horario (id: ${s.id})`];
        }
      }
    }

    // 5) Conflicto con reservas de cancha PENDIENTES o APROBADAS (ambas bloquean)
    const reservas = await reservaRepo.find({
      where: { canchaId, fechaSolicitud: fechaLocal, estado: In(['pendiente', 'aprobada']) }
    });
    for (const r of reservas) {
      if (hayConflictoHorario(nuevaVentana, r)) {
        return [null, `Hay una reserva (${r.estado}) en ese horario. Debe gestionar la reserva ID: ${r.id} primero.`];
      }
    }

    // 6) Crear sesión (sin token)
    const sesion = sesionRepo.create({
      canchaId,
      grupoId: grupoId || null,
      fecha: fechaLocal,
      horaInicio,
      horaFin,
      tipoSesion,
      objetivos: objetivos || null,
      token: null,
      tokenActivo: false,
      tokenExpiracion: null,
    });

    const guardada = await sesionRepo.save(sesion);

    // 7) Devolver con relaciones útiles
    const completa = await sesionRepo.findOne({
      where: { id: guardada.id },
      relations: ['grupo', 'cancha'],
    });

    return [completa, null];
  } catch (error) {
    console.error('Error creando sesión:', error);
    return [null, 'Error interno del servidor'];
  }
}



 // Listar sesiones con filtros y paginación
export async function obtenerSesiones(filtros = {}) {
  try {
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    const page = Math.max(1, filtros.page || 1);
    const limit = Math.min(50, Math.max(1, filtros.limit || 10));
    const skip = (page - 1) * limit;

    const where = {};
    if (filtros.fecha) where.fecha = filtros.fecha;
    if (filtros.grupoId) where.grupoId = filtros.grupoId;
    if (filtros.tipoSesion) where.tipoSesion = filtros.tipoSesion;

    const [sesiones, total] = await sesionRepo.findAndCount({
      where,
      relations: ['grupo'],
      order: { fecha: 'ASC', horaInicio: 'ASC' },
      skip, take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };

    return [{ sesiones, pagination }, null];
  } catch (error) {
    console.error('Error obteniendo sesiones:', error);
    return [null, 'Error interno del servidor'];
  }
}

 // Obtener sesión por ID (incluye grupo y bloques/entrenamientos de sesión)
export async function obtenerSesionPorId(id) {
  try {
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    const sesion = await sesionRepo.findOne({
      where: { id },
      relations: ['grupo', 'entrenamientos'],
    });

    if (!sesion) return [null, 'Sesión no encontrada'];
    return [sesion, null];
  } catch (error) {
    console.error('Error obteniendo sesión por ID:', error);
    return [null, 'Error interno del servidor'];
  }
}

 // Actualizar sesión
export async function actualizarSesion(id, datos) {
  try {
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const grupoRepo = AppDataSource.getRepository(GrupoJugadorSchema);
    const reservaRepo = AppDataSource.getRepository(ReservaCanchaSchema);

    const sesion = await sesionRepo.findOne({ where: { id } });
    if (!sesion) return [null, 'Sesión no encontrada'];

    // Validar grupo si cambia
    const nuevoGrupoId = datos.grupoId ?? sesion.grupoId;
    if (nuevoGrupoId) {
      const grupo = await grupoRepo.findOne({ where: { id: nuevoGrupoId } });
      if (!grupo) return [null, 'Grupo no encontrado'];
    }

    // Validar cancha si cambia
    const nuevaCanchaId = datos.canchaId ?? sesion.canchaId;
    if (!nuevaCanchaId) return [null, 'Debe especificar una cancha'];

    // Datos actualizados (fecha/hora)
    const nuevaFecha = datos.fecha || sesion.fecha;
    const horaInicio = datos.horaInicio || sesion.horaInicio;
    const horaFin = datos.horaFin || sesion.horaFin;
    const grupoId = nuevoGrupoId;

    // Validar solapamiento con otras sesiones de la misma cancha y fecha
    const sesionesMismaCancha = await sesionRepo.find({
      where: { canchaId: nuevaCanchaId, fecha: nuevaFecha }
    });

    const nuevaSesionHorario = { horaInicio, horaFin };
    for (const s of sesionesMismaCancha) {
      if (s.id !== id && hayConflictoHorario(nuevaSesionHorario, s)) {
        return [null, `Conflicto con otra sesión en la misma cancha (id: ${s.id})`];
      }
    }

    // Validar solapamiento con sesiones del mismo grupo (si aplica)
    if (grupoId) {
      const mismas = await sesionRepo.find({ where: { grupoId, fecha: nuevaFecha } });
      for (const s of mismas) {
        if (s.id !== id && hayConflictoHorario(nuevaSesionHorario, s)) {
          return [null, `Conflicto con otra sesión del grupo (id: ${s.id})`];
        }
      }
    }

    // Validar conflicto con reservas aprobadas
    const reservas = await reservaRepo.find({
      where: { canchaId: nuevaCanchaId, fechaSolicitud: nuevaFecha, estado: In(['pendiente', 'aprobada'])  }
    });

    for (const r of reservas) {
      if (hayConflictoHorario(nuevaSesionHorario, r)) {
        return [null, `Conflicto con reserva aprobada ID: ${r.id}. Cancele la reserva primero.`];
      }
    }

    // Actualizar (sin tocar token acá)
    Object.keys(datos).forEach(k => {
      if (datos[k] !== undefined && !['token', 'tokenActivo', 'tokenExpiracion'].includes(k)) {
        sesion[k] = datos[k];
      }
    });

    const actualizada = await sesionRepo.save(sesion);
    return [actualizada, null];
  } catch (error) {
    console.error('Error actualizando sesión:', error);
    return [null, 'Error interno del servidor'];
  }
}

 // Eliminar sesión
export async function eliminarSesion(id) {
  try {
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const sesion = await sesionRepo.findOne({ where: { id } });
    if (!sesion) return [null, 'Sesión no encontrada'];

    await sesionRepo.remove(sesion);
    return [{ message: 'Sesión eliminada correctamente' }, null];
  } catch (error) {
    console.error('Error eliminando sesión:', error);
    return [null, 'Error interno del servidor'];
  }
}

 // Crear sesiones recurrentes (ej: Lunes y Miércoles)
export async function crearSesionesRecurrentes(datos) {
  try {
    const { grupoId, canchaId, fechaInicio, fechaFin, diasSemana, horaInicio, horaFin, tipoSesion, objetivos } = datos;

    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const grupoRepo = AppDataSource.getRepository(GrupoJugadorSchema);
    const reservaRepo = AppDataSource.getRepository(ReservaCanchaSchema);

    // Validar grupo si corresponde
    if (grupoId) {
      const grupo = await grupoRepo.findOne({ where: { id: grupoId } });
      if (!grupo) return [null, 'Grupo no encontrado'];
    }

    // Validar cancha
    if (!canchaId) return [null, 'Debe especificar una cancha'];

    const creadas = [];
    const errores = [];

    const inicio = parseDateLocal(fechaInicio);
    const fin = parseDateLocal(fechaFin);

    for (let f = new Date(inicio); f <= fin; f.setDate(f.getDate() + 1)) {
      const dia = f.getDay(); // 0=Dom ... 6=Sáb
      if (diasSemana.includes(dia)) {
        const fechaStr = formatYMD(f);

        const nueva = { horaInicio, horaFin };

        // 1. Validar solapamiento con otras sesiones en la misma cancha
        const mismasCancha = await sesionRepo.find({ where: { canchaId, fecha: fechaStr } });
        let conflicto = mismasCancha.some(s => hayConflictoHorario(nueva, s));
        if (conflicto) {
          errores.push({ fecha: fechaStr, error: 'Conflicto con otra sesión en la misma cancha' });
          continue;
        }

        // 2. Validar solapamiento con otras sesiones del mismo grupo
        if (grupoId) {
          const mismasGrupo = await sesionRepo.find({ where: { grupoId, fecha: fechaStr } });
          conflicto = mismasGrupo.some(s => hayConflictoHorario(nueva, s));
          if (conflicto) {
            errores.push({ fecha: fechaStr, error: 'Conflicto con sesión del mismo grupo' });
            continue;
          }
        }

        // 3. Validar conflicto con reservas aprobadas
        const reservas = await reservaRepo.find({
          where: { canchaId, fechaSolicitud: fechaStr, estado: 'aprobada' }
        });
        conflicto = reservas.some(r => hayConflictoHorario(nueva, r));
        if (conflicto) {
          errores.push({ fecha: fechaStr, error: 'Conflicto con reserva aprobada' });
          continue;
        }

        // 4. Crear sesión
        const sesion = sesionRepo.create({
          grupoId: grupoId || null,
          canchaId,
          fecha: fechaStr,
          horaInicio,
          horaFin,
          tipoSesion,
          objetivos: objetivos || null,
          token: null,
          tokenActivo: false,
          tokenExpiracion: null,
        });

        const g = await sesionRepo.save(sesion);
        creadas.push(g);
      }
    }

    return [{
      sesionesCreadas: creadas.length,
      sesiones: creadas,
      errores: errores.length ? errores : null,
    }, null];
  } catch (error) {
    console.error('Error creando sesiones recurrentes:', error);
    return [null, 'Error interno del servidor'];
  }
}


// Helpers
function hayConflictoHorario(a, b) {
  const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
  const i1 = toMin(a.horaInicio), f1 = toMin(a.horaFin);
  const i2 = toMin(b.horaInicio), f2 = toMin(b.horaFin);
  return !(f1 <= i2 || f2 <= i1);
}
