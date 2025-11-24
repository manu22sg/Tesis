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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 Verificando token:', token ? 'existe' : 'no existe');
      
      if (!token) {
        setUsuario(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const response = await verifyToken();
      const user = response?.data?.user;

      if (user && user.verificado) {
        console.log('✅ Usuario verificado:', user.nombre, '- Rol:', user.rol);
        setUsuario(user);
        setIsAuthenticated(true);
      } else {
        console.warn('⚠️ Usuario no verificado o no encontrado');
        setUsuario(null);
        setIsAuthenticated(false);
        await AsyncStorage.removeItem('token');
      }
    } catch (error) {
      setUsuario(null);
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await loginRequest(credentials);
      
      console.log('📥 Respuesta de login:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data?.user) {
        const user = response.data.user;
        
        if (!user.verificado) {
          console.warn('⚠️ Usuario NO verificado');
          await AsyncStorage.removeItem('token');
          
          return { 
            success: false, 
            message: 'Debes verificar tu correo institucional antes de iniciar sesión.',
            needsVerification: true
          };
        }

        console.log('✅ Estableciendo usuario:', user.nombre, '- Rol:', user.rol);
        setUsuario(user);
        setIsAuthenticated(true);
        
        // Pequeño delay para asegurar que el estado se actualizó
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return { success: true, data: response.data };
      }
      
      console.warn('⚠️ Respuesta sin success o sin user');
      return { success: false, message: response.message || 'Error desconocido' };
    } catch (error) {
      
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || error.message || 'Error al iniciar sesión';
      
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
      setIsAuthenticated(false);
      console.log('✅ Logout exitoso');
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerRequest(userData);
      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error.response?.data?.message 
        || error.message
        || 'Error al registrarse';
      
      return { success: false, message: errorMessage };
    }
  };

  const userRole = usuario?.rol || null;
  
  console.log('🔍 AuthContext state:', { 
    usuario: usuario?.nombre || 'null', 
    rol: userRole, 
    isAuthenticated,
    loading
  });

  return (
    <AuthContext.Provider
      value={{
        usuario,
        userRole, 
        loading,
        login,
        logout,
        register,
        isAuthenticated,
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