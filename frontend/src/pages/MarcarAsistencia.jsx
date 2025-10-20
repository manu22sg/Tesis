import { useState } from 'react';
import {
  Card,
  Input,
  Button,
  message,
  Typography,
  Space,
  Alert,
  Spin,
  Result
} from 'antd';
import {
  CheckCircleOutlined,
  KeyOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { marcarAsistencia } from '../services/asistencia.services.js';

const { Title, Text } = Typography;

export default function MarcarAsistencia() {
  const [sesionId, setSesionId] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);

  // Obtener ubicación del navegador
  const obtenerUbicacion = () => {
    setObteniendoUbicacion(true);
    
    if (!navigator.geolocation) {
      message.warning('Tu navegador no soporta geolocalización');
      setObteniendoUbicacion(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUbicacion({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude
        });
        message.success('Ubicación obtenida correctamente');
        setObteniendoUbicacion(false);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        message.warning('No se pudo obtener la ubicación. Se marcará sin ella.');
        setObteniendoUbicacion(false);
      }
    );
  };

  const handleMarcarAsistencia = async () => {
    if (!sesionId || !token) {
      message.error('Debes ingresar el ID de sesión y el código de asistencia');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        token: token.toUpperCase().trim(),
        estado: 'presente',
        origen: 'jugador'
      };

      // Agregar ubicación si está disponible
      if (ubicacion) {
        payload.latitud = ubicacion.latitud;
        payload.longitud = ubicacion.longitud;
      }

      await marcarAsistencia(parseInt(sesionId), payload);
      
      message.success('¡Asistencia registrada correctamente!');
      setSuccess(true);
      
      // Limpiar formulario después de 3 segundos
      setTimeout(() => {
        setSesionId('');
        setToken('');
        setUbicacion(null);
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error marcando asistencia:', error);
      const errorMsg = error.response?.data?.message || 'Error al registrar asistencia';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title={
            <span style={{ color: 'white', fontSize: 28 }}>
              ¡Asistencia Registrada!
            </span>
          }
          subTitle={
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
              Tu presencia ha sido confirmada exitosamente
            </span>
          }
          style={{ 
            background: 'white',
            borderRadius: 16,
            padding: '40px 20px',
            maxWidth: 500,
            margin: '0 20px'
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Card 
        style={{ 
          maxWidth: 500, 
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
          <Title level={2} style={{ marginBottom: 8 }}>Marcar Asistencia</Title>
          <Text type="secondary">Ingresa el código proporcionado por tu entrenador</Text>
        </div>

        <Alert
          message="Información"
          description="Solicita a tu entrenador el ID de la sesión y el código de asistencia activo"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* ID de Sesión */}
          <div>
            <Text strong>ID de Sesión:</Text>
            <Input
              size="large"
              placeholder="Ej: 123"
              value={sesionId}
              onChange={(e) => setSesionId(e.target.value)}
              style={{ marginTop: 8 }}
              type="number"
            />
          </div>

          {/* Código de Asistencia */}
          <div>
            <Text strong>Código de Asistencia:</Text>
            <Input
              size="large"
              placeholder="Ej: ABC123"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              maxLength={20}
              prefix={<KeyOutlined />}
              style={{ marginTop: 8, textTransform: 'uppercase' }}
            />
          </div>

          {/* Ubicación */}
          <div>
            <Button
              icon={<EnvironmentOutlined />}
              onClick={obtenerUbicacion}
              loading={obteniendoUbicacion}
              block
              type={ubicacion ? 'default' : 'dashed'}
            >
              {ubicacion 
                ? `✓ Ubicación obtenida (${ubicacion.latitud.toFixed(4)}, ${ubicacion.longitud.toFixed(4)})`
                : 'Obtener mi ubicación (opcional)'
              }
            </Button>
            {ubicacion && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                Tu ubicación será registrada con la asistencia
              </Text>
            )}
          </div>

          {/* Botón de envío */}
          <Button
            type="primary"
            size="large"
            block
            onClick={handleMarcarAsistencia}
            loading={loading}
            disabled={!sesionId || !token}
            style={{ 
              height: 50,
              fontSize: 16,
              fontWeight: 'bold',
              marginTop: 16
            }}
          >
            Confirmar Asistencia
          </Button>
        </Space>

        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: '#f5f5f5', 
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 Consejo: Asegúrate de tener el código correcto antes de confirmar
          </Text>
        </div>
      </Card>
    </div>
  );
}