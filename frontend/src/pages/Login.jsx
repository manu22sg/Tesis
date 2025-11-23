import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Card, Spin, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { loginRequest } from '../services/auth.services.js';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

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
    const result = await loginRequest(values);

    if (result?.user) {
      login(result.user); 
      navigate('/dashboard', { replace: true });
      return;
    }

    message.error('No se recibió información del usuario');
  } catch (error) {
    message.error( error);
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
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f7f9fb",
      padding: "24px",
    }}
  >
    <Card
      style={{
        width: "100%",
        maxWidth: 380,
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        borderRadius: 12,
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: "#003a8c" }}>
          Iniciar Sesión
        </Title>
      </div>

      <Form layout="vertical" onFinish={onFinish}>
        
        {/* EMAIL */}
        <Form.Item
          label="Email"
          name="email"
          validateTrigger={["onBlur", "onSubmit"]}
          rules={[
            { required: true, message: "Por favor ingresa tu email" },
            {
              pattern: /^[a-zA-Z0-9._%+-]+@(alumnos\.)?ubiobio\.cl$/,
              message: "Debe ser un correo institucional UBB",
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="usuario@alumnos.ubiobio.cl"
            size="large"
          />
        </Form.Item>

        {/* PASSWORD */}
        <Form.Item
          label="Contraseña"
          name="password"
          rules={[
            { required: true, message: "Por favor ingresa tu contraseña" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="••••••••"
            size="large"
          />
        </Form.Item>

        {/* LOGIN BUTTON */}
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
          style={{
            backgroundColor: "#014898",
            borderColor: "#014898",
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          Iniciar Sesión
        </Button>
        <div style={{ marginTop: 16, textAlign: "center" }}>
  <Text>
    <a href="/solicitar-restablecimiento" style={{ color: "#014898" }}>
      ¿Olvidaste tu contraseña?
    </a>
  </Text>
</div>

        {/* LINK TO REGISTER */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <span>¿No tienes una cuenta? </span>
          <a
            onClick={() => navigate("/register")}
            style={{ color: "#014898", cursor: "pointer" }}
          >
            Regístrate aquí
          </a>
        </div>
      </Form>
    </Card>
  </div>
);
}
