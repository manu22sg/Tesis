import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/config.db.js';
import UsuarioSchema from '../entity/Usuario.js'; 
import {sendMail} from '../utils/mailer.js'
import CarreraSchema from '../entity/Carrera.js';
import { validateEmail } from '../validations/userValidations.js';
import { FRONTEND_URL } from '../config/configEnv.js';

const createErrorMessage = (dataInfo, message) => ({
  dataInfo,
  message
});

export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export function generateToken(payload) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { 
      expiresIn: '1d',
      issuer: 'ubiobio-app'
    }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido');
  }
}



export async function findUsersByRuts(ruts) {
  try {
    const userRepository = AppDataSource.getRepository(UsuarioSchema);

    // Buscar usuarios activos, verificados y con roles válidos.
    const users = await userRepository
      .createQueryBuilder('usuario')
      .select([
        'usuario.id',
        'usuario.rut',
        'usuario.nombre',
        'usuario.apellido',
        'usuario.email',
        'usuario.rol',
        'usuario.carreraId',
        'usuario.estado',
        'usuario.verificado'
      ])
      .where('usuario.rut IN (:...ruts)', { ruts })
      .andWhere('usuario.estado = :estado', { estado: 'activo' })
      .andWhere('usuario.verificado = true')
      .andWhere('usuario.rol IN (:...roles)', {
        roles: ['estudiante', 'academico']
      })
      .getMany();

    return [users, null];

  } catch (error) {
    console.error('Error buscando usuarios por RUTs:', error);
    return [null, 'Error interno del servidor'];
  }
}





export async function findUserById(id) {
  try {
    const userRepository = AppDataSource.getRepository(UsuarioSchema);

    const user = await userRepository
      .createQueryBuilder('usuario')
      .select([
        'usuario.id',
        'usuario.rut',
        'usuario.nombre',
        'usuario.apellido',
        'usuario.email',
        'usuario.rol',
        'usuario.estado',
        'usuario.verificado',
        'usuario.carreraId',
        'usuario.fechaCreacion',
        'usuario.fechaActualizacion',
        'carrera.id',
        'carrera.nombre'
      ])
      .leftJoin('usuario.carrera', 'carrera')
      .where('usuario.id = :id', { id })
      .getOne();

    return [user, null];

  } catch (error) {
    console.error('Error buscando usuario por ID:', error);
    return [null, 'Error interno del servidor'];
  }
}




