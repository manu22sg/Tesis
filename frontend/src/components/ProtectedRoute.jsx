import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Spin, Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, usuario, loading } = useAuth();
  const navigate = useNavigate();

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
  if (roles) {
    const userRole = (usuario?.rol?.nombre || usuario?.rol || '').toLowerCase();
    
    if (!roles.includes(userRole)) {
      console.log("🚫 Rol no permitido:", userRole, "Roles permitidos:", roles);
      
      // Mostrar página de acceso denegado en lugar de redirigir
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '24px',
          }}
        >
          <Result
            status="403"
            title="Acceso Denegado"
            subTitle="Lo sentimos, no tienes permisos para acceder a esta página."
            extra={
              <Button type="primary" onClick={() => navigate('/dashboard')}>
                Volver al Dashboard
              </Button>
            }
          />
        </div>
      );
    }
  }

  return children;
}