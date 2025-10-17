import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // 
import { logoutRequest } from '../services/auth.services.js';

export default function Dashboard() {
  const { user, logout } = useAuth(); // 
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutRequest();
    logout(); // limpia el contexto
    navigate('/login');
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Bienvenido, {user?.nombre || 'Usuario'}</h1>
      <p>Rol: {user?.rol}</p>
      <Button onClick={handleLogout}>Cerrar sesión</Button>
    </div>
  );
}
