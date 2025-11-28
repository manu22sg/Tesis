import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  getProfile, 
  verifyTokenController,
  buscarUsuariosPorRuts, 
  buscarUsuarios,
  verificarEmail,      
  reenviarVerificacion,
  solicitarRestablecimiento,
  restablecerPassword
} from '../controllers/authController.js';
import { validateRegistration, validateLogin,validateRestablecerPasswordMiddleware,validateSolicitarRestablecimientoMiddleware } from '../middleware/validationMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', 
  validateRegistration,
  register
);

//  Login (sin autenticación)
router.post('/login',
  validateLogin,
  login
);

//  Logout
router.post('/logout',
  logout
);

//  Verificar email (sin autenticación - usa token en URL)
router.get('/verificar/:token',
  verificarEmail
);

//  Reenviar email de verificación (sin autenticación)
router.post('/reenviar-verificacion',
  reenviarVerificacion
);

router.post('/solicitar-restablecimiento',
  validateSolicitarRestablecimientoMiddleware,
  solicitarRestablecimiento
);

router.post('/restablecer-password/:token',
  validateRestablecerPasswordMiddleware,
  restablecerPassword
);



//  Rutas protegidas (requieren autenticación)
router.get('/profile',
  authenticateToken,
  getProfile
);

router.get('/verify', 
  authenticateToken, 
  verifyTokenController
);

router.post('/buscar-usuarios-rut', 
  authenticateToken, 
  buscarUsuariosPorRuts
);

router.get('/buscar-usuarios', 
  buscarUsuarios
);

export default router;