import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { 
  loginRequest, 
  logoutRequest, 
  verifyToken 
} from '../services/authServices';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        setUsuario(null);
        setLoading(false);
        return;
      }

      const response = await verifyToken();
      const user = response?.data?.user;

      // 🔥 Verificar que el usuario exista Y esté verificado
      if (user && user.verificado) {
        setUsuario(user);
      } else {
        console.warn('⚠️ Usuario no verificado o no encontrado');
        setUsuario(null);
        await AsyncStorage.removeItem('token');
      }
    } catch (error) {
      console.error('❌ Error verificando sesión:', error.message);
      setUsuario(null);
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

 const login = async (credentials) => {
  try {
    const response = await loginRequest(credentials);
    
    
    if (response.success && response.data?.user) {
      const user = response.data.user;
      
      
      
      // 🔥 Verificar si el usuario está verificado
      if (!user.verificado) {
        console.warn('⚠️ Usuario NO verificado en frontend');
        await AsyncStorage.removeItem('token');
        
        return { 
          success: false, 
          message: 'Debes verificar tu correo institucional antes de iniciar sesión. Revisa tu bandeja de entrada.',
          needsVerification: true
        };
      }

      setUsuario(user);
      return { success: true, data: response.data };
    }
    
    console.warn('⚠️ Respuesta sin success o sin user');
    return { success: false, message: response.message };
  } catch (error) {
    
    
    // 🔥 Manejar específicamente el error de verificación
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || 'Error al iniciar sesión';
    
    
    // Si el backend dice que falta verificar
    if (errorMessage.toLowerCase().includes('verificar') || 
        errorMessage.toLowerCase().includes('correo')) {
      return { 
        success: false, 
        message: errorMessage,
        needsVerification: true
      };
    }
    
    return { success: false, message: errorMessage };
  }
};

  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.warn('⚠️ Error en logout (ignorado):', error.message);
    } finally {
      setUsuario(null);
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerRequest(userData);
      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error.response?.data?.message 
        || 'Error al registrarse';
      
      return { success: false, message: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        login,
        logout,
        register,
        isAuthenticated: !!usuario,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};