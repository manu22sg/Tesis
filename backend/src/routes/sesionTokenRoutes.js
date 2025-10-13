import { Router } from "express";
import { validarBody, validarParams,idParamSchema} from "../validations/commonValidations.js";
import { requireRole, authenticateToken } from "../middleware/authMiddleware.js";
import { activarTokenSchema, desactivarTokenSchema } from "../validations/sesionTokenValidations.js";
import {
  activarTokenController,
  desactivarTokenController
} from "../controllers/sesionTokenController.js";

const router = Router();

// Activar/generar token para la sesión (entrenador)
router.post(
  "/activar/:id",
authenticateToken,
  requireRole("entrenador"),
  validarParams(idParamSchema),
  validarBody(activarTokenSchema),
  activarTokenController
);

// Desactivar token (entrenador)
router.patch(
  "/desactivar/:id",
  authenticateToken,
  requireRole("entrenador"),
  validarParams(idParamSchema),
  validarBody(desactivarTokenSchema),
  desactivarTokenController
);

export default router;
