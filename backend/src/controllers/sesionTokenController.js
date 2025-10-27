import { activarTokenSesion, desactivarTokenSesion } from "../services/sesionTokenServices.js";
import { success, error } from "../utils/responseHandler.js";

export async function activarTokenController(req, res) {
  const sesionId = parseInt(req.params.id);
  const { ttlMin, tokenLength, latitudToken, longitudToken } = req.body;

  const [sesion, err, status] = await activarTokenSesion(sesionId, { ttlMin, tokenLength,latitudToken, longitudToken });
  if (err) return error(res, err, status || 400);
  return success(res, sesion, "Token activado correctamente");
}

export async function desactivarTokenController(req, res) {
  const sesionId = parseInt(req.params.id);
  const [sesion, err, status] = await desactivarTokenSesion(sesionId);
  if (err) return error(res, err, status || 400);
  return success(res, sesion, "Token desactivado correctamente");
}
