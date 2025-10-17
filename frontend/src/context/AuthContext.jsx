import { createContext, useContext, useState, useEffect } from "react";
import { verifyToken, logoutRequest } from "../services/auth.services.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar token al cargar la app
  useEffect(() => {
    //console.log("Verificando sesión existente...");
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await verifyToken();
      if (userData) {
        //console.log(" Sesión válida:", userData);
        setUser(userData);
      } else {
        //console.log(" No hay sesión activa");
        setUser(null);
      }
    } catch (error) {
      console.error(" Error verificando sesión:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    //console.log(" Usuario logueado:", userData);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutRequest();
      //console.log("Logout completado");
    } catch (error) {
      console.warn(" Error en logout (ignorado):", error.message);
    } finally {
      // SIEMPRE limpiar el usuario, incluso si hay error
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        isAuthenticated: !!user,
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