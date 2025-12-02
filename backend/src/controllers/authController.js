import { 
  registerService, 
  loginService, 
  findUserById, 
  verifyToken,
  findUsersByRuts, 
  buscarUsuariosPorTermino,
  verificarEmailService,
  reenviarVerificacionService,
  solicitarRestablecimientoService,
  restablecerPasswordService
} from '../services/authServices.js';
import { validateResetPasswordData } from '../validations/userValidations.js';

import { success, error, conflict, unauthorized, forbidden, notFound } from '../utils/responseHandler.js';

export async function register(req, res) {
  try {
    const { rut, nombre, apellido, email, password, carreraId,anioIngresoUniversidad,sexo } = req.body;

    const [result, errorMsg] = await registerService({
      rut,
      nombre,
      apellido,
      email,
      password,
      carreraId,
      anioIngresoUniversidad,
      sexo
    });

    if (errorMsg) {
      // Si el error tiene dataInfo, es un error de validación
      if (typeof errorMsg === 'object' && errorMsg.dataInfo) {
        return conflict(res, errorMsg.message);
      }
      return error(res, errorMsg, 500);
    }

   

    return success(
      res,
      {
        user: result.user,
        message: result.message
      },
      'Registro exitoso. Revisa tu correo institucional para verificar tu cuenta.',
      201
    );

  } catch (err) {
    console.error('Error en registro:', err);
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

    const [result, errorMsg] = await loginService({ email, password });

    if (errorMsg) {
      // Si el error tiene dataInfo, es un error de validación específica
      if (typeof errorMsg === 'object' && errorMsg.dataInfo) {
        if (errorMsg.dataInfo === 'email') {
          return unauthorized(res, 'Email o contraseña incorrectos');
        }
        if (errorMsg.dataInfo === 'password') {
          return unauthorized(res, 'Email o contraseña incorrectos');
        }
        if (errorMsg.dataInfo === 'verificado') {
          return forbidden(res, errorMsg.message);
        }
        if (errorMsg.dataInfo === 'estado') {
          return forbidden(res, errorMsg.message);
        }
      }
      return error(res, errorMsg, 500);
    }

    // ✅ Configurar cookie con el token (solo si está verificado)
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    return success(
      res,
      result,
      'Login exitoso'
    );

  } catch (err) {
    console.error('Error en login:', err);
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
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return success(
      res,
      null,
      'Logout exitoso'
    );
  } catch (err) {
    console.error('Error en logout:', err);
    return error(res, 'Error durante el logout', 500);
  }
}

export async function getProfile(req, res) {
  try {
    // El usuario ya está disponible en req.user gracias al middleware de autenticación
    const [user, errorMsg] = await findUserById(req.user.id);

    if (errorMsg) {
      return error(res, errorMsg, 500);
    }

    if (!user) {
      return notFound(res, 'Usuario no encontrado');
    }

    return success(
      res,
      user,
      'Perfil obtenido exitosamente'
    );
  } catch (err) {
    console.error('Error obteniendo perfil:', err);
    return error(res, 'Error obteniendo el perfil', 500);
  }
}

export async function verifyTokenController(req, res) {
  try {
    // Obtener los datos completos del usuario desde la BD
    const [user, errorMsg] = await findUserById(req.user.id);

    if (errorMsg) {
      return error(res, errorMsg, 500);
    }

    if (!user) {
      return notFound(res, 'Usuario no encontrado');
    }

    // Formatear el usuario con toda la información necesaria
    const userFormatted = {
      id: user.id,
      rut: user.rut,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol,
      estado: user.estado,
      verificado: user.verificado,
      sexo: user.sexo,
      carreraId: user.carreraId,
      anioIngresoUniversidad: user.anioIngresoUniversidad,
      carrera: user.carrera ? {
        id: user.carrera.id,
        nombre: user.carrera.nombre
      } : null,
      jugador: user.jugador ? {
        id: user.jugador.id,
        posicion: user.jugador.posicion,
        altura: user.jugador.altura,
        peso: user.jugador.peso,
        estado: user.jugador.estado,
        anioIngreso: user.jugador.anioIngreso
      } : null,
      fechaCreacion: user.fechaCreacion,
      fechaActualizacion: user.fechaActualizacion
    };

    return success(
      res,
      {
        user: userFormatted,
        isValid: true
      },
      'Token válido'
    );
  } catch (err) {
    console.error('Error verificando token:', err);
    return error(res, 'Error verificando token', 500);
  }
}


// VERIFICAR EMAIL
export async function verificarEmail(req, res) {
  try {
    const { token } = req.params;

    const [result, errorMsg] = await verificarEmailService(token);

    if (errorMsg) {
      if (errorMsg.includes('expirado')) {
        return unauthorized(res, errorMsg);
      }
      if (errorMsg.includes('inválido')) {
        return unauthorized(res, errorMsg);
      }
      if (errorMsg.includes('no encontrado')) {
        return notFound(res, errorMsg);
      }
      return error(res, errorMsg, 400);
    }

    return success(
      res,
      result,
      result.yaVerificado 
        ? 'Esta cuenta ya fue verificada anteriormente' 
        : 'Cuenta verificada con éxito. Ya puede iniciar sesión'
    );

  } catch (err) {
    console.error('Error verificando email:', err);
    return error(res, 'Error al verificar el email', 500);
  }
}


