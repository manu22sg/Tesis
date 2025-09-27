import { AppDataSource } from '../config/config.db.js';
import HorarioBloqueadoSchema from '../entity/HorarioBloqueado.js';
import CanchaSchema from '../entity/Cancha.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import { parseDateLocal, formatYMD } from '../utils/dateLocal.js';


/**
 * Crear un nuevo entrenamiento (horario bloqueado)
 */
export async function crearEntrenamiento(datosEntrenamiento) {
  try {
    const horarioBloqueadoRepository = AppDataSource.getRepository(HorarioBloqueadoSchema);
    const canchaRepository = AppDataSource.getRepository(CanchaSchema);
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);

    const { canchaId, fecha, horaInicio, horaFin, motivo, descripcion } = datosEntrenamiento;

    // 1. Verificar que la cancha existe y está disponible
    const cancha = await canchaRepository.findOne({
      where: { id: canchaId, estado: 'disponible' }
    });

    if (!cancha) {
      return [null, 'Cancha no encontrada o no disponible'];
    }

    // 2. Verificar conflictos con otros entrenamientos
    const entrenamientosExistentes = await horarioBloqueadoRepository.find({
      where: { canchaId, fecha }
    });

    const nuevoHorario = { horaInicio, horaFin };
    for (const entrenamiento of entrenamientosExistentes) {
      if (hayConflictoHorario(nuevoHorario, entrenamiento)) {
        return [null, `Ya existe un entrenamiento en ese horario: ${entrenamiento.motivo}`];
      }
    }

    // 3. Verificar conflictos con reservas aprobadas
    const reservasExistentes = await reservaRepository.find({
      where: { 
        canchaId, 
        fechaSolicitud: fecha, 
        estado: ['aprobada'] // Solo verificar las aprobadas, las pendientes se pueden rechazar
      }
    });

    for (const reserva of reservasExistentes) {
      if (hayConflictoHorario(nuevoHorario, reserva)) {
        return [null, `Hay una reserva aprobada en ese horario. Debe cancelar la reserva ID: ${reserva.id} primero.`];
      }
    }

    // 4. Crear el entrenamiento
    const nuevoEntrenamiento = horarioBloqueadoRepository.create({
      canchaId,
      fecha,
      horaInicio,
      horaFin,
      motivo: motivo || 'Entrenamiento masculino',
      descripcion: descripcion || null,
      tipoBloqueo: 'entrenamiento'
    });

    const entrenamientoGuardado = await horarioBloqueadoRepository.save(nuevoEntrenamiento);

    // 5. Obtener entrenamiento completo con relaciones
    const entrenamientoCompleto = await horarioBloqueadoRepository.findOne({
      where: { id: entrenamientoGuardado.id },
      relations: ['cancha']
    });

    return [entrenamientoCompleto, null];

  } catch (error) {
    console.error('Error creando entrenamiento:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Obtener todos los entrenamientos con filtros y paginación
 */
export async function obtenerEntrenamientos(filtros = {}) {
  try {
    const horarioBloqueadoRepository = AppDataSource.getRepository(HorarioBloqueadoSchema);

    const page = Math.max(1, filtros.page || 1);
    const limit = Math.min(50, Math.max(1, filtros.limit || 10));
    const skip = (page - 1) * limit;

    let whereConditions = { tipoBloqueo: 'entrenamiento' };

    // Aplicar filtros opcionales
    if (filtros.fecha) {
      whereConditions.fecha = filtros.fecha;
    }

    if (filtros.canchaId) {
      whereConditions.canchaId = filtros.canchaId;
    }

    const queryOptions = {
      where: whereConditions,
      relations: ['cancha'],
      order: { fecha: 'ASC', horaInicio: 'ASC' },
      skip,
      take: limit
    };

    const [entrenamientos, total] = await horarioBloqueadoRepository.findAndCount(queryOptions);

    const totalPages = Math.ceil(total / limit);
    const paginationMeta = {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    };

    return [{ entrenamientos, pagination: paginationMeta }, null];

  } catch (error) {
    console.error('Error obteniendo entrenamientos:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Obtener entrenamiento por ID
 */
export async function obtenerEntrenamientoPorId(id) {
  try {
    const horarioBloqueadoRepository = AppDataSource.getRepository(HorarioBloqueadoSchema);

    const entrenamiento = await horarioBloqueadoRepository.findOne({
      where: { id, tipoBloqueo: 'entrenamiento' },
      relations: ['cancha']
    });

    if (!entrenamiento) {
      return [null, 'Entrenamiento no encontrado'];
    }

    return [entrenamiento, null];

  } catch (error) {
    console.error('Error obteniendo entrenamiento por ID:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Actualizar un entrenamiento
 */
export async function actualizarEntrenamiento(id, datosActualizacion) {
  try {
    const horarioBloqueadoRepository = AppDataSource.getRepository(HorarioBloqueadoSchema);
    const reservaRepository = AppDataSource.getRepository(ReservaCanchaSchema);

    const entrenamiento = await horarioBloqueadoRepository.findOne({
      where: { id, tipoBloqueo: 'entrenamiento' },
      relations: ['cancha']
    });

    if (!entrenamiento) {
      return [null, 'Entrenamiento no encontrado'];
    }

    // Si se cambian horarios, verificar conflictos
    const nuevosHorarios = {
      horaInicio: datosActualizacion.horaInicio || entrenamiento.horaInicio,
      horaFin: datosActualizacion.horaFin || entrenamiento.horaFin
    };

    const nuevaFecha = datosActualizacion.fecha || entrenamiento.fecha;
    const nuevaCanchaId = datosActualizacion.canchaId || entrenamiento.canchaId;

    // Verificar conflictos con otros entrenamientos (excluyendo este mismo)
    const otrosEntrenamientos = await horarioBloqueadoRepository.find({
      where: { 
        canchaId: nuevaCanchaId, 
        fecha: nuevaFecha,
        tipoBloqueo: 'entrenamiento'
      }
    });

    for (const otro of otrosEntrenamientos) {
      if (otro.id !== id && hayConflictoHorario(nuevosHorarios, otro)) {
        return [null, `Conflicto con otro entrenamiento: ${otro.motivo}`];
      }
    }

    // Verificar conflictos con reservas aprobadas
    const reservasAprobadas = await reservaRepository.find({
      where: { 
        canchaId: nuevaCanchaId, 
        fechaSolicitud: nuevaFecha, 
        estado: 'aprobada'
      }
    });

    for (const reserva of reservasAprobadas) {
      if (hayConflictoHorario(nuevosHorarios, reserva)) {
        return [null, `Conflicto con reserva aprobada ID: ${reserva.id}. Cancele la reserva primero.`];
      }
    }

    // Actualizar campos
    Object.keys(datosActualizacion).forEach(key => {
      if (datosActualizacion[key] !== undefined && key !== 'tipoBloqueo') {
        entrenamiento[key] = datosActualizacion[key];
      }
    });

    const entrenamientoActualizado = await horarioBloqueadoRepository.save(entrenamiento);

    return [entrenamientoActualizado, null];

  } catch (error) {
    console.error('Error actualizando entrenamiento:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Eliminar un entrenamiento
 */
export async function eliminarEntrenamiento(id) {
  try {
    const horarioBloqueadoRepository = AppDataSource.getRepository(HorarioBloqueadoSchema);

    const entrenamiento = await horarioBloqueadoRepository.findOne({
      where: { id, tipoBloqueo: 'entrenamiento' }
    });

    if (!entrenamiento) {
      return [null, 'Entrenamiento no encontrado'];
    }

    await horarioBloqueadoRepository.remove(entrenamiento);

    return [{ message: 'Entrenamiento eliminado correctamente' }, null];

  } catch (error) {
    console.error('Error eliminando entrenamiento:', error);
    return [null, 'Error interno del servidor'];
  }
}

/**
 * Crear entrenamientos recurrentes (por ejemplo, todos los lunes y miércoles)
 */
export async function crearEntrenamientosRecurrentes(datosRecurrentes) {
  try {
    const { canchaId, fechaInicio, fechaFin, diasSemana, horaInicio, horaFin, motivo, descripcion } = datosRecurrentes;

    const entrenamientosCreados = [];
    const errores = [];

    // Fechas en LOCAL
    const inicio = parseDateLocal(fechaInicio);
    const fin = parseDateLocal(fechaFin);

    // Iteración día a día sin saltos de huso
    for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
      const diaSemana = fecha.getDay(); // 0=domingo ... 6=sábado

      if (diasSemana.includes(diaSemana)) { // tus días vienen como 1,3,5 (lun,mié,vie) → OK
        const fechaStr = formatYMD(fecha); // <- antes: toISOString().split('T')[0]

        // Asegúrate de tener importada/definida esta función:
        // const [entrenamiento, error] = await crearEntrenamiento({ ... });
        const [entrenamiento, error] = await crearEntrenamiento({
          canchaId,
          fecha: fechaStr,
          horaInicio,
          horaFin,
          motivo: motivo || `Entrenamiento masculino - ${obtenerNombreDia(diaSemana)}`,
          descripcion
        });

        if (entrenamiento) {
          entrenamientosCreados.push(entrenamiento);
        } else {
          errores.push({ fecha: fechaStr, error });
        }
      }
    }

    const resultado = {
      entrenamientosCreados: entrenamientosCreados.length,
      entrenamientos: entrenamientosCreados,
      errores: errores.length > 0 ? errores : null
    };

    return [resultado, null];

  } catch (error) {
    console.error('Error creando entrenamientos recurrentes:', error);
    return [null, 'Error interno del servidor'];
  }
}


// Helper functions
function hayConflictoHorario(horario1, horario2) {
  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const inicio1 = toMinutes(horario1.horaInicio);
  const fin1 = toMinutes(horario1.horaFin);
  const inicio2 = toMinutes(horario2.horaInicio);
  const fin2 = toMinutes(horario2.horaFin);

  return !(fin1 <= inicio2 || fin2 <= inicio1);
}

function obtenerNombreDia(diaSemana) {
  const nombres = [ 'Domingo','Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes','Sabado' ];
  return nombres[diaSemana];
}