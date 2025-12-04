import { programarPartido,registrarResultado, obtenerPartidosPorCampeonato,verificarDisponibilidadPartido } from "../services/partidoServices.js";
import { success, error } from "../utils/responseHandler.js";

export const asignarPartido = async (req, res) => {
  try {
    const [partido, err] = await programarPartido(req.params.id, req.body);
    if (err) return res.status(400).json({ error: err });
    res.status(200).json(partido);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const postRegistrarResultado = async (req, res) => {
  try {
    const partidoId = Number(req.params.id);
    const { golesA, golesB, penalesA, penalesB } = req.body; 

    const partido = await registrarResultado({ 
      partidoId, 
      golesA, 
      golesB,
      penalesA,    
      penalesB     
    });
    
    return success(res, partido, "Resultado registrado correctamente");
  } catch (e) {
    console.error("Error registrando resultado:", e);
    return error(res, e.message, 400);
  }
};

export const getPartidosPorCampeonato = async (req, res) => {
  try {
    const campeonatoId = Number(req.params.id);
    const { estado, ronda } = req.query; // filtros opcionales

    const partidos = await obtenerPartidosPorCampeonato(campeonatoId, { estado, ronda });
    return success(res, partidos, "Partidos del campeonato obtenidos correctamente");
  } catch (e) {
    console.error("Error obteniendo partidos del campeonato:", e);
    return error(res, e.message, 400);
  }
};

export async function ctrlVerificarDisponibilidadPartido(req, res) {
  try {
    const { canchaId, fecha, horaInicio, horaFin, partidoId } = req.query;

    if (!canchaId || !fecha || !horaInicio || !horaFin) {
      return error(res, "Faltan parámetros requeridos", 400);
    }

    const result = await verificarDisponibilidadPartido(
      Number(canchaId),
      fecha,
      horaInicio,
      horaFin,
      partidoId ? Number(partidoId) : null
    );

    // ⚠️ Mantengo el formato que espera tu frontend:
    // { disponible: boolean, message: string }
    return res.json(result);

  } catch (e) {
    console.error("Error en ctrlVerificarDisponibilidadPartido:", e);

    return error(res, "Error interno del servidor", 500);
  }
}