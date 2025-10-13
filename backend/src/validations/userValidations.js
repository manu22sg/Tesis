import Joi from 'joi';

// Validador personalizado para RUT chileno
const rutValidator = (value, helpers) => {
  // Formato básico: ########-# (7-8 dígitos, guión, 1 dígito o K)
  const rutRegex = /^\d{7,8}-[\dKk]$/;
  if (!rutRegex.test(value)) {
    return helpers.message('Formato de RUT inválido. Use el formato: 12345678-9');
  }
  return value;
};

// Validador personalizado para emails institucionales
const institutionalEmailValidator = (value, helpers) => {
  const allowedDomains = ['@alumnos.ubiobio.cl', '@ubiobio.cl'];
  const isValid = allowedDomains.some(domain => value.endsWith(domain));
  
  if (!isValid) {
    return helpers.message('Debe usar un email institucional (@alumnos.ubiobio.cl o @ubiobio.cl)');
  }
  return value;
};

// Schema para registro de usuario
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
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.empty': 'La contraseña es obligatoria',
      'any.required': 'La contraseña es obligatoria',
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.max': 'La contraseña no puede tener más de 128 caracteres',
      'string.pattern.base': 'La contraseña debe tener al menos una mayúscula, una minúscula y un número'
    }),

  rol: Joi.string()
    .valid('estudiante', 'academico')
    .optional()
    .messages({
      'any.only': 'El rol debe ser "estudiante" o "academico"'
    })
});

// Schema para login de usuario
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

// Funciones de validación que mantienen tu patrón [data, error]
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

// Funciones auxiliares (mantienen compatibilidad con tu código anterior)
export const validateRut = (rut) => {
  const rutRegex = /^\d{7,8}-[\dKk]$/;
  return rutRegex.test(rut);
};

export const validateEmail = (email) => {
  const allowedDomains = ['@alumnos.ubiobio.cl', '@ubiobio.cl'];
  return allowedDomains.some(domain => email.endsWith(domain));
};

export const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};