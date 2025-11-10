import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Card, Spin, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { loginRequest } from '../services/auth.services.js';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, usuario, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated && usuario) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, usuario, authLoading, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const user = await loginRequest(values);

      if (user) {
        login(user);
        navigate('/dashboard', { replace: true });
      } else {
        message.error('No se recibió información del usuario');
      }
    } catch (error) {
      console.error('Error en login:', error);
      let errorMsg = 'Error al iniciar sesión';

      if (error.response?.data?.message) errorMsg = error.response.data.message;
      else if (error.response?.status === 401)
        errorMsg = 'Email o contraseña incorrectos';
      else if (error.response?.status === 403)
        errorMsg = 'Usuario inactivo. Contacte al administrador';
      else if (!error.response)
        errorMsg = 'No se pudo conectar con el servidor';

      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Verificando sesión..." />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7f9fb',
        padding: '24px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          borderRadius: 12,
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={3} style={{ margin: 0, color: '#003a8c' }}>
            Iniciar Sesión
          </Title>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Por favor ingresa tu email' },
              { type: 'email', message: 'Ingresa un email válido' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="tu@email.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[
              { required: true, message: 'Por favor ingresa tu contraseña' },
              { min: 6, message: 'Debe tener al menos 6 caracteres' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{
              backgroundColor: '#003a8c',
              borderColor: '#003a8c',
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            Iniciar Sesión
          </Button>
        </Form>
      </Card>
    </div>
  );
}
