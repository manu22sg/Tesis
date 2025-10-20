// pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { loginRequest } from '../services/auth.services.js';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const user = await loginRequest(values);
      
      if (user) {
        login(user);
        message.success('¡Login exitoso!');
        navigate('/dashboard');
      } else {
        message.error('No se recibió información del usuario');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // Mejor manejo de mensajes de error
      let errorMsg = 'Error al iniciar sesión';
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMsg = 'Email o contraseña incorrectos';
      } else if (error.response?.status === 403) {
        errorMsg = 'Usuario inactivo. Contacte al administrador';
      } else if (!error.response) {
        errorMsg = 'No se pudo conectar con el servidor';
      }
      
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={onFinish} layout="vertical">
      <Form.Item 
        label="Email" 
        name="email" 
        rules={[
          { required: true, message: 'Por favor ingresa tu email' },
          { type: 'email', message: 'Ingresa un email válido' }
        ]}
      >
        <Input placeholder="tu@email.com" />
      </Form.Item>
      
      <Form.Item 
        label="Contraseña" 
        name="password" 
        rules={[
          { required: true, message: 'Por favor ingresa tu contraseña' },
          { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
        ]}
      >
        <Input.Password placeholder="••••••••" />
      </Form.Item>
      
      <Button type="primary" htmlType="submit" loading={loading} block>
        Iniciar Sesión
      </Button>
    </Form>
  );
}

