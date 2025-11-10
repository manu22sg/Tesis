import { activarTokenSesion, desactivarTokenSesion } from "../services/sesionTokenServices.js";
import { success, error } from "../utils/responseHandler.js";
export async function activarTokenController(req, res) {
  try {
    const sesionId = parseInt(req.params.id, 10);
    if (!Number.isFinite(sesionId)) return error(res, "ID de sesión inválido", 400);

    const { ttlMin, tokenLength, requiereUbicacion, latitudToken, longitudToken } = req.body;

    const [sesion, err, status] = await activarTokenSesion(sesionId, {
      ttlMin,
      tokenLength,
      requiereUbicacion: Boolean(requiereUbicacion),
      latitudToken,
      longitudToken,
    });

    if (err) return error(res, err, status || 400);
    return success(res, sesion, "Token activado correctamente");
  } catch (e) {
    console.error("activarTokenController:", e);
    return error(res, "Error interno del servidor", 500);
  }
}



export async function desactivarTokenController(req, res) {
  const sesionId = parseInt(req.params.id);
  const [sesion, err, status] = await desactivarTokenSesion(sesionId);
  if (err) return error(res, err, status || 400);
  return success(res, sesion, "Token desactivado correctamente");
}
