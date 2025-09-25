
import { validateRegistrationData, validateLoginData } from '../validations/userValidations.js';
import { validationError } from '../utils/responseHandler.js';

export const validateRegistration = (req, res, next) => {
  const { isValid, errors } = validateRegistrationData(req.body);
  
  if (!isValid) {
    return validationError(res, errors, 'Error de validación en el registro');
  }
  
  next();
};

export const validateLogin = (req, res, next) => {
  const { isValid, errors } = validateLoginData(req.body);
  
  if (!isValid) {
    return validationError(res, errors, 'Error de validación en el login');
  }
  
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