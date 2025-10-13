// controllers/authController.js
import { registerService, loginService, findUserById, verifyToken } from '../services/authServices.js';
import { success, error, conflict, unauthorized, forbidden, notFound } from '../utils/responseHandler.js';

export async function register(req, res) {
  try {
    const { rut, nombre, email, password, rol } = req.body;

    const [result, error] = await registerService({
      rut,
      nombre,
      email,
      password,
      rol
    });

    if (error) {
      // Si el error tiene dataInfo, es un error de validación
      if (typeof error === 'object' && error.dataInfo) {
        return conflict(res, error.message);
      }
      return error(res, error, 500);
    }

    // Configurar cookie con el token
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    return success(
      res,
      result,
      'Usuario registrado exitosamente',
      201
    );

  } catch (error) {
    console.error('Error en registro:', error);
    return error(
      res,
      'Error interno del servidor durante el registro',
      500
    );
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const [result, error] = await loginService({ email, password });

    if (error) {
      // Si el error tiene dataInfo, es un error de validación específica
      if (typeof error === 'object' && error.dataInfo) {
        if (error.dataInfo === 'email') {
          return unauthorized(res, 'Email o contraseña incorrectos');
        }
        if (error.dataInfo === 'password') {
          return unauthorized(res, 'Email o contraseña incorrectos');
        }
        if (error.dataInfo === 'estado') {
          return forbidden(res, error.message);
        }
      }
      return error(res, error, 500);
    }

    // Configurar cookie con el token
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    return success(
      res,
      result,
      'Login exitoso'
    );

  } catch (error) {
    console.error('Error en login:', error);
    return error(
      res,
      'Error interno del servidor durante el login',
      500
    );
  }
}

export async function logout(req, res) {
  try {
    // Limpiar cookie
    res.clearCookie('token');

    return success(
      res,
      null,
      'Logout exitoso'
    );
  } catch (error) {
    console.error('Error en logout:', error);
    return error(res, 'Error durante el logout', 500);
  }
}

export async function getProfile(req, res) {
  try {
    // El usuario ya está disponible en req.user gracias al middleware de autenticación
    const [user, error] = await findUserById(req.user.id);

    if (error) {
      return error(res, error, 500);
    }

    if (!user) {
      return notFound(res, 'Usuario no encontrado');
    }

    return success(
      res,
      user,
      'Perfil obtenido exitosamente'
    );
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return error(res, 'Error obteniendo el perfil', 500);
  }
}

export async function verifyTokenController(req, res) {
  try {
    // Si llegamos hasta aquí, el token es válido (gracias al middleware)
    return success(
      res,
      {
        user: req.user,
        isValid: true
      },
      'Token válido'
    );
  } catch (error) {
    console.error('Error verificando token:', error);
    return error(res, 'Error verificando token', 500);
  }
}