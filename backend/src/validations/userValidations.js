import Joi from 'joi';
import { validarRut as validarRutDV } from '../utils/validarRut.js';

// ============================================
// VALIDADOR PERSONALIZADO PARA RUT CHILENO
// ============================================
const rutValidator = (value, helpers) => {
  const rutRegex = /^\d{7,8}-[\dKk]$/;

  if (!rutRegex.test(value)) {
    return helpers.message('Formato de RUT inválido. Use el formato 12345678-9');
  }

  if (!validarRutDV(value)) {
    return helpers.message('RUT inválido. Dígito verificador incorrecto');
  }

  return value;
};

// ============================================
// VALIDADOR PERSONALIZADO PARA EMAILS INSTITUCIONALES
// ============================================
const institutionalEmailValidator = (value, helpers) => {
  const allowedDomains = ['@alumnos.ubiobio.cl', '@ubiobio.cl'];
  const isValid = allowedDomains.some(domain => value.endsWith(domain));
  
  if (!isValid) {
    return helpers.message('Debe usar un email institucional (@alumnos.ubiobio.cl o @ubiobio.cl)');
  }
  return value;
};

// ============================================
// REGEX PARA CONTRASEÑA FUERTE CON SÍMBOLOS ESPECIALES
// ============================================
// Incluye: @ $ ! % * ? & _ . # - ' " 
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_.#\-'"])/;

// ============================================
// SCHEMA PARA REGISTRO DE USUARIO
// ============================================
export const registerSchema = Joi.object({
  rut: Joi.string()
    .required()
    .custom(rutValidator)
    .messages({
      'string.empty': 'El RUT es obligatorio',
      'any.required': 'El RUT es obligatorio'
    }),

  nombre: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim()
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .messages({
      'string.empty': 'El nombre es obligatorio',
      'any.required': 'El nombre es obligatorio',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede tener más de 100 caracteres',
      'string.pattern.base': 'El nombre solo puede contener letras y espacios'
    }),

  apellido: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim()
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .messages({
      'string.empty': 'El apellido es obligatorio',
      'any.required': 'El apellido es obligatorio',
      'string.min': 'El apellido debe tener al menos 2 caracteres',
      'string.max': 'El apellido no puede tener más de 100 caracteres',
      'string.pattern.base': 'El apellido solo puede contener letras y espacios'
    }),

  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .custom(institutionalEmailValidator)
    .messages({
      'string.empty': 'El email es obligatorio',
      'any.required': 'El email es obligatorio',
      'string.email': 'Debe ser un email válido'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(strongPasswordRegex)
    .messages({
      'string.empty': 'La contraseña es obligatoria',
      'any.required': 'La contraseña es obligatoria',
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.max': 'La contraseña no puede tener más de 128 caracteres',
      'string.pattern.base': 'La contraseña debe tener: mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&_.#-\'")'
    }),

  sexo: Joi.string()
    .valid('Masculino', 'Femenino', 'Otro')
    .required()
    .messages({
      'string.empty': 'El sexo es obligatorio',
      'any.required': 'El sexo es obligatorio',
      'any.only': 'El sexo debe ser Masculino, Femenino u Otro'
    }),

  carreraId: Joi.number()
    .integer()
    .positive()
    .required()
    .optional()
    .allow(null,' ')
    .messages({
      'number.base': 'La carrera es obligatoria',
      'any.required': 'Debe seleccionar una carrera',
      'number.positive': 'Debe seleccionar una carrera válida'
    }),

  anioIngresoUniversidad: Joi.number()
    .integer()
    .min(1990)
    .max(new Date().getFullYear())
    .optional()
    .allow(null,'')
    .messages({
      'number.base': 'El año de ingreso debe ser un número válido',
      'number.min': 'El año de ingreso no puede ser anterior a 1990',
      'number.max': `El año de ingreso no puede ser mayor a ${new Date().getFullYear()}`
    })
})
// ✅ VALIDACIÓN CONDICIONAL: Si es estudiante (@alumnos), el año es obligatorio
.custom((value, helpers) => {
  const { email, anioIngresoUniversidad } = value;
  
  // Si es estudiante (@alumnos.ubiobio.cl) y no tiene año de ingreso
  if (email.endsWith('@alumnos.ubiobio.cl') && !anioIngresoUniversidad) {
    return helpers.error('any.invalid', { 
      message: 'Los estudiantes deben ingresar su año de ingreso a la carrera' 
    });
  }
  
  return value;
});

// ============================================
// SCHEMA PARA LOGIN DE USUARIO
// ============================================
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .custom(institutionalEmailValidator)
    .messages({
      'string.empty': 'El email es obligatorio',
      'any.required': 'El email es obligatorio',
      'string.email': 'Debe ser un email válido'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'La contraseña es obligatoria',
      'any.required': 'La contraseña es obligatoria'
    })
});

// ============================================
// SCHEMA PARA RESTABLECER CONTRASEÑA
// ============================================
export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(strongPasswordRegex)
    .messages({
      'string.empty': 'La contraseña es obligatoria',
      'any.required': 'La contraseña es obligatoria',
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.max': 'La contraseña no puede tener más de 128 caracteres',
      'string.pattern.base': 'La contraseña debe tener: mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&_.#-\'")'
    })
});

// ============================================
// SCHEMA PARA SOLICITAR RESTABLECIMIENTO
// ============================================
export const solicitarRestablecimientoSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .custom(institutionalEmailValidator)
    .messages({
      'string.empty': 'El email es obligatorio',
      'any.required': 'El email es obligatorio',
      'string.email': 'Debe ser un email válido'
    })
});

// ============================================
// FUNCIÓN PARA VALIDAR REGISTRO
// ============================================
export function validateRegistrationData(data) {
  const { error, value } = registerSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const formattedErrors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message
    }));

    return {
      isValid: false,
      errors: formattedErrors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
}

// ============================================
// FUNCIÓN PARA VALIDAR LOGIN
// ============================================
export function validateLoginData(data) {
  const { error, value } = loginSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const formattedErrors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message
    }));

    return {
      isValid: false,
      errors: formattedErrors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
}

// ============================================
// FUNCIÓN PARA VALIDAR RESTABLECIMIENTO DE CONTRASEÑA
// ============================================
export function validateResetPasswordData(data) {
  const { error, value } = resetPasswordSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const formattedErrors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message
    }));

    return {
      isValid: false,
      errors: formattedErrors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
}

// ============================================
// FUNCIÓN PARA VALIDAR SOLICITUD DE RESTABLECIMIENTO
// ============================================
export function validateSolicitarRestablecimiento(data) {
  const { error, value } = solicitarRestablecimientoSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const formattedErrors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message
    }));

    return {
      isValid: false,
      errors: formattedErrors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
export const validateRut = (rut) => {
  const rutRegex = /^\d{7,8}-[\dKk]$/;
  return rutRegex.test(rut);
};

export const validateEmail = (email) => {
  const allowedDomains = ['@alumnos.ubiobio.cl', '@ubiobio.cl'];
  return allowedDomains.some(domain => email.endsWith(domain));
};

export const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_.#\-'"]).{8,}$/;
  return passwordRegex.test(password);
};