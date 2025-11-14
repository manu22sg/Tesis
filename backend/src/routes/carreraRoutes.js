import { Router } from 'express';
import { listarCarreras } from '../controllers/carreraController.js';

const router = Router();

router.get('/', listarCarreras);

export default router;
