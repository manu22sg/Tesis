import React, { useState, useCallback, useEffect, memo } from 'react';
import { 
  Modal, Button, Alert, Divider, Popconfirm, InputNumber, Space,
  Typography, App, Switch, Spin, Tooltip
} from 'antd';
import { 
  KeyOutlined, LockOutlined, UnlockOutlined, CopyOutlined,
  EnvironmentOutlined, AimOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;


const TokenSesionModal = memo(function TokenSesionModal({
  open,
  sesion,
  ttlMin,
  setTtlMin,
  tokenLength,
  setTokenLength,
  loadingToken,
  onClose,
  onActivar,      // (params) => void  => ahora recibe { ttlMin, tokenLength, requiereUbicacion, latitudToken?, longitudToken? }
  onDesactivar
}) {
  // 🔑 ahora este switch significa "exigir ubicación a los jugadores"
  const [requiereUbicacion, setRequiereUbicacion] = useState(false);
  const [ubicacion, setUbicacion] = useState({ latitud: null, longitud: null });
  const [loadingUbicacion, setLoadingUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState(null);
  const { message } = App.useApp(); 

  // Reset limpio al abrir/cerrar
  useEffect(() => {
    if (!open) return;
    setRequiereUbicacion(false);
    setUbicacion({ latitud: null, longitud: null });
    setErrorUbicacion(null);
  }, [open]);

  const copiarToken = useCallback(() => {
    if (sesion?.token) {
      navigator.clipboard.writeText(sesion.token);
      message.success('Token copiado al portapapeles');
    }
  }, [sesion]);

  const obtenerUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      const msg = 'Su navegador no soporta geolocalización';
      setErrorUbicacion(msg);
      message.error(msg);
      return;
    }

    setLoadingUbicacion(true);
    setErrorUbicacion(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nuevaUbicacion = {
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
        };
        setUbicacion(nuevaUbicacion);
        setLoadingUbicacion(false);
        message.success('Ubicación obtenida');
      },
      (error) => {
        setLoadingUbicacion(false);
        const errorMap = {
          [error.PERMISSION_DENIED]: 'Permiso de ubicación denegado',
          [error.POSITION_UNAVAILABLE]: 'Información de ubicación no disponible',
          [error.TIMEOUT]: 'Tiempo de espera agotado',
        };
        const msg = errorMap[error.code] || 'No se pudo obtener la ubicación';
        setErrorUbicacion(msg);
        message.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleActivar = useCallback(() => {
    // Si el técnico exige ubicación, debe existir lat/lon
    if (requiereUbicacion && !(ubicacion.latitud && ubicacion.longitud)) {
      message.error('Debe obtener la ubicación para exigirla a los jugadores.');
      return;
    }

    const params = {
      ttlMin,
      tokenLength,
      requiereUbicacion,
      ...(requiereUbicacion && ubicacion.latitud && ubicacion.longitud
        ? { latitudToken: ubicacion.latitud, longitudToken: ubicacion.longitud }
        : {})
    };

    onActivar(params);
  }, [ttlMin, tokenLength, requiereUbicacion, ubicacion, onActivar]);

  const botonDeshabilitado =
    loadingToken ||
    (requiereUbicacion && !(ubicacion.latitud && ubicacion.longitud));

  if (!open) return null;

  return (
    <Modal
      title={<><KeyOutlined /> Gestionar Token de Asistencia</>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={550}
      destroyOnClose
      maskClosable
    >
      {!sesion ? null : (
        <>
          <Alert
            message="Token de Asistencia"
            description="Los jugadores usarán este token para registrar su asistencia a la sesión."
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />

          {sesion.tokenActivo ? (
            <>
              <div className="token-display">
                <div style={{ fontSize: 14, opacity: 0.9 }}>Token de Asistencia</div>
                <div className="token-code">{sesion.token}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Expira: {dayjs(sesion.tokenExpiracion).format('DD/MM/YYYY HH:mm')}
                </div>
              </div>

              <Space style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
                <Button icon={<CopyOutlined />} onClick={copiarToken} size="large">
                  Copiar Token
                </Button>
              </Space>

              <Divider />

              <Popconfirm
                title="¿Desactivar token?"
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
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Expira en {ttlMin} minutos
                    </Text>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text>Longitud del Token:</Text>
                    <InputNumber
                      min={4}
                      max={20}
                      value={tokenLength}
                      onChange={setTokenLength}
                      style={{ width: '100%', marginTop: 8 }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {tokenLength} caracteres
                    </Text>
                  </div>
                </div>
              </div>

              <Divider />

              <div
                style={{
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Space>
                  <EnvironmentOutlined style={{ fontSize: 16 }} />
                  <div>
                    <Text strong>Exigir ubicación a jugadores</Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Si activa esto, deberá fijar un punto y los jugadores deberán estar cerca al marcar.
                      </Text>
                    </div>
                  </div>
                </Space>
                <Switch
                  checked={requiereUbicacion}
                  onChange={(v) => {
                    setRequiereUbicacion(v);
                    if (!v) {
                      setUbicacion({ latitud: null, longitud: null });
                      setErrorUbicacion(null);
                    }
                  }}
                />
              </div>

              {requiereUbicacion && (
                <div
                  style={{
                    border: '1px solid #B9BBBB',
                    borderRadius: 8,
                    padding: 12,
                    background: '#f5f5f5',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Text strong>Punto de referencia (coordenadas):</Text>
                    <Button
                      icon={<AimOutlined />}
                      onClick={obtenerUbicacion}
                      loading={loadingUbicacion}
                      size="small"
                    >
                      {ubicacion.latitud ? 'Actualizar ubicación' : 'Obtener ubicación'}
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
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <Spin />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Obteniendo ubicación...</Text>
                      </div>
                    </div>
                  ) : ubicacion.latitud ? (
                    <div
                      style={{
                        background: '#f6ffed',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid' 
                      }}
                    >
                      <Space direction="vertical" size={4}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircleOutlined style={{ color: '#006B5B' }} />
                          <Text strong>Ubicación fijada</Text>
                        </div>
                        <Text type="secondary">Lat: {ubicacion.latitud.toFixed(6)}</Text>
                        <Text type="secondary">Lng: {ubicacion.longitud.toFixed(6)}</Text>
                      </Space>
                    </div>
                  ) : (
                    <Alert
                      message="Haz clic en 'Obtener ubicación' para fijar el punto de referencia"
                      type="info"
                      showIcon
                    />
                  )}
                </div>
              )}

              <Tooltip
                title={
                  requiereUbicacion && !(ubicacion.latitud && ubicacion.longitud)
                    ? 'Debe fijar la ubicación para activar el token con geofence'
                    : ''
                }
              >
                <Button
                  type="primary"
                  block
                  icon={<UnlockOutlined />}
                  onClick={handleActivar}
                  loading={loadingToken}
                  size="large"
                  disabled={botonDeshabilitado}
                >
                  Generar Token
                </Button>
              </Tooltip>
            </>
          )}
        </>
      )}
    </Modal>
  );
});

export default TokenSesionModal;
