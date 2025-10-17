import { findUserById, verifyToken } from '../services/authServices.js';
import { unauthorized, forbidden, error as sendError } from '../utils/responseHandler.js';
import { AppDataSource } from '../config/config.db.js';
import JugadorSchema from '../entity/Jugador.js';

export async function authenticateToken(req, res, next) {
  try {


    const authHeader = req.headers['authorization'];
    const cookieToken = req.cookies?.token;
    const token = authHeader?.split(' ')[1] || cookieToken; // ahora lee ambos casos

    if (!token) return unauthorized(res, 'Token de acceso requerido');

    const decoded = verifyToken(token);
    const [user, findErr] = await findUserById(decoded.id);
    if (findErr) return sendError(res, 'Error verificando usuario', 500);
    if (!user) return unauthorized(res, 'Usuario no encontrado');
    if (user.estado !== 'activo') return forbidden(res, 'Usuario inactivo');

    req.user = {
      id: user.id,
      email: user.email,
      rol: (user.rol || '').toLowerCase(),
      nombre: user.nombre,
      rut: user.rut
    };

    next();
  } catch (e) {
    if (e?.message === 'Token inválido') {
      return unauthorized(res, 'Token inválido o expirado');
    }
    return sendError(res, 'Error en la autenticación', 500);
  }
}


export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res, 'Usuario no autenticado');

    const userRole = (req.user.rol || '').toLowerCase();
    const allowed = (Array.isArray(roles) ? roles : [roles]).map(r => (r || '').toLowerCase());

    if (!allowed.includes(userRole)) {
      return forbidden(res, 'No tienes permisos para acceder a este recurso');
    }
    next();
  };
}

// Helpers por conveniencia (opcional)
export const requireEstudiante = requireRole('estudiante');
export const requireAcademico = requireRole('academico');
export const requireEstudianteOrAcademico = requireRole(['estudiante', 'academico']);

export async function attachJugadorId(req, res, next) {
  try {
    if (!req.user) return unauthorized(res, 'Usuario no autenticado');

    // Si ya viene seteado, seguimos
    if (req.user.jugadorId) return next();

    // Solo adjunta si es estudiante; para otros roles simplemente continúa
    if (req.user.rol !== 'estudiante') return next();

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
