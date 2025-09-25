
export function success(res, data = null, message = 'Operación exitosa', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

export function error(res, message = 'Error interno del servidor', statusCode = 500, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
}

export function validationError(res, errors, message = 'Errores de validación') {
  return res.status(400).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
}

export function unauthorized(res, message = 'No autorizado') {
  return res.status(401).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
}

export function forbidden(res, message = 'Acceso denegado') {
  return res.status(403).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
}

export function notFound(res, message = 'Recurso no encontrado') {
  return res.status(404).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
}

export function conflict(res, message = 'Conflicto con el estado actual del recurso') {
  return res.status(409).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
}