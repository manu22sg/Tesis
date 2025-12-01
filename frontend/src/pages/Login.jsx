import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, App, Card, Spin, Typography, Modal } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { loginRequest, reenviarVerificacionRequest } from '../services/auth.services.js';
import { useAuth } from '../context/AuthContext';
import LogoCancha from '../assets/figura113.png';
const { Title } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [reenviandoEmail, setReenviandoEmail] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, usuario, loading: authLoading } = useAuth();
  const { message, modal } = App.useApp(); 

  useEffect(() => {
    if (!authLoading && isAuthenticated && usuario) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, usuario, authLoading, navigate]);

  const handleReenviarVerificacion = async (email) => {
    setReenviandoEmail(true);
    try {
      await reenviarVerificacionRequest(email);
      message.success('Correo de verificación reenviado exitosamente. Revisa tu bandeja de entrada.');
    } catch (error) {
      const errorMsg = error?.message || error?.error || 'Error al reenviar el correo';
      message.error(errorMsg);
    } finally {
      setReenviandoEmail(false);
    }
  };

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
      const errorMsg = error?.message || error;
      
      // Detectar si es error de cuenta no verificada
      if (errorMsg.includes('verificar su correo') || errorMsg.includes('Revise su bandeja')) {
        modal.confirm({
          title: 'Cuenta no verificada',
          icon: <MailOutlined style={{ color: '#faad14' }} />,
          content: (
            <div>
              <p style={{ marginBottom: 8 }}>
                {errorMsg}
              </p>
              <p style={{ margin: 0, color: '#595959' }}>
                ¿Desea que le reenviemos el correo de verificación a <strong>{values.email}</strong>?
              </p>
            </div>
          ),
          okText: 'Sí, reenviar correo',
          cancelText: 'Ahora no',
          okButtonProps: {
            loading: reenviandoEmail,
            style: { backgroundColor: '#014898' }
          },
          onOk: () => handleReenviarVerificacion(values.email),
        });
      } else {
        message.error(errorMsg);
      }
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
        background: "#f5f5f5",
        padding: "24px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          borderRadius: 12,
          backgroundColor: "#ffffff",
          paddingTop: 30,
        }}
      >
        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <img
            src={LogoCancha}
            alt="Logo"
            style={{
              width: 200,
              height: 200,
              objectFit: "contain",
              marginBottom: 10,
            }}
          />
        </div>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Title level={3} style={{ margin: 0, color: "#014898" }}>
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
              { required: true, message: "Por favor ingrese su email institucional" },
              {
                pattern: /^[a-zA-Z0-9._%+-]+@(alumnos\.)?ubiobio\.cl$/,
                message: "Debe ser un correo institucional UBB",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Ingrese su correo institucional UBB"
              size="large"
            />
          </Form.Item>

          {/* PASSWORD */}
          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: "Por favor ingresa tu contraseña" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Ingrese su contraseña"
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
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              backgroundColor: isHovered ? "#0056b3" : "#014898",
              borderColor: isHovered ? "#0056b3" : "#014898",
              borderRadius: 8,
              marginTop: 8,
              transition: "all 0.3s ease",
              transform: isHovered ? "translateY(-2px)" : "translateY(0)",
              boxShadow: isHovered ? "0 4px 12px rgba(1, 72, 152, 0.4)" : "none",
            }}
          >
            Iniciar Sesión
          </Button>

          {/* LINKS */}
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <a href="/solicitar-restablecimiento" style={{ color: "#014898" }}>
              ¿Olvidó su contraseña?
            </a>
          </div>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <span>¿No tiene una cuenta? </span>
            <a
              onClick={() => navigate("/register")}
              style={{ color: "#014898", cursor: "pointer" }}
            >
              Regístrese aquí
            </a>
          </div>
        </Form>
      </Card>
    </div>
  );
}