import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // 
import { logoutRequest } from '../services/auth.services.js';
import MainLayout from '../components/MainLayout.jsx';
export default function Dashboard() {
  const { usuario, logout } = useAuth(); // 
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutRequest();
    logout(); // limpia el contexto
    navigate('/login');
  };

  return (
    <MainLayout>
    <div style={{ padding: 24 }}>
      <h1>Bienvenido, {usuario?.nombre || 'Usuario'}</h1>
      <p>Rol: {usuario?.rol}</p>
      <Button onClick={handleLogout}>Cerrar sesión</Button>
    </div>
    </MainLayout>
  );
}
