import { findUserById, verifyToken } from '../services/authServices.js';
import { unauthorized, forbidden, error as sendError} from '../utils/responseHandler.js';
import {AppDataSource }from '../config/config.db.js';
import JugadorSchema from '../entity/Jugador.js';

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

export async function attachJugadorId(req, res, next) {
  try {
    // Requiere que authenticateToken haya colocado req.user
    if (!req.user) return forbidden(res, 'Usuario no autenticado');

    // Si ya viene, seguimos
    if (req.user.jugadorId) return next();

    // Solo aplica a estudiantes
    if (req.user.rol !== 'estudiante') {
      return forbidden(res, 'El usuario no es estudiante');
    }

    const jugadorRepo = AppDataSource.getRepository(JugadorSchema);
    const jugador = await jugadorRepo.findOne({ where: { usuarioId: req.user.id } });
    if (!jugador) {
      return sendError(res, 'El usuario no tiene jugador asociado', 403);
    }

    req.user.jugadorId = jugador.id;
    next();
  } catch (e) {
    return sendError(res, 'Error adjuntando jugador', 500);
  }
}
