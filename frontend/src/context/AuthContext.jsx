import { createContext, useContext, useState, useEffect } from "react";
import { verifyToken, logoutRequest } from "../services/auth.services.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar token al cargar la app
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await verifyToken();
      if (userData) {
        setUsuario(userData);
      } else {
        setUsuario(null);
      }
    } catch (error) {
      console.error("Error verificando sesión:", error);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUsuario(userData);
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.warn("Error en logout (ignorado):", error.message);
    } finally {
      // SIEMPRE limpiar el usuario, incluso si hay error
      setUsuario(null);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        usuario,           
        loading, 
        login, 
        logout, 
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