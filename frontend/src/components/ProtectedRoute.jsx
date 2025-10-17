import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Spin } from "antd";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Mientras se verifica sesión, mostrar spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Verificando sesión..." />
      </div>
    );
  }

  // Solo redirigir si ya terminó la verificación y no hay sesión
  if (!loading && !isAuthenticated) {
    console.log("🔁 Redirigiendo al login (no autenticado)");
    return <Navigate to="/login" replace />;
  }

  // Validar roles si corresponde
  if (roles && !roles.includes(user?.rol)) {
    console.log(" Rol no permitido:", user?.rol);
    return <Navigate to="/" replace />;
  }

  return children;
}
