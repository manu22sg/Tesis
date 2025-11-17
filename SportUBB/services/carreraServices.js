import api from './api';

export const carreraService = {
  listar: async () => {
    const response = await api.get('/carreras');
    return response.data.data || response.data;
  }
};
