import {
  crearCampeonato, listarCampeonatos, obtenerCampeonato,
  actualizarCampeonato, eliminarCampeonato
} from "../services/campeonatoServices.js";
import { success, error } from "../utils/responseHandler.js";
import {
  sortearPrimeraRonda, generarSiguienteRonda
} from "../services/fixtureServices.js";

export const postCampeonato = async (req, res) => {
  try {
    const data = await crearCampeonato(req.body);
    res.status(201).json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
};

export const getCampeonatos = async (_req, res) => {
  try { res.json(await listarCampeonatos()); }
  catch (e) { res.status(400).json({ error: e.message }); }
};

export const getCampeonato = async (req, res) => {
  try {
    const data = await obtenerCampeonato(req.params.id);
    if (!data) return res.status(404).json({ error: "No encontrado" });
    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
};

export const putCampeonato = async (req, res) => {
  try { res.json(await actualizarCampeonato(req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
};

export const deleteCampeonato = async (req, res) => {
  try { res.json(await eliminarCampeonato(req.params.id)); }
  catch (e) {
    console.log("Error al eliminar campeonato ID:", req.params.id, e); 
    res.status(400).json({ error: e.message }); }
};

// Fixture
export const postSortearPrimeraRonda = async (req, res) => {
  try { res.json(await sortearPrimeraRonda({ campeonatoId: req.params.id })); }
  catch (e) { res.status(400).json({ error: e.message }); }
};

export const postGenerarSiguienteRonda = async (req, res) => {
  try {
    const { rondaAnterior } = req.body;
    const resultado = await generarSiguienteRonda({ 
      campeonatoId: req.params.id, 
      rondaAnterior 
    });
    res.json(resultado);
  } catch (e) { 
    res.status(400).json({ error: e.message }); 
  }
};