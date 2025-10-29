import axios from 'axios';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000/api'; 

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor de respuesta mejorado
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    // NO mostrar error 401 en logout o verify (es esperado cuando no hay sesión)
    if (status === 401 && !url?.includes('/logout') && !url?.includes('/verify')) {
      console.error('❌ No autenticado - sesión expirada');
    }
    
    return Promise.reject(error);
  }
);

export default instance;