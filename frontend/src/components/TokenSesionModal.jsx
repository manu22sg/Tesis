import React, { useState } from 'react';
import { 
  Modal, 
  Button, 
  Alert, 
  Divider, 
  Popconfirm, 
  InputNumber, 
  Space, 
  Typography, 
  message,
  Switch,
  Spin
} from 'antd';
import { 
  KeyOutlined, 
  LockOutlined, 
  UnlockOutlined, 
  CopyOutlined,
  EnvironmentOutlined,
  AimOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function TokenSesionModal({
  open,
  sesion,
  ttlMin,
  setTtlMin,
  tokenLength,
  setTokenLength,
  loadingToken,
  onClose,
  onActivar,
  onDesactivar
}) {
  // Estados para ubicación
  const [incluirUbicacion, setIncluirUbicacion] = useState(false);
  const [ubicacion, setUbicacion] = useState({ latitud: null, longitud: null });
  const [loadingUbicacion, setLoadingUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState(null);

  const copiarToken = () => {
    if (sesion?.token) {
      navigator.clipboard.writeText(sesion.token);
      message.success('Token copiado al portapapeles');
    }
  };

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setErrorUbicacion('Tu navegador no soporta geolocalización');
      message.error('Tu navegador no soporta geolocalización');
      return;
    }

    setLoadingUbicacion(true);
    setErrorUbicacion(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nuevaUbicacion = {
          latitud: position.coords.latitude,
          longitud: position.coords.longitude
        };
        setUbicacion(nuevaUbicacion);
        setLoadingUbicacion(false);
        message.success('📍 Ubicación obtenida');
      },
      (error) => {
        setLoadingUbicacion(false);
        let errorMsg = 'No se pudo obtener la ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMsg = 'Tiempo de espera agotado';
            break;
        }
        
        setErrorUbicacion(errorMsg);
        message.error(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleActivar = () => {
    // Pasar ubicación si está activada
    const datosExtra = {};
    if (incluirUbicacion && ubicacion.latitud && ubicacion.longitud) {
      datosExtra.latitud = ubicacion.latitud;
      datosExtra.longitud = ubicacion.longitud;
    }
    onActivar(datosExtra);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KeyOutlined />
          <span>Gestionar Token de Asistencia</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={550}
    >
      {sesion && (
        <div>
          <Alert
            message="Token de Asistencia"
            description="Los jugadores usarán este código para registrar su asistencia a la sesión"
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />

          {sesion.tokenActivo ? (
            <>
              <div className="token-display">
                <div style={{ fontSize: 14, opacity: 0.9 }}>Código de Asistencia</div>
                <div className="token-code">{sesion.token}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Expira: {dayjs(sesion.tokenExpiracion).format('DD/MM/YYYY HH:mm')}
                </div>
              </div>

              <Space style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
                <Button icon={<CopyOutlined />} onClick={copiarToken} size="large">
                  Copiar Código
                </Button>
              </Space>

              <Divider />

              <Popconfirm
                title="¿Desactivar token?"
                description="Los jugadores ya no podrán registrar asistencia con este código"
                onConfirm={onDesactivar}
                okText="Sí, desactivar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
              >
                <Button danger block icon={<LockOutlined />} loading={loadingToken}>
                  Desactivar Token
                </Button>
              </Popconfirm>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <Text strong>Configuración del Token</Text>
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <Text>Duración (minutos):</Text>
                    <InputNumber
                      min={1}
                      max={240}
                      value={ttlMin}
                      onChange={setTtlMin}
                      style={{ width: '100%', marginTop: 8 }}
                      placeholder="Minutos de validez"
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      El token expirará en {ttlMin} minutos
                    </Text>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text>Longitud del código:</Text>
                    <InputNumber
                      min={4}
                      max={20}
                      value={tokenLength}
                      onChange={setTokenLength}
                      style={{ width: '100%', marginTop: 8 }}
                      placeholder="Caracteres del código"
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Código de {tokenLength} caracteres
                    </Text>
                  </div>
                </div>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              {/* Switch para activar/desactivar ubicación */}
              <div style={{ 
                background: '#f5f5f5', 
                padding: 12, 
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <Space>
                  <EnvironmentOutlined style={{ fontSize: 16 }} />
                  <Text strong>Registrar mi ubicación</Text>
                </Space>
                <Switch 
                  checked={incluirUbicacion} 
                  onChange={setIncluirUbicacion}
                />
              </div>

              {/* Sección de Ubicación (solo si el switch está activado) */}
              {incluirUbicacion && (
                <div style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: 8,
                  padding: 12,
                  background: '#fafafa',
                  marginBottom: 16
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 12 
                  }}>
                    <Text strong>Ubicación:</Text>
                    <Button
                      type="default"
                      icon={<AimOutlined />}
                      onClick={obtenerUbicacion}
                      loading={loadingUbicacion}
                      size="small"
                    >
                      {ubicacion.latitud ? 'Actualizar' : 'Obtener ubicación'}
                    </Button>
                  </div>

                  {errorUbicacion && (
                    <Alert
                      message={errorUbicacion}
                      type="error"
                      showIcon
                      closable
                      onClose={() => setErrorUbicacion(null)}
                      style={{ marginBottom: 12 }}
                    />
                  )}

                  {loadingUbicacion ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: 16
                    }}>
                      <Spin />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          Obteniendo ubicación...
                        </Text>
                      </div>
                    </div>
                  ) : ubicacion.latitud && ubicacion.longitud ? (
                    <div
                      style={{
                        background: '#f6ffed',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid #b7eb8f'
                      }}
                    >
                      <Space direction="vertical" size={4}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          <Text strong style={{ fontSize: 13 }}>Ubicación obtenida</Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, paddingLeft: 24 }}>
                          Lat: {ubicacion.latitud.toFixed(6)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, paddingLeft: 24 }}>
                          Lng: {ubicacion.longitud.toFixed(6)}
                        </Text>
                      </Space>
                    </div>
                  ) : (
                    <Alert
                      message="Haz clic en 'Obtener ubicación' para registrar tu ubicación actual"
                      type="info"
                      showIcon
                      style={{ fontSize: 12 }}
                    />
                  )}
                </div>
              )}

              <Button
                type="primary"
                block
                icon={<UnlockOutlined />}
                onClick={handleActivar}
                loading={loadingToken}
                size="large"
              >
                Generar Token
              </Button>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}