export async function registerService(userData) {
  try {
    const userRepository = AppDataSource.getRepository(UsuarioSchema);
    const carreraRepository = AppDataSource.getRepository(CarreraSchema);

    const { rut, nombre, apellido, email, password, carreraId } = userData;

    // -----------------------------
    // 1. Validación de existencia de carrera
    // -----------------------------
    const carrera = await carreraRepository.findOne({ where: { id: carreraId } });
    if (!carrera) {
      return [null, createErrorMessage('carreraId', 'La carrera seleccionada no existe')];
    }

    // -----------------------------
    // 2. Validación de duplicados
    // -----------------------------
    const existingEmail = await userRepository.findOne({ where: { email } });
    if (existingEmail) {
      return [null, createErrorMessage('email', 'Ya existe un usuario con este email')];
    }

    const existingRut = await userRepository.findOne({ where: { rut } });
    if (existingRut) {
      return [null, createErrorMessage('rut', 'Ya existe un usuario con este RUT')];
    }

    // -----------------------------
    // 3. Hash de contraseña
    // -----------------------------
    const hashedPassword = await hashPassword(password);

    // -----------------------------
    // 4. Determinar rol
    // -----------------------------
    const userRole =
      email.endsWith('@alumnos.ubiobio.cl') ? 'estudiante' : 'academico';

    // -----------------------------
    // 5. Crear usuario pendiente y no verificado
    // -----------------------------
    const newUser = userRepository.create({
      rut,
      nombre,
      apellido,
      email,
      password: hashedPassword,
      rol: userRole,
      carreraId,
      estado: 'pendiente',
      verificado: false
    });

    const savedUser = await userRepository.save(newUser);

    // -----------------------------
    // 6. Crear token de verificación
    // -----------------------------
    const tokenVerificacion = jwt.sign(
      {
        id: savedUser.id,
        email: savedUser.email,
        purpose: 'email_verification'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const urlVerificacion = `${FRONTEND_URL}/verificar/${tokenVerificacion}`;


    // -----------------------------
    // 7. Envío de correo
    // -----------------------------
    try {
      await sendMail({
        to: savedUser.email,
        subject: 'Verifica tu cuenta - SPORTUBB',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif">
            <h2>¡Hola ${savedUser.nombre}!</h2>
            <p>Gracias por registrarte en SPORTUBB.</p>
            <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
            <p><a href="${urlVerificacion}">Verificar mi cuenta</a></p>
            <p>Este enlace expira en 24 horas.</p>
          </body>
          </html>
        `
      });
    } catch (emailError) {
      console.error('Error al enviar correo de verificación:', emailError);

      // Eliminar usuario creado si falla el email
      await userRepository.delete(savedUser.id);

      return [
        null,
        'Error al enviar el correo de verificación. Intenta nuevamente.'
      ];
    }

    // -----------------------------
    // 8. Limpiar objeto antes de devolverlo
    // -----------------------------
    const userWithoutSensitiveData = {
      id: savedUser.id,
      rut: savedUser.rut,
      nombre: savedUser.nombre,
      apellido: savedUser.apellido,
      email: savedUser.email,
      rol: savedUser.rol,
      carreraId: savedUser.carreraId,
      estado: savedUser.estado,
      verificado: savedUser.verificado,
      fechaCreacion: savedUser.fechaCreacion
    };

    // -----------------------------
    // 9. Retorno final
    // -----------------------------
    return [
      {
        user: userWithoutSensitiveData,
        message:
          'Registro exitoso. Revisa tu correo institucional para verificar tu cuenta.'
      },
      null
    ];
  } catch (error) {
    console.error('Error en registerService:', error);
    return [null, 'Error interno del servidor'];
  }
}


export async function verificarEmailService(token) {
  try {
    // 1. Verificar JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return [null, 'El enlace de verificación ha expirado'];
      }
      return [null, 'Token inválido'];
    }

    // 2. Validar purpose del token
    if (decoded.purpose !== 'email_verification') {
      return [null, 'Token inválido para verificación de correo'];
    }

    const userRepository = AppDataSource.getRepository(UsuarioSchema);

    // 3. Buscar usuario
    const usuario = await userRepository.findOne({ where: { id: decoded.id } });

    if (!usuario) {
      return [null, 'Usuario no encontrado'];
    }

    // 4. Si ya estaba verificado
    if (usuario.verificado) {
      return [{
        verificado: true,
        yaVerificado: true,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email
        }
      }, null];
    }

    // 5. Verificar cuenta
    usuario.verificado = true;
    usuario.estado = 'activo';
    await userRepository.save(usuario);

    return [{
      verificado: true,
      yaVerificado: false,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    }, null];

  } catch (error) {
    console.error('Error verificando email:', error);
    return [null, 'Error interno del servidor'];
  }
}



export async function reenviarVerificacionService(email) {
  try {
    const userRepository = AppDataSource.getRepository(UsuarioSchema);

    // 1. Validar email institucional (por seguridad)
    if (!validateEmail(email)) {
      return [null, 'Debe usar un email institucional'];
    }

    // 2. Buscar usuario
    const usuario = await userRepository.findOne({ where: { email } });

    if (!usuario) {
      return [null, 'Usuario no encontrado'];
    }

    if (usuario.verificado) {
      return [null, 'Esta cuenta ya está verificada'];
    }

    // 3. Crear nuevo token con purpose
    const tokenVerificacion = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        purpose: 'email_verification'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const urlVerificacion = `${FRONTEND_URL}/verificar/${tokenVerificacion}`;

    // 4. Enviar correo
    try {
      await sendMail({
        to: usuario.email,
        subject: '🔄 Reenvío de verificación - SPORTUBB',
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif">
              <h2>Hola ${usuario.nombre}!</h2>
              <p>Aquí tienes un nuevo enlace para verificar tu cuenta:</p>
              <p><a href="${urlVerificacion}">Verificar mi cuenta</a></p>
              <p>Este enlace expira en 24 horas.</p>
            </body>
          </html>
        `
      });
    } catch (emailError) {
      console.error('Error al enviar correo:', emailError);
      return [null, 'Error al enviar el correo de verificación'];
    }

    return [{
      success: true,
      email: usuario.email,
      nombre: usuario.nombre
    }, null];

  } catch (error) {
    console.error('Error reenviando verificación:', error);
    return [null, 'Error interno del servidor'];
  }
}



export async function loginService(loginData) {
  try {
    const { email, password } = loginData;

    // 1. Validar email institucional (doble seguridad)
    if (!validateEmail(email)) {
      return [null, createErrorMessage('email', 'Debe usar un email institucional')];
    }

    // 2. Buscar usuario por email (traer también password)
    const userRepository = AppDataSource.getRepository(UsuarioSchema);

    const user = await userRepository.findOne({
      where: { email },
      select: [
        'id',
        'rut',
        'nombre',
        'apellido',
        'email',
        'rol',
        'password',
        'estado',
        'verificado',
        'carreraId'
      ]
    });

    if (!user) {
      return [null, createErrorMessage('email', 'Credenciales inválidas')];
    }

    // 3. Verificar si el correo está verificado
    if (!user.verificado) {
      return [
        null,
        createErrorMessage(
          'verificado',
          'Debes verificar tu correo institucional antes de iniciar sesión. Revisa tu bandeja de entrada.'
        )
      ];
    }

    // 4. Verificar si está activo
    if (user.estado !== 'activo') {
      return [null, createErrorMessage('estado', 'Usuario inactivo. Contacte al administrador')];
    }

    // 5. Comparar la contraseña
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return [null, createErrorMessage('password', 'Credenciales inválidas')];
    }

    // 6. Generar token (agregar purpose para seguridad extra)
    const token = generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
      purpose: 'auth_login'
    });

    // 7. Sanitizar usuario antes de retornarlo
    const userSanitized = {
      id: user.id,
      rut: user.rut,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol,
      carreraId: user.carreraId
    };

    return [{ user: userSanitized, token }, null];

  } catch (error) {
    console.error('Error en login:', error);
    return [null, 'Error interno del servidor'];
  }
}


