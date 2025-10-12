import { programarPartido,registrarResultado, obtenerPartidosPorCampeonato } from "../services/partidoServices.js";
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
    const { golesA, golesB } = req.body;

    const partido = await registrarResultado({ partidoId, golesA, golesB });
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

