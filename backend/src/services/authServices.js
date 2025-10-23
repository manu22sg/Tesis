import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/config.db.js';
import UsuarioSchema from '../entity/Usuario.js'; 
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
      expiresIn: '24h',
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

export async function findUserByEmail(email) {
  try {
    const userRepository = AppDataSource.getRepository(UsuarioSchema);
    const user = await userRepository.findOne({ 
      where: { email } 
    });
    return [user, null];
  } catch (error) {
    console.error('Error buscando usuario por email:', error);
    return [null, 'Error interno del servidor'];
  }
}
export async function findUsersByRuts(ruts) {
  try {
    const userRepository = AppDataSource.getRepository(UsuarioSchema);
    
    
    const users = await userRepository
      .createQueryBuilder('usuario')
      .select(['usuario.id', 'usuario.rut', 'usuario.nombre', 'usuario.email'])
      .where('usuario.rut IN (:...ruts)', { ruts })
      .andWhere('usuario.estado = :estado', { estado: 'activo' })
      .andWhere('usuario.rol IN (:...roles)', { roles: ['academico', 'estudiante'] }) 
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
    const user = await userRepository.findOne({ 
      where: { id },
      select: ['id', 'rut', 'nombre', 'email', 'rol', 'estado', 'fechaCreacion']
    });
    return [user, null];
  } catch (error) {
    console.error('Error buscando usuario por ID:', error);
    return [null, 'Error interno del servidor'];
  }
}

export async function registerService(userData) {
  try {
    const userRepository = AppDataSource.getRepository(UsuarioSchema);
    const { rut, nombre, email, password, rol } = userData;

    // Verificar si el usuario ya existe por email
    const [existingUserByEmail] = await findUserByEmail(email);
    if (existingUserByEmail) {
      return [null, createErrorMessage('email', 'Ya existe un usuario con este email')];
    }

    // Verificar si el usuario ya existe por RUT
    const [existingUserByRut] = await findUserByRut(rut);
    if (existingUserByRut) {
      return [null, createErrorMessage('rut', 'Ya existe un usuario con este RUT')];
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);
    
    // Determinar el rol basado en el email si no se proporciona
    let userRole = rol;
    if (!userRole) {
      userRole = email.includes('@alumnos.ubiobio.cl') ? 'estudiante' : 'academico';
    }
    
    // Crear el usuario
    const newUser = userRepository.create({
      rut,
      nombre,
      email,
      password: hashedPassword,
      rol: userRole,
      estado: 'activo'
    });

    const savedUser = await userRepository.save(newUser);

    // Generar token
    const token = generateToken({
      id: savedUser.id,
      email: savedUser.email,
      rol: savedUser.rol
    });

    // Retornar datos sin la contraseña
    const { password: _, ...userWithoutPassword } = savedUser;
    
    return [{ user: userWithoutPassword, token }, null];

  } catch (error) {
    console.error('Error en registro:', error);
    return [null, 'Error interno del servidor'];
  }
}

export async function loginService(loginData) {
  try {
    const { email, password } = loginData;

    // Buscar usuario por email
    const [user, userError] = await findUserByEmail(email);
    if (userError) {
      return [null, userError];
    }

    if (!user) {
      return [null, createErrorMessage('email', 'Credenciales inválidas')];
    }

    // Verificar si el usuario está activo
    if (user.estado !== 'activo') {
      return [null, createErrorMessage('estado', 'Usuario inactivo. Contacte al administrador')];
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return [null, createErrorMessage('password', 'Credenciales inválidas')];
    }

    // Generar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol
    });

    // Retornar datos sin la contraseña
    const { password: _, ...userWithoutPassword } = user;
    
    return [{ user: userWithoutPassword, token }, null];

  } catch (error) {
    console.error('Error en login:', error);
    return [null, 'Error interno del servidor'];
  }
}
export async function buscarUsuariosPorTermino(termino, opciones = {}) {
  try {
    const {
      roles = null, // null = no filtrar por roles, array = filtrar roles específicos
      estado = 'activo',
      limite = 20
    } = opciones;
    
    const userRepository = AppDataSource.getRepository(UsuarioSchema);
    const terminoLimpio = termino.trim();
    
    const queryBuilder = userRepository
      .createQueryBuilder('usuario')
      .select(['usuario.id', 'usuario.rut', 'usuario.nombre', 'usuario.email', 'usuario.rol'])
      .where('(usuario.rut LIKE :terminoRut OR LOWER(usuario.nombre) LIKE LOWER(:terminoNombre))', {
        terminoRut: `%${terminoLimpio}%`,
        terminoNombre: `%${terminoLimpio}%`
      })
      .andWhere('usuario.estado = :estado', { estado });
    
    // Solo filtrar por roles si se especifica explícitamente
    if (roles !== null && roles.length > 0) {
      if (roles.length === 1) {
        queryBuilder.andWhere('usuario.rol = :rol', { rol: roles[0] });
      } else {
        queryBuilder.andWhere('usuario.rol IN (:...roles)', { roles });
      }
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
