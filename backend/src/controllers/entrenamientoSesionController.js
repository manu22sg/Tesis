import {
  crearEntrenamiento,
  obtenerEntrenamientos,
  obtenerEntrenamientoPorId,
  actualizarEntrenamiento,
  eliminarEntrenamiento,
  obtenerEntrenamientosPorSesion,
  reordenarEntrenamientos,
  duplicarEntrenamiento,
  obtenerEstadisticasEntrenamientos,
  asignarEntrenamientosASesion
} from '../services/entrenamientoSesionServices.js';
import { success, error, notFound } from '../utils/responseHandler.js';


export async function crearEntrenamientoController(req, res) {
  try {
    const [entrenamiento, errorMsg] = await crearEntrenamiento(req.body);

    if (errorMsg) {
      if (errorMsg.includes('no encontrada') || errorMsg.includes('no encontrado')) {
        return notFound(res, errorMsg);
      }
      if (errorMsg.includes('Ya existe')) {
        return error(res, errorMsg, 409); // Conflict
      }
      return error(res, errorMsg, 400);
    }

    const mensaje = entrenamiento.sesionId
      ? 'Entrenamiento creado correctamente en la sesión'
      : 'Entrenamiento global creado correctamente';

    return success(res, entrenamiento, mensaje, 201);
  } catch (err) {
    console.error('Error en crearEntrenamientoController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}



export async function obtenerEntrenamientosController(req, res) {
  try {
    const filtros = {
      page: req.query.page,
      limit: req.query.limit,
      q: req.query.q,
      sesionId: req.query.sesionId,
    };

    const [resultado, errorMsg] = await obtenerEntrenamientos(filtros);

    if (errorMsg) {
      return error(res, errorMsg, 500);
    }

    const mensaje = resultado.entrenamientos.length > 0
      ? 'Entrenamientos obtenidos correctamente'
      : 'No se encontraron entrenamientos con los filtros aplicados';

    return success(res, resultado, mensaje, 200);
  } catch (err) {
    console.error('Error en obtenerEntrenamientosController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function obtenerEntrenamientoPorIdController(req, res) {
  try {
    const { id } = req.params;

    const [entrenamiento, errorMsg] = await obtenerEntrenamientoPorId(parseInt(id));

    if (errorMsg) {
      return notFound(res, errorMsg);
    }

    return success(res, entrenamiento, 'Entrenamiento obtenido correctamente', 200);
  } catch (err) {
    console.error('Error en obtenerEntrenamientoPorIdController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function actualizarEntrenamientoController(req, res) {
  try {
    const { id } = req.params;

    const [entrenamiento, errorMsg] = await actualizarEntrenamiento(parseInt(id), req.body);

    if (errorMsg) {
      // Manejar diferentes tipos de errores
      if (errorMsg.includes('no encontrada') || errorMsg.includes('no encontrado')) {
        return notFound(res, errorMsg);
      }
      if (errorMsg.includes('Ya existe')) {
        return error(res, errorMsg, 409); // Conflict
      }
      if (errorMsg.includes('no puede estar vacío') || errorMsg.includes('pasadas')) {
        return error(res, errorMsg, 400); // Bad Request
      }
      return error(res, errorMsg, 400);
    }

    return success(res, entrenamiento, 'Entrenamiento actualizado correctamente', 200);
  } catch (err) {
    console.error('Error en actualizarEntrenamientoController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function eliminarEntrenamientoController(req, res) {
  try {
    const { id } = req.params;

    const [resultado, errorMsg] = await eliminarEntrenamiento(parseInt(id));

    if (errorMsg) {
      return notFound(res, errorMsg);
    }

    return success(res, null, resultado.message, 200);
  } catch (err) {
    console.error('Error en eliminarEntrenamientoController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function obtenerEntrenamientosPorSesionController(req, res) {
  try {
    const { sesionId } = req.params;

    const [entrenamientos, errorMsg] = await obtenerEntrenamientosPorSesion(parseInt(sesionId));

    if (errorMsg) {
      return notFound(res, errorMsg);
    }

    const mensaje = entrenamientos.length > 0
      ? `${entrenamientos.length} entrenamiento(s) encontrado(s) para la sesión`
      : 'No hay entrenamientos registrados para esta sesión';

    return success(res, entrenamientos, mensaje, 200);
  } catch (err) {
    console.error('Error en obtenerEntrenamientosPorSesionController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function reordenarEntrenamientosController(req, res) {
  try {
    const { sesionId, entrenamientos } = req.body;

    const [actualizados, errorMsg] = await reordenarEntrenamientos(sesionId, entrenamientos);

    if (errorMsg) {
      if (errorMsg.includes('no encontrada')) {
        return notFound(res, errorMsg);
      }
      return error(res, errorMsg, 400);
    }

    return success(
      res,
      { entrenamientosActualizados: actualizados.length, entrenamientos: actualizados },
      'Entrenamientos reordenados correctamente',
      200
    );
  } catch (err) {
    console.error('Error en reordenarEntrenamientosController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function duplicarEntrenamientoController(req, res) {
  try {
    const { id } = req.params;
    const { nuevaSesionId } = req.body;

    const [duplicado, errorMsg] = await duplicarEntrenamiento(
      parseInt(id),
      nuevaSesionId ? parseInt(nuevaSesionId) : null
    );

    if (errorMsg) {
      if (errorMsg.includes('no encontrado')) {
        return notFound(res, errorMsg);
      }
      return error(res, errorMsg, 400);
    }

    return success(res, duplicado, 'Entrenamiento duplicado correctamente', 201);
  } catch (err) {
    console.error('Error en duplicarEntrenamientoController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}
export async function obtenerEstadisticasController(req, res) {
  try {
    const { sesionId } = req.query;

    const [estadisticas, errorMsg] = await obtenerEstadisticasEntrenamientos(
      sesionId ? parseInt(sesionId) : null
    );

    if (errorMsg) {
      return error(res, errorMsg, 500);
    }

    const mensaje = sesionId
      ? `Estadísticas de entrenamientos para la sesión ${sesionId}`
      : 'Estadísticas generales de entrenamientos';

    return success(res, estadisticas, mensaje, 200);
  } catch (err) {
    console.error('Error en obtenerEstadisticasController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function asignarEntrenamientosController(req, res) {
  try {
    const { sesionId } = req.params;
    const { ids } = req.body;

    const [result, err] = await asignarEntrenamientosASesion(sesionId, ids);
    if (err) return error(res, err);

    return success(res, result, 'Entrenamientos asignados correctamente');
  } catch (err) {
    return error(res, err.message);
  }
}