// REENVIAR VERIFICACIÓN
export async function reenviarVerificacion(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, 'El email es requerido', 400);
    }

    const [result, errorMsg] = await reenviarVerificacionService(email);

    if (errorMsg) {
      if (errorMsg.includes('no encontrado')) {
        return notFound(res, errorMsg);
      }
      if (errorMsg.includes('ya está verificada')) {
        return conflict(res, errorMsg);
      }
      if (errorMsg.includes('correo')) {
        return error(res, errorMsg, 500);
      }
      return error(res, errorMsg, 400);
    }

    return success(
      res,
      null,
      'Correo de verificación reenviado exitosamente. Revise su bandeja de entrada.'
    );

  } catch (err) {
    console.error('Error reenviando verificación:', err);
    return error(res, 'Error al reenviar el correo de verificación', 500);
  }
}

export async function buscarUsuariosPorRuts(req, res) {
  try {
    const { ruts } = req.body;

    // Validación del input
    if (!Array.isArray(ruts) || ruts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un array de RUTs'
      });
    }

    // Llamar al service
    const [users, errorMsg] = await findUsersByRuts(ruts);

    if (errorMsg) {
      return res.status(500).json({
        success: false,
        message: errorMsg
      });
    }

    // Formatear diccionario: rut → info usuario
    const usuariosPorRut = {};
    users.forEach(user => {
      usuariosPorRut[user.rut] = {
        id: user.id,
        rut: user.rut,
        nombre: `${user.nombre} ${user.apellido || ''}`.trim(),
        email: user.email,
        rol: user.rol,
        carreraId: user.carreraId
      };
    });

    return success(res, usuariosPorRut, 'Usuarios encontrados');

  } catch (err) {
    console.error('Error buscando usuarios:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios'
    });
  }
}

export async function solicitarRestablecimiento(req, res) {
  try {
    const { email } = req.body; 

    const [result, errorMsg] = await solicitarRestablecimientoService(email);

    if (errorMsg) {
      if (errorMsg.includes('No existe una cuenta')) {
        return notFound(res, errorMsg);
      }
      if (errorMsg.includes('verificar tu cuenta')) {
        return forbidden(res, errorMsg);
      }
      if (errorMsg.includes('no está activa')) {
        return forbidden(res, errorMsg);
      }
      if (errorMsg.includes('correo')) {
        return error(res, errorMsg, 500);
      }
      return error(res, errorMsg, 400);
    }

    return success(
      res,
      result,
      'Correo de restablecimiento enviado exitosamente. Revise su bandeja de entrada'
    );

  } catch (err) {
    console.error('Error solicitando restablecimiento:', err);
    return error(res, 'Error al solicitar restablecimiento de contraseña', 500);
  }
}


export async function restablecerPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const validation = validateResetPasswordData({ password });
    
    if (!validation.isValid) {
      return error(res, validation.errors[0].message, 400);
    }

    const [result, errorMsg] = await restablecerPasswordService(
      token, 
      validation.data.password
    );

    if (errorMsg) {
      if (errorMsg.includes('expirado')) {
        return unauthorized(res, errorMsg);
      }
      if (errorMsg.includes('inválido')) {
        return unauthorized(res, errorMsg);
      }
      if (errorMsg.includes('no encontrado')) {
        return notFound(res, errorMsg);
      }
      if (errorMsg.includes('no está')) {
        return forbidden(res, errorMsg);
      }
      return error(res, errorMsg, 400);
    }

    return success(
      res,
      result,
      'Contraseña restablecida exitosamente. Ya puede iniciar sesión'
    );

  } catch (err) {
    console.error('Error restableciendo contraseña:', err);
    return error(res, 'Error al restablecer la contraseña', 500);
  }
}


  
export async function buscarUsuarios(req, res) {
  try {
    const { 
      termino, 
      roles, 
      excluirJugadores,
      carreraId,
      sexo  
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
    
    if (sexo) {
      opciones.sexo = sexo;
    }

    // Agregar filtro por carrera
    if (carreraId) {
      opciones.carreraId = parseInt(carreraId);
    }

    const [users, errorMsg] = await buscarUsuariosPorTermino(termino, opciones);
    
    if (errorMsg) {
      return res.status(500).json({
        success: false,
        message: errorMsg
      });
    }

    const resultados = users.map(user => ({
      value: user.rut,
      label: `${user.rut} - ${user.nombre}${user.carrera?.nombre ? ` - ${user.carrera.nombre}` : ''}`,
      rut: user.rut,
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol,
      carrera: user.carrera ? {
        id: user.carrera.id,
        nombre: user.carrera.nombre
      } : null,
      carreraId: user.carreraId || null
    }));

    return success(res, resultados, 'Usuarios encontrados');
  } catch (err) {
    console.error('Error buscando usuarios:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios'
    });
  }
}