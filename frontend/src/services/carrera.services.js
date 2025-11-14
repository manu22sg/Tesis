import api from './root.services.js';

export const carreraService = {
  listar: async () => {
    const response = await api.get('/carreras');
    return response.data.data; // recuerda que devolvemos { success, data }
  }
};