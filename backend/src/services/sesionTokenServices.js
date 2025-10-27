import { AppDataSource } from "../config/config.db.js";
import SesionEntrenamientoSchema from "../entity/SesionEntrenamiento.js";
import { parseDateLocal } from '../utils/dateLocal.js';

function generarToken(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin confusos
  let t = "";
  for (let i = 0; i < length; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

export async function activarTokenSesion(sesionId, params = {}) {
  try {
    // ✅ Extraer todos los valores desde params
    const {
      ttlMin = 30,
      tokenLength = 6,
      latitudToken = null,
      longitudToken = null,
    } = params;

    const repo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const sesion = await repo.findOne({
      where: { id: sesionId },
      relations: ['grupo', 'cancha'],
    });

    if (!sesion) return [null, "Sesión no encontrada", 404];

    const ahora = new Date();
    const fechaSesion = parseDateLocal(sesion.fecha);

    const [horaFin, minFin] = sesion.horaFin.split(':').map(Number);
    const finSesion = new Date(fechaSesion);
    finSesion.setHours(horaFin, minFin, 0, 0);

    if (finSesion < ahora) {
      return [null, "No se puede activar el token para una sesión que ya finalizó", 400];
    }

    // ✅ Generar token único
    let token;
    const maxIntentos = 10;
    for (let i = 0; i < maxIntentos; i++) {
      token = generarToken(tokenLength);
      const existente = await repo.findOne({ where: { token, tokenActivo: true } });
      if (!existente) break;
      if (i === maxIntentos - 1) {
        return [null, "No se pudo generar un token único, intente nuevamente", 500];
      }
    }

    const exp = new Date(ahora.getTime() + ttlMin * 60000);

    // ✅ Guardar token y ubicación (si viene)
    sesion.token = token;
    sesion.tokenActivo = true;
    sesion.tokenExpiracion = exp;

    // ✅ Guardar coordenadas si el DT las envió
    if (latitudToken !== null && longitudToken !== null) {
      sesion.latitudToken = latitudToken;
      sesion.longitudToken = longitudToken;
    }

    const actualizado = await repo.save(sesion);

    const sesionCompleta = await repo.findOne({
      where: { id: actualizado.id },
      relations: ['grupo', 'cancha'],
    });

    return [sesionCompleta, null, 200];
  } catch (error) {
    console.error("Error activando token:", error);
    return [null, "Error al activar token", 500];
  }
}



export async function desactivarTokenSesion(sesionId) {
  try {
    const repo = AppDataSource.getRepository(SesionEntrenamientoSchema);
    const sesion = await repo.findOne({ 
      where: { id: sesionId },
      relations: ['grupo', 'cancha'] 
    });
    
    if (!sesion) return [null, "Sesión no encontrada", 404];

    sesion.tokenActivo = false;
    // opcional: sesion.token = null; sesion.tokenExpiracion = null;

    const actualizado = await repo.save(sesion);
    
    const sesionCompleta = await repo.findOne({
      where: { id: actualizado.id },
      relations: ['grupo', 'cancha']
    });

    return [sesionCompleta, null, 200];
  } catch (error) {
    console.error("Error desactivando token:", error);
    return [null, "Error al desactivar token", 500];
  }
}

