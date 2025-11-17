import api from './api';

export const partidoService = {
  // Listar partidos por campeonato
  listarPorCampeonato: async (campeonatoId, filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.ronda) params.append('ronda', filtros.ronda);
    
    const queryString = params.toString();
    const url = `/partidos/campeonato/${campeonatoId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  // Programar partido (asignar cancha, fecha y hora)
  programar: async (partidoId, data) => {
    const response = await api.patch(`/partidos/${partidoId}/programar`, data);
    return response.data;
  },

  // Registrar resultado del partido
  registrarResultado: async (partidoId, data) => {
  const response = await api.post(`/partidos/${partidoId}/registrar-resultado`, {
    golesA: data.golesA,
    golesB: data.golesB,
    penalesA: data.penalesA,  
    penalesB: data.penalesB   
  });
  return response.data;
}
};