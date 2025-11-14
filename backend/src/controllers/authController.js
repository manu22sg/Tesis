import { registerService, loginService, findUserById, verifyToken,findUsersByRuts, buscarUsuariosPorTermino  } from '../services/authServices.js';
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
  secure: false,       // true en producción con HTTPS
  sameSite: 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000
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
 res.clearCookie('token', {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,
  path: '/',
});

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


export async function buscarUsuariosPorRuts(req, res) {
  try {
    const { ruts } = req.body;
    
    if (!Array.isArray(ruts) || ruts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un array de RUTs'
      });
    }


    const [users, error] = await findUsersByRuts(ruts);
    
    if (error) {
      return res.status(500).json({
        success: false,
        message: error
      });
    }

    // Crear un mapa de RUT -> Usuario (con guion como clave)
    const usuariosPorRut = {};
    users.forEach(user => {
      usuariosPorRut[user.rut] = {
        id: user.id,
        rut: user.rut,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      };
    });


    return success(res, usuariosPorRut, 'Usuarios encontrados');
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios'
    });
  }
}
  
export async function buscarUsuarios(req, res) {
  try {
    const { 
      termino, 
      roles, 
      excluirJugadores,
      carreraId  
    } = req.query;
    
    // Validación básica
    if (!termino || termino.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El término de búsqueda debe tener al menos 2 caracteres'
      });
    }

    // Preparar opciones
    const opciones = {};
    
    // Parsear roles si viene en el query
    if (roles) {
      try {
        opciones.roles = JSON.parse(roles);
      } catch {
        opciones.roles = [roles];
      }
    }

    // Agregar opción para excluir jugadores
    if (excluirJugadores === 'true') {
      opciones.excluirJugadores = true;
    }

    // 🆕 Agregar filtro por carrera
    if (carreraId) {
      opciones.carreraId = parseInt(carreraId);
    }

    const [users, error] = await buscarUsuariosPorTermino(termino, opciones);
    
    if (error) {
      return res.status(500).json({
        success: false,
        message: error
      });
    }

    const resultados = users.map(user => ({
      value: user.rut,
      label: `${user.rut} - ${user.nombre}${user.carrera?.nombre ? ` - ${user.carrera.nombre}` : ''}`,
      rut: user.rut,
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      carrera: user.carrera ? {
        id: user.carrera.id,
        nombre: user.carrera.nombre
      } : null,
      carreraId: user.carreraId || null
    }));

    return success(res, resultados, 'Usuarios encontrados');
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios'
    });
  }
}


