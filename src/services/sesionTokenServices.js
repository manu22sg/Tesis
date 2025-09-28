import { AppDataSource } from "../config/config.db.js";
import SesionEntrenamientoSchema from "../entity/SesionEntrenamiento.js";

function generarToken(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin confusos
  let t = "";
  for (let i = 0; i < length; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

export async function activarTokenSesion(sesionId, { ttlMin = 30, tokenLength = 6 }) {
  try {
    const repo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const sesion = await repo.findOne({ where: { id: sesionId } });
    if (!sesion) return [null, "Sesión no encontrada", 404];

    const now = new Date();
    const exp = new Date(now.getTime() + ttlMin * 60000);

    sesion.token = generarToken(tokenLength);
    sesion.tokenActivo = true;
    sesion.tokenExpiracion = exp;

    const actualizado = await repo.save(sesion);
    return [actualizado, null, 200];
  } catch (error) {
    console.error("Error activando token:", error);
    return [null, "Error al activar token", 500];
  }
}

export async function desactivarTokenSesion(sesionId) {
  try {
    const repo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const sesion = await repo.findOne({ where: { id: sesionId } });
    if (!sesion) return [null, "Sesión no encontrada", 404];

    sesion.tokenActivo = false;
    // opcional: sesion.token = null; sesion.tokenExpiracion = null;

    const actualizado = await repo.save(sesion);
    return [actualizado, null, 200];
  } catch (error) {
    console.error("Error desactivando token:", error);
    return [null, "Error al desactivar token", 500];
  }
}