export async function buscarUsuariosPorTermino(termino, opciones = {}) {
  try {
    const {
      roles = null,
      estado = 'activo',
      limite = 20,
      excluirJugadores = false,
      carreraId = null 
    } = opciones;
     
    const userRepository = AppDataSource.getRepository(UsuarioSchema);
    const terminoLimpio = termino.trim();
     
    const queryBuilder = userRepository
      .createQueryBuilder('usuario')
      //  Incluir campos de usuario y carrera
      .select([
        'usuario.id', 
        'usuario.rut', 
        'usuario.nombre', 
        'usuario.email', 
        'usuario.rol',
        'usuario.carreraId'
      ])
      //  Join con carrera para incluir el nombre
      .leftJoinAndSelect('usuario.carrera', 'carrera')
      //  Búsqueda mejorada: también busca en el nombre de la carrera
      .where(`(
        usuario.rut LIKE :terminoRut 
        OR LOWER(usuario.nombre) LIKE LOWER(:terminoNombre)
        OR LOWER(carrera.nombre) LIKE LOWER(:terminoCarrera)
      )`, {
        terminoRut: `%${terminoLimpio}%`,
        terminoNombre: `%${terminoLimpio}%`,
        terminoCarrera: `%${terminoLimpio}%`
      })
      .andWhere('usuario.estado = :estado', { estado })
      .andWhere('usuario.verificado = true');
      
     
    // Solo filtrar por roles si se especifica explícitamente
    if (roles !== null && roles.length > 0) {
      if (roles.length === 1) {
        queryBuilder.andWhere('usuario.rol = :rol', { rol: roles[0] });
      } else {
        queryBuilder.andWhere('usuario.rol IN (:...roles)', { roles });
      }
    }

    //  Filtrar por carrera específica
    if (carreraId) {
      queryBuilder.andWhere('usuario.carreraId = :carreraId', { carreraId });
    }
 
    // Excluir usuarios que ya son jugadores
    if (excluirJugadores) {
      queryBuilder.andWhere(`
        usuario.id NOT IN (
          SELECT "usuarioId" 
          FROM jugadores 
          WHERE "usuarioId" IS NOT NULL
        )
      `);
    }
     
    const users = await queryBuilder
      .orderBy('usuario.nombre', 'ASC')
      .limit(limite)
      .getMany();
     
    return [users, null];
  } catch (error) {
    console.error('Error buscando usuarios por término:', error);
    return [null, 'Error interno del servidor'];
  }
}



