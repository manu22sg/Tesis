import { Router } from 'express';
import { register, login, logout, getProfile, verifyTokenController } from '../controllers/authController.js';
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

// Rutas protegidas (requieren autenticación)
router.post('/logout',
  authenticateToken,
  logout
);

router.get('/profile',
  authenticateToken,
  getProfile
);

router.get('/verify-token',
  authenticateToken,
  verifyTokenController
);

export default router;
