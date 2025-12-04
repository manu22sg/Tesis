import { AppDataSource } from '../config/config.db.js';
import SesionEntrenamientoSchema from '../entity/SesionEntrenamiento.js';
import GrupoJugadorSchema from '../entity/GrupoJugador.js';
import JugadorSchema from '../entity/Jugador.js';
import JugadorGrupoSchema from '../entity/JugadorGrupo.js';
import AsistenciaSchema from '../entity/Asistencia.js';
import { parseDateLocal, formatYMD } from '../utils/dateLocal.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import CanchaSchema from '../entity/Cancha.js';
import PartidoCampeonatoSchema from '../entity/PartidoCampeonato.js'; 
import { In } from 'typeorm';
import { 
  esCanchaPrincipal, 
  obtenerDivisiones 
} from './canchaHierarchyservices.js';

function hayConflictoHorario(a, b) {
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const i1 = toMin(a.horaInicio), f1 = toMin(a.horaFin);
  const i2 = toMin(b.horaInicio), f2 = toMin(b.horaFin);
  return !(f1 <= i2 || f2 <= i1);
}

// Crear una nueva Sesión de Entrenamiento
export async function crearSesion(datos) {
  try {
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const grupoRepo = AppDataSource.getRepository(GrupoJugadorSchema);
    const canchaRepo = AppDataSource.getRepository(CanchaSchema);
    const reservaRepo = AppDataSource.getRepository(ReservaCanchaSchema);
    const partidoRepo = AppDataSource.getRepository(PartidoCampeonatoSchema);

    const { canchaId, grupoId, fecha, horaInicio, horaFin, tipoSesion, objetivos, ubicacionExterna } = datos;

    // 0) Normalizar fecha
    const fechaLocal = formatYMD(parseDateLocal(fecha));

    // 1) Validar que haya cancha O ubicación externa
    if (!canchaId && (!ubicacionExterna || ubicacionExterna.trim() === '')) {
      return [null, 'Debe especificar una cancha o una ubicación externa'];
    }

    // 2) Validar cancha SOLO si viene
    if (canchaId) {
      const cancha = await canchaRepo.findOne({ where: { id: canchaId } });
      if (!cancha) return [null, 'Cancha no encontrada'];
      
      if (!esCanchaPrincipal(cancha)) {
        return [null, 'Las sesiones solo pueden programarse en la Cancha Principal'];
      }
    }

    // 🆕 3) DEFINIR VENTANA HORARIA
    const nuevaVentana = { horaInicio, horaFin };

    // 4) Validaciones de conflictos SOLO si hay cancha
    if (canchaId) {
      // Conflicto con reservas en la Principal
      const reservas = await reservaRepo.find({
        where: { canchaId, fechaReserva: fechaLocal, estado: In(['aprobada']) }
      });
      for (const r of reservas) {
        if (hayConflictoHorario(nuevaVentana, r)) {
          return [null, `Hay una reserva en ese horario. Debe gestionar la reserva primero.`];
        }
      }

      // Conflicto con partidos EN LA PRINCIPAL
      const partidos = await partidoRepo.find({
        where: { canchaId, fecha: fechaLocal, estado: In(['programado', 'en_juego']) }
      });
      for (const p of partidos) {
        if (hayConflictoHorario(nuevaVentana, p)) {
          return [null, `Ya existe un partido de campeonato en ese horario. Debe reprogramar el partido primero.`];
        }
      }

      // ✅ Validar que NO haya reservas o partidos en NINGUNA división
      const divisiones = await obtenerDivisiones();

      for (const div of divisiones) {
        // Verificar reservas en divisiones
        const reservasDiv = await reservaRepo.find({
          where: { 
            canchaId: div.id, 
            fechaReserva: fechaLocal, 
            estado: In(['aprobada']) 
          }
        });
        
        for (const r of reservasDiv) {
          if (hayConflictoHorario(nuevaVentana, r)) {
            return [null, `Hay una reserva activa en ${div.nombre} en ese horario`];
          }
        }

        // Verificar partidos en divisiones
        const partidosDiv = await partidoRepo.find({
          where: { 
            canchaId: div.id, 
            fecha: fechaLocal, 
            estado: In(['programado', 'en_juego']) 
          }
        });
        
        for (const p of partidosDiv) {
          if (hayConflictoHorario(nuevaVentana, p)) {
            return [null, `Hay un partido programado en ${div.nombre} en ese horario`];
          }
        }
      }
    }

    // 5) Solape con sesiones del MISMO grupo
    if (grupoId) {
      const sesionesMismoGrupo = await sesionRepo.find({ 
        where: { grupoId, fecha: fechaLocal } 
      });
      for (const s of sesionesMismoGrupo) {
        if (hayConflictoHorario(nuevaVentana, s)) {
          return [null, `Ya existe una sesión para este grupo en ese horario`];
        }
      }
    }

    // 6) Crear sesión
    const sesion = sesionRepo.create({
      canchaId: canchaId || null,
      ubicacionExterna: ubicacionExterna || null,
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

    // 7) Devolver con relaciones
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

    const page  = Math.max(1, filtros.page || 1);
    const limit = Math.min(50, Math.max(1, filtros.limit || 10));
    const skip  = (page - 1) * limit;

    const q     = (filtros.q || '').trim().toLowerCase();
    const fecha = filtros.fecha ? formatYMD(parseDateLocal(filtros.fecha)) : null;
    const canchaId = filtros.canchaId ? parseInt(filtros.canchaId) : null;
    const grupoId = filtros.grupoId ? parseInt(filtros.grupoId) : null;
    const tipoSesion = filtros.tipoSesion ? filtros.tipoSesion.trim() : null;
    const jugadorId = filtros.jugadorId ? parseInt(filtros.jugadorId) : null; 

    const qb = sesionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.grupo', 'g')
      .leftJoinAndSelect('s.cancha', 'c');

    if (jugadorId) {
      qb.leftJoin('g.jugadorGrupos', 'jg')
        .leftJoin('jg.jugador', 'j')
        .andWhere('j.id = :jugadorId', { jugadorId });
    }
   //const hoy = formatYMD(new Date());
    //qb.andWhere('s.fecha >= :hoy', { hoy });


    qb.orderBy('s.fecha', 'ASC')
      .addOrderBy('s.horaInicio', 'ASC')
      .skip(skip)
      .take(limit);

    if (q) {
      qb.andWhere(`
        (LOWER(s.tipoSesion) LIKE :q 
         OR LOWER(g.nombre) LIKE :q 
         OR LOWER(c.nombre) LIKE :q
         OR LOWER(s.ubicacionExterna) LIKE :q)
      `, { q: `%${q}%` });
    }

    if (fecha) qb.andWhere(`s.fecha = :fecha`, { fecha });
    if (canchaId) qb.andWhere(`s.canchaId = :canchaId`, { canchaId });
    if (grupoId) qb.andWhere(`s.grupoId = :grupoId`, { grupoId });
    if (tipoSesion) qb.andWhere(`LOWER(s.tipoSesion) = :tipoSesion`, { tipoSesion: tipoSesion.toLowerCase() });

    const horaInicio = filtros.horaInicio ? filtros.horaInicio.trim() : null;
    const horaFin = filtros.horaFin ? filtros.horaFin.trim() : null;

    if (horaInicio && horaFin) {
      qb.andWhere(
        `(
          (s.horaInicio >= :horaInicio AND s.horaInicio < :horaFin) OR 
          (s.horaFin > :horaInicio AND s.horaFin <= :horaFin) OR 
          (s.horaInicio <= :horaInicio AND s.horaFin >= :horaFin)
        )`,
        { horaInicio, horaFin }
      );
    }

    const [sesiones, total] = await qb.getManyAndCount();

    //  NUEVO: Agregar campo tokenVigente calculado
    const ahora = new Date();
    const sesionesProcesadas = sesiones.map(sesion => {
      const tokenVigente = sesion.tokenActivo && 
                          sesion.tokenExpiracion && 
                          new Date(sesion.tokenExpiracion) > ahora;
      
      return {
        ...sesion,
        tokenVigente, //  Campo calculado
      };
    });

    const pagination = {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };

    return [{ sesiones: sesionesProcesadas, pagination }, null];
  } catch (error) {
    console.error('Error obteniendo sesiones:', error);
    return [null, 'Error interno del servidor'];
  }
}


// Obtener sesión por ID
export async function obtenerSesionPorId(id) {
  try {
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);

    const sesion = await sesionRepo.findOne({
      where: { id },
      relations: ['grupo', 'cancha', 'entrenamientos'],
    });

    if (!sesion) return [null, 'Sesión no encontrada'];

    const ahora = new Date();
    const tokenVigente = sesion.tokenActivo && 
                        sesion.tokenExpiracion && 
                        new Date(sesion.tokenExpiracion) > ahora;

    return [{ ...sesion, tokenVigente }, null];
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
    const canchaRepo = AppDataSource.getRepository(CanchaSchema);
    const reservaRepo = AppDataSource.getRepository(ReservaCanchaSchema);
    const partidoRepo = AppDataSource.getRepository(PartidoCampeonatoSchema);
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);

    const sesion = await sesionRepo.findOne({ where: { id } });
    if (!sesion) return [null, 'Sesión no encontrada'];

    // Validar cambio de grupo con asistencias
    if (datos.grupoId && datos.grupoId !== sesion.grupoId) {
      const tieneAsistencias = await asistenciaRepo.count({
        where: { sesionId: id },
      });

      if (tieneAsistencias > 0) {
        return [null, 'No se puede cambiar el grupo: ya existen asistencias registradas'];
      }
    }

    // Validar grupo si cambia
    const nuevoGrupoId = datos.grupoId ?? sesion.grupoId;
    if (nuevoGrupoId) {
      const grupo = await grupoRepo.findOne({ where: { id: nuevoGrupoId } });
      if (!grupo) return [null, 'Grupo no encontrado'];
    }

    // Validar cancha / ubicación
    const nuevaCanchaId =
      datos.canchaId !== undefined ? datos.canchaId : sesion.canchaId;
    const nuevaUbicacion =
      datos.ubicacionExterna !== undefined
        ? datos.ubicacionExterna
        : sesion.ubicacionExterna;

    if (!nuevaCanchaId && (!nuevaUbicacion || nuevaUbicacion.trim() === '')) {
      return [null, 'Debe especificar una cancha o una ubicación externa'];
    }

    // ✅ VALIDAR CANCHA SI EXISTE
    if (nuevaCanchaId) {
      const cancha = await canchaRepo.findOne({ where: { id: nuevaCanchaId } });
      if (!cancha) return [null, 'Cancha no encontrada'];
      
      // ✅ DESCOMENTAR: Las sesiones DEBEN ser en la Principal
      if (!esCanchaPrincipal(cancha)) {
        return [null, 'Las sesiones solo pueden programarse en la Cancha Principal'];
      }
    }

    // Datos "virtuales" para validar conflictos
    const nuevaFecha = datos.fecha || sesion.fecha;
    const horaInicio = datos.horaInicio || sesion.horaInicio;
    const horaFin = datos.horaFin || sesion.horaFin;
    const grupoId = nuevoGrupoId;

    const nuevaSesionHorario = { horaInicio, horaFin };

    // Validaciones de conflictos SOLO si hay cancha
    if (nuevaCanchaId) {
      // Validar con otras sesiones en la misma cancha
      const sesionesMismaCancha = await sesionRepo.find({
        where: { canchaId: nuevaCanchaId, fecha: nuevaFecha },
      });

      for (const s of sesionesMismaCancha) {
        if (s.id !== id && hayConflictoHorario(nuevaSesionHorario, s)) {
          return [null, `Conflicto con otra sesión en la misma cancha`];
        }
      }

      // Validar con reservas en la Principal
      const reservas = await reservaRepo.find({
        where: {
          canchaId: nuevaCanchaId,
          fechaReserva: nuevaFecha,
          estado: In(['aprobada']),
        },
      });
      for (const r of reservas) {
        if (hayConflictoHorario(nuevaSesionHorario, r)) {
          return [
            null,
            `Conflicto con reserva (${r.estado}). Debe gestionar la reserva primero.`,
          ];
        }
      }

      // Validar con partidos en la Principal
      const partidos = await partidoRepo.find({
        where: {
          canchaId: nuevaCanchaId,
          fecha: nuevaFecha,
          estado: In(['programado', 'en_juego']),
        },
      });
      for (const p of partidos) {
        if (hayConflictoHorario(nuevaSesionHorario, p)) {
          return [null, `Conflicto con partido de campeonato`];
        }
      }

      // 🆕 VALIDAR: No puede haber reservas o partidos en NINGUNA división
      const divisiones = await obtenerDivisiones();

      for (const div of divisiones) {
        // Verificar reservas en divisiones
        const reservasDiv = await reservaRepo.find({
          where: { 
            canchaId: div.id, 
            fechaReserva: nuevaFecha, 
            estado: In(['aprobada']) 
          }
        });
        
        for (const r of reservasDiv) {
          if (hayConflictoHorario(nuevaSesionHorario, r)) {
            return [null, `Hay una reserva activa en ${div.nombre} en ese horario`];
          }
        }

        // Verificar partidos en divisiones
        const partidosDiv = await partidoRepo.find({
          where: { 
            canchaId: div.id, 
            fecha: nuevaFecha, 
            estado: In(['programado', 'en_juego']) 
          }
        });
        
        for (const p of partidosDiv) {
          if (hayConflictoHorario(nuevaSesionHorario, p)) {
            return [null, `Hay un partido programado en ${div.nombre} en ese horario`];
          }
        }
      }
    }

    // Validar solapamiento con sesiones del mismo grupo
    if (grupoId) {
      const mismas = await sesionRepo.find({
        where: { grupoId, fecha: nuevaFecha },
      });
      for (const s of mismas) {
        if (s.id !== id && hayConflictoHorario(nuevaSesionHorario, s)) {
          return [null, `Conflicto con otra sesión del grupo`];
        }
      }
    }

    // Detectar si cambia fecha u horario respecto a BD
    const cambioFecha =
      nuevaFecha && sesion.fecha && String(nuevaFecha) !== String(sesion.fecha);
    const cambioHoraInicio =
      horaInicio &&
      sesion.horaInicio &&
      String(horaInicio) !== String(sesion.horaInicio);
    const cambioHoraFin =
      horaFin && sesion.horaFin && String(horaFin) !== String(sesion.horaFin);

    const debeResetearRecordatorio =
      cambioFecha || cambioHoraInicio || cambioHoraFin;

    // Aplicar cambios reales desde datos
    Object.keys(datos).forEach((k) => {
      if (
        datos[k] !== undefined &&
        !['token', 'tokenActivo', 'tokenExpiracion'].includes(k)
      ) {
        sesion[k] = datos[k];
      }
    });

    if (debeResetearRecordatorio) {
      sesion.recordatorio24hEnviado = false;
    }

    const actualizada = await sesionRepo.save(sesion);
    return [actualizada, null];
  } catch (error) {
    console.error('Error actualizando sesión:', error);
    return [null, 'Error interno del servidor'];
  }
}


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

