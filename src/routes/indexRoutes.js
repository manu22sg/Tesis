import { Router } from "express";
import authRoutes from "./authRoutes.js";
import horarioRoutes from "./horarioRoutes.js";
import canchasRoutes from "./canchaRoutes.js";
import reservaRoutes from "./reservaRoutes.js";
import aprobacionRoutes from "./aprobacionRoutes.js";
import entrenamientoRoutes from "./entrenamientoRoutes.js";
const router = Router();

router.use("/auth", authRoutes);
router.use("/horario", horarioRoutes);
router.use("/canchas", canchasRoutes);
router.use("/reservas", reservaRoutes);
router.use("/aprobacion", aprobacionRoutes);
router.use("/entrenamientos", entrenamientoRoutes);
export default router;