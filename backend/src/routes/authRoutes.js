import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  getProfile, 
  verifyTokenController,
  buscarUsuariosPorRuts, 
  buscarUsuarios,
  verificarEmail,         //  NUEVO
  reenviarVerificacion   //  NUEVO
} from '../controllers/authController.js';
import { validateRegistration, validateLogin } from '../middleware/validationMiddleware.js';
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
  authenticateToken, 
  buscarUsuarios
);

export default router;