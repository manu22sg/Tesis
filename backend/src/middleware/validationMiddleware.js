
import { validateRegistrationData, validateLoginData,validateResetPasswordData,
  validateSolicitarRestablecimiento
} from '../validations/userValidations.js';
import { validationError } from '../utils/responseHandler.js';
export const validateRegistration = (req, res, next) => {
  const { isValid, errors, data } = validateRegistrationData(req.body);
  //                              
  
  if (!isValid) {
    return validationError(res, errors, 'Error de validación en el registro');
  }
  
  req.body = data; // ✅ Reemplaza req.body con los datos validados (email en minúsculas)
  next();
};

export const validateLogin = (req, res, next) => {
  const { isValid, errors, data } = validateLoginData(req.body);
  //                              
  
  if (!isValid) {
    return validationError(res, errors, 'Error de validación en el login');
  }
  
  req.body = data;
  next();
};

// Middleware para sanitizar datos de entrada
export const sanitizeInput = (req, res, next) => {
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
  }
  
  if (req.body.nombre) {
    req.body.nombre = req.body.nombre.trim();
  }
  
  if (req.body.rut) {
    req.body.rut = req.body.rut.trim();
  }
  
  next();
};

export function validateSolicitarRestablecimientoMiddleware(req, res, next) {
  const validation = validateSolicitarRestablecimiento(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: validation.errors
    });
  }

  req.body = validation.data;
  next();
}

export function validateRestablecerPasswordMiddleware(req, res, next) {
  const validation = validateResetPasswordData(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: validation.errors
    });
  }

  req.body = validation.data;
  next();
}
