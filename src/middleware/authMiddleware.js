// middleware/authMiddleware.js
import { findUserById, verifyToken } from '../services/authServices.js';
import { unauthorized, forbidden, error } from '../utils/responseHandler.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return unauthorized(res, 'Token de acceso requerido');
    }

    const decoded = verifyToken(token);
    
    // Verificar que el usuario aún existe y está activo
    const [user, error] = await findUserById(decoded.id);
    
    if (error) {
      return error(res, 'Error verificando usuario', 500);
    }

    if (!user) {
      return unauthorized(res, 'Usuario no encontrado');
    }

    if (user.estado !== 'activo') {
      return forbidden(res, 'Usuario inactivo');
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre
    };

    next();
  } catch (error) {
    if (error.message === 'Token inválido') {
      return unauthorized(res, 'Token inválido o expirado');
    }
    return error(res, 'Error en la autenticación', 500);
  }
}

// Middleware para verificar roles específicos
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Usuario no autenticado');
    }

    const userRole = req.user.rol;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return forbidden(res, 'No tienes permisos para acceder a este recurso');
    }

    next();
  };
}

// Middleware específicos para roles
export const requireEstudiante = requireRole('estudiante');
export const requireAcademico = requireRole('academico');
export const requireEstudianteOrAcademico = requireRole(['estudiante', 'academico']);