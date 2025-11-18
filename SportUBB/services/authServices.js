import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const registerRequest = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginRequest = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data?.data?.token) {
    await AsyncStorage.setItem('token', response.data.data.token);
  }
  
  return response.data;
};

export const logoutRequest = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    await AsyncStorage.removeItem('token');
  }
};

export const verifyToken = async () => {
  const token = await AsyncStorage.getItem('token');
  
  if (!token) {
    throw new Error('No hay token almacenado');
  }
  
  const response = await api.get('/auth/verify');
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

export const verificarEmailRequest = async (token) => {
  const response = await api.get(`/auth/verificar/${token}`);
  return response.data;
};

export const reenviarVerificacionRequest = async (email) => {
  const response = await api.post('/auth/reenviar-verificacion', { email });
  return response.data;
};

export const buscarUsuarios = async (termino, opciones = {}) => {
  const params = new URLSearchParams({
    termino,
    ...opciones
  });
  
  const response = await api.get(`/auth/buscar-usuarios?${params}`);
  return response.data.data;
};
