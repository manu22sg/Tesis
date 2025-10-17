import { Router } from 'express';
import { register, login, logout, getProfile, verifyTokenController,buscarUsuariosPorRuts, buscarUsuarios } from '../controllers/authController.js';
import { validateRegistration, validateLogin } from '../middleware/validationMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();


router.post('/register', 
  validateRegistration,
  register
);

router.post('/login',
  validateLogin,
  login
);

router.post('/logout',
  logout
);

router.get('/profile',
  authenticateToken,
  getProfile
);

router.get('/verify', authenticateToken, verifyTokenController);

router.post('/buscar-usuarios', authenticateToken, buscarUsuariosPorRuts);

router.get('/buscar-usuarios', authenticateToken, buscarUsuarios);
export default router;
