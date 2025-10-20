import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';

const NotFound = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const handleBackHome = () => {
    if (usuario) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const content = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        padding: '24px',
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="Lo sentimos, la página que buscas no existe."
        extra={
          <Button type="primary" onClick={handleBackHome}>
            {usuario ? 'Volver al Dashboard' : 'Ir al Login'}
          </Button>
        }
      />
    </div>
  );

  // Si el usuario está logueado, mostrar dentro del MainLayout
  if (usuario) {
    return <MainLayout>{content}</MainLayout>;
  }

  // Si no está logueado, mostrar sin layout (pantalla completa)
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
        status="404"
        title="404"
        subTitle="Lo sentimos, la página que buscas no existe."
        extra={
          <Button type="primary" onClick={handleBackHome}>
            Ir al Login
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;