import api from './root.services.js';

const CAMPEONATOS_BASE = '/campeonatos';

export const campeonatoService = {
  // Crear campeonato
  crear: async (payload) => {
    const response = await api.post(CAMPEONATOS_BASE, payload);
    return response.data;
  },

  // Listar todos los campeonatos
  listar: async () => {
    const response = await api.get(CAMPEONATOS_BASE);
    return response.data;
  },

  // Obtener un campeonato por ID
  obtener: async (id) => {
    const response = await api.get(`${CAMPEONATOS_BASE}/${id}`);
    return response.data;
  },

  // Actualizar campeonato
  actualizar: async (id, payload) => {
    const response = await api.patch(`${CAMPEONATOS_BASE}/${id}`, payload);
    return response.data;
  },

  // Eliminar campeonato
  eliminar: async (id) => {
    const response = await api.delete(`${CAMPEONATOS_BASE}/${id}`);
    return response.data;
  },

  // Sortear primera ronda
  sortearPrimeraRonda: async (id) => {
    const response = await api.post(`${CAMPEONATOS_BASE}/${id}/sortear`);
    return response.data;
  },

  // Generar siguiente ronda
  generarSiguienteRonda: async (id) => {
    const response = await api.post(`${CAMPEONATOS_BASE}/${id}/siguiente-ronda`, {});
    return response.data;
  }
};