// Crear sesiones recurrentes
export async function crearSesionesRecurrentes(datos) {
  try {
    const { grupoId, canchaId, fechaInicio, fechaFin, diasSemana, horaInicio, horaFin, tipoSesion, objetivos, ubicacionExterna } = datos;

    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const grupoRepo = AppDataSource.getRepository(GrupoJugadorSchema);
    const canchaRepo = AppDataSource.getRepository(CanchaSchema);
    const reservaRepo = AppDataSource.getRepository(ReservaCanchaSchema);
    const partidoRepo = AppDataSource.getRepository(PartidoCampeonatoSchema);

    // Validar que haya cancha O ubicación externa
    if (!canchaId && (!ubicacionExterna || ubicacionExterna.trim() === '')) {
      return [null, 'Debe especificar una cancha o una ubicación externa'];
    }

    // Validar grupo
    if (grupoId) {
      const grupo = await grupoRepo.findOne({ where: { id: grupoId } });
      if (!grupo) return [null, 'Grupo no encontrado'];
    }

    // ✅ Validar cancha si existe
    if (canchaId) {
      const cancha = await canchaRepo.findOne({ where: { id: canchaId } });
      if (!cancha) return [null, 'Cancha no encontrada'];
      
      // 🆕 VALIDAR: Las sesiones DEBEN ser en la Principal
      if (!esCanchaPrincipal(cancha)) {
        return [null, 'Las sesiones solo pueden programarse en la Cancha Principal'];
      }
    }

    const creadas = [];
    const errores = [];

    const inicio = parseDateLocal(fechaInicio);
    const fin = parseDateLocal(fechaFin);

    for (let f = new Date(inicio); f <= fin; f.setDate(f.getDate() + 1)) {
      const dia = f.getDay();
      if (diasSemana.includes(dia)) {
        const fechaStr = formatYMD(f);
        const nueva = { horaInicio, horaFin };
        let conflicto = false;

        // Validaciones SOLO si hay cancha
        if (canchaId) {
          // Validar con otras sesiones
          const mismasCancha = await sesionRepo.find({ where: { canchaId, fecha: fechaStr } });
          conflicto = mismasCancha.some(s => hayConflictoHorario(nueva, s));
          if (conflicto) {
            errores.push({ fecha: fechaStr, error: 'Conflicto con otra sesión en la misma cancha' });
            continue;
          }

          // Validar con reservas en la Principal
          const reservas = await reservaRepo.find({
            where: { canchaId, fechaReserva: fechaStr, estado: In(['aprobada']) }
          });
          conflicto = reservas.some(r => hayConflictoHorario(nueva, r));
          if (conflicto) {
            errores.push({ fecha: fechaStr, error: 'Conflicto con reserva aprobada' });
            continue;
          }

          // Validar con partidos en la Principal
          const partidos = await partidoRepo.find({
            where: { canchaId, fecha: fechaStr, estado: In(['programado', 'en_juego']) }
          });
          conflicto = partidos.some(p => hayConflictoHorario(nueva, p));
          if (conflicto) {
            errores.push({ fecha: fechaStr, error: 'Conflicto con partido de campeonato' });
            continue;
          }

          // 🆕 VALIDAR: No puede haber reservas o partidos en NINGUNA división
          const divisiones = await obtenerDivisiones();

          for (const div of divisiones) {
            // Verificar reservas en divisiones
            const reservasDiv = await reservaRepo.find({
              where: { 
                canchaId: div.id, 
                fechaReserva: fechaStr, 
                estado: In(['aprobada']) 
              }
            });
            
            conflicto = reservasDiv.some(r => hayConflictoHorario(nueva, r));
            if (conflicto) {
              errores.push({ fecha: fechaStr, error: `Hay una reserva activa en ${div.nombre} en ese horario` });
              break; // Salir del for de divisiones
            }

            // Verificar partidos en divisiones
            const partidosDiv = await partidoRepo.find({
              where: { 
                canchaId: div.id, 
                fecha: fechaStr, 
                estado: In(['programado', 'en_juego']) 
              }
            });
            
            conflicto = partidosDiv.some(p => hayConflictoHorario(nueva, p));
            if (conflicto) {
              errores.push({ fecha: fechaStr, error: `Hay un partido programado en ${div.nombre} en ese horario` });
              break; // Salir del for de divisiones
            }
          }

          // Si hubo conflicto en alguna división, saltar esta fecha
          if (conflicto) continue;
        }

        // Validar con sesiones del mismo grupo
        if (grupoId) {
          const mismasGrupo = await sesionRepo.find({ where: { grupoId, fecha: fechaStr } });
          conflicto = mismasGrupo.some(s => hayConflictoHorario(nueva, s));
          if (conflicto) {
            errores.push({ fecha: fechaStr, error: 'Conflicto con sesión del mismo grupo' });
            continue;
          }
        }

        // Crear sesión
        const sesion = sesionRepo.create({
          grupoId: grupoId || null,
          canchaId: canchaId || null,
          ubicacionExterna: ubicacionExterna || null,
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


export async function obtenerSesionesPorEstudiante(usuarioId, filtros = {}) {
  try {
    const sesionRepo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const jugadorRepo = AppDataSource.getRepository(JugadorSchema);
    const jugadorGrupoRepo = AppDataSource.getRepository(JugadorGrupoSchema);
    const asistenciaRepo = AppDataSource.getRepository(AsistenciaSchema);

    const jugador = await jugadorRepo.findOne({ where: { usuarioId } });
    if (!jugador) return [null, 'Este usuario no tiene perfil de jugador'];

    const grupos = await jugadorGrupoRepo.find({
      where: { jugadorId: jugador.id },
      select: ['grupoId'],
    });
    if (grupos.length === 0) return [{ sesiones: [], pagination: null }, null];

    const grupoIds = grupos.map((g) => g.grupoId);
    const page = Math.max(1, filtros.page ? parseInt(filtros.page) : 1);
    const limit = Math.min(50, filtros.limit ? parseInt(filtros.limit) : 10);
    const skip = (page - 1) * limit;

    const [sesiones, total] = await sesionRepo.findAndCount({
      where: { grupoId: In(grupoIds) },
      relations: ['grupo', 'cancha'],
      order: { fecha: 'DESC', horaInicio: 'DESC' },
      skip,
      take: limit,
    });

    const sesionIds = sesiones.map((s) => s.id);
    const asistencias = await asistenciaRepo.find({
      where: { jugadorId: jugador.id, sesionId: In(sesionIds) },
      select: ['sesionId', 'estado'],
    });

    const asistenciasMap = new Map(asistencias.map((a) => [a.sesionId, a.estado]));

    const toNum = (v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    //  Calcular tokenVigente
    const ahora = new Date();

    const formateadas = sesiones.map((s) => {
      const latTok = toNum(s.latitudToken);
      const lonTok = toNum(s.longitudToken);
      
      //  Token vigente solo si está activo Y no ha expirado
      const tokenVigente = s.tokenActivo && 
                          s.tokenExpiracion && 
                          new Date(s.tokenExpiracion) > ahora;

      return {
        id: s.id,
        fecha: s.fecha,
        horaInicio: s.horaInicio,
        horaFin: s.horaFin,
        tipoSesion: s.tipoSesion,
        grupo: s.grupo?.nombre || 'Sin grupo',
        cancha: s.cancha?.nombre || null,
        ubicacionExterna: s.ubicacionExterna || null,

        tokenActivo: s.tokenActivo || false,
        tokenVigente, //  Campo calculado
        token: tokenVigente ? s.token : null, // Solo mostrar si está vigente
        tokenExpiracion: tokenVigente ? s.tokenExpiracion : null,
        requiereUbicacion: s.requiereUbicacion ?? false,
        latitudToken: latTok,
        longitudToken: lonTok,

        asistenciaMarcada: asistenciasMap.has(s.id),
        estadoAsistencia: asistenciasMap.get(s.id) || null,
      };
    });

    const pagination = {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };

    return [{ sesiones: formateadas, pagination }, null];
  } catch (error) {
    console.error('Error obteniendo sesiones del estudiante:', error);
    return [null, 'Error interno del servidor'];
  }
}

