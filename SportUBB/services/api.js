import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Obtener la URL del backend
const getBaseURL = () => {
  if (__DEV__) {
    if (Constants.expoConfig?.extra?.apiUrl) {
      return Constants.expoConfig.extra.apiUrl;
    }
    return 'http://192.168.1.10:3000/api'; 
  }
  return 'https://tu-api-produccion.com/api';
};

const instance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

instance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error obteniendo token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    
    // Si el token expiró o es inválido
    if (status === 401) {
      const url = error.config?.url;
      
      // No loguear errores esperados
      if (!url?.includes('/logout') && !url?.includes('/verify')) {
        console.error('❌ Token inválido o expirado');
        
        // Limpiar token local
        try {
          await AsyncStorage.removeItem('token');
        } catch (e) {
          console.error('Error limpiando token:', e);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;