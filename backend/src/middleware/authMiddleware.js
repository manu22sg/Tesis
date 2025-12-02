import { findUserById, verifyToken } from '../services/authServices.js';
import { unauthorized, forbidden, error as sendError } from '../utils/responseHandler.js';
import { AppDataSource } from '../config/config.db.js';
import JugadorSchema from '../entity/Jugador.js';



export async function authenticateToken(req, res, next) {
  try {
    // 1. Obtener token desde Authorization o cookie
    const authHeader = req.headers['authorization'];
    const cookieToken = req.cookies?.token;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : null;

    const token = bearerToken || cookieToken;

    if (!token) {
      return unauthorized(res, 'Token de acceso requerido');
    }

    // 2. Verificar token JWT
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      // 🔥 IMPORTANTE: Limpiar cookie si el token es inválido
      res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      
      return unauthorized(res, 'Token inválido o expirado');
    }

    // 3. Validar purpose (con flexibilidad para tokens antiguos)
    if (decoded.purpose && decoded.purpose !== 'auth_login') {
      return unauthorized(res, 'Token no válido para autenticación');
    }

    // 4. Buscar usuario en BD
    const [user, findErr] = await findUserById(decoded.id);
    
    if (findErr) {
      return sendError(res, 'Error verificando usuario', 500);
    }
    
    if (!user) {
      // Limpiar cookie si el usuario no existe
      res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      
      return unauthorized(res, 'Usuario no encontrado');
    }

    // 5. Verificar estado y verificación
    if (!user.verificado) {
      return forbidden(res, 'Debe verificar su correo antes de acceder');
    }

    if (user.estado !== 'activo') {
      return forbidden(res, 'Usuario inactivo');
    }

    // 6. Adjuntar datos al request (normalizar rol)
    req.user = {
      id: user.id,
      rut: user.rut,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol ? user.rol.toLowerCase() : 'estudiante',
      carreraId: user.carreraId,
      estado: user.estado,
      sexo: user.sexo,
      anioIngresoUniversidad: user.anioIngresoUniversidad, // ← AGREGADO
      verificado: user.verificado,
      // 🔥 CAMBIO IMPORTANTE: Guardar objeto completo, no solo el nombre
      carrera: user.carrera ? {
        id: user.carrera.id,
        nombre: user.carrera.nombre
      } : null,
      // 🔥 CAMBIO IMPORTANTE: Guardar objeto completo del jugador
      jugador: user.jugador ? {
        id: user.jugador.id,
        posicion: user.jugador.posicion,
        altura: user.jugador.altura,
        peso: user.jugador.peso,
        estado: user.jugador.estado,
        anioIngreso: user.jugador.anioIngreso
      } : null,
    };

    next();
  } catch (e) {
    console.error("💥 Error crítico en authenticateToken:", e);
    return sendError(res, 'Error en la autenticación', 500);
  }
}


// 🔥 Middleware de roles
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Usuario no autenticado');
    }

    const userRole = (req.user.rol || '').toLowerCase();
    const allowed = (Array.isArray(roles) ? roles : [roles]).map(r => (r || '').toLowerCase());


    if (!allowed.includes(userRole)) {
      return forbidden(res, 'No tiene permisos para acceder a este recurso');
    }
    
    next();
  };
}

// Helpers de roles
export const requireEstudiante = requireRole('estudiante');
export const requireAcademico = requireRole('academico');
export const requireEstudianteOrAcademico = requireRole(['estudiante', 'academico']);

// 🔥 Adjuntar jugadorId
export async function attachJugadorId(req, res, next) {
  try {
    if (!req.user) {
      return unauthorized(res, 'Usuario no autenticado');
    }

    // Si ya está, seguir
    if (req.user.jugadorId) {
      return next();
    }

    // Solo estudiantes tienen jugador asociado
    if (req.user.rol !== 'estudiante') {
      return next();
    }

    const jugadorRepo = AppDataSource.getRepository(JugadorSchema);
    const jugador = await jugadorRepo.findOne({ where: { usuarioId: req.user.id } });

    if (!jugador) {
      return forbidden(res, 'El usuario no tiene jugador asociado');
    }

    req.user.jugadorId = jugador.id;
    
    next();
  } catch (e) {
    console.error("💥 Error en attachJugadorId:", e);
    return sendError(res, 'Error adjuntando jugador', 500);
  }
}