import { useEffect, useState, useMemo } from 'react';
import {
  Card, Table, Input, Button, Space, Tag, message, Modal, Typography, Spin,
  Pagination, Switch, Alert, ConfigProvider, Tooltip
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  CheckSquareOutlined, CalendarOutlined, FieldTimeOutlined, KeyOutlined,
  CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined,
  EnvironmentOutlined, AimOutlined
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout.jsx';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';
import { obtenerSesionesEstudiante } from '../services/sesion.services.js';
import { marcarAsistenciaPorToken } from '../services/asistencia.services.js';

const { Title, Text } = Typography;

// 🔧 Helpers robustos para coord
const toNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const hasCoords = (lat, lon) => toNum(lat) !== null && toNum(lon) !== null;

export default function MarcarAsistencia() {
  const { usuario } = useAuth();
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 });

  const [modalVisible, setModalVisible] = useState(false);
  const [token, setToken] = useState('');
  const [selectedSesion, setSelectedSesion] = useState(null);
  const [marcando, setMarcando] = useState(false);

  // Ubicación (opcional o requerida según sesión)
  const [usarUbicacion, setUsarUbicacion] = useState(false);
  const [ubicacion, setUbicacion] = useState({ latitud: null, longitud: null });
  const [loadingUbicacion, setLoadingUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState(null);

  // 📍 Detectar si esta sesión exige ubicación
  const requiereGeoSesion = useMemo(() => {
    if (!selectedSesion) return false;

    // 1️⃣ Flag explícito del backend
    if (selectedSesion.requiereUbicacion === true) return true;
    if (selectedSesion.requiereUbicacion === false) return false;

    // 2️⃣ Fallback: token activo + coords válidas → requiere ubicación
    const lat = toNum(selectedSesion?.latitudToken);
    const lon = toNum(selectedSesion?.longitudToken);
    return Boolean(selectedSesion?.tokenActivo) && lat !== null && lon !== null;
  }, [selectedSesion]);

  // Cargar sesiones
  const cargarSesiones = async (page = 1, limit = 5) => {
    try {
      setLoading(true);
      const { sesiones, pagination } = await obtenerSesionesEstudiante({ page, limit });
      setSesiones(sesiones);
      setPagination({
        current: pagination.currentPage,
        pageSize: pagination.itemsPerPage,
        total: pagination.totalItems,
      });
    } catch (error) {
      console.error('Error cargando sesiones:', error);
      message.error('No se pudieron cargar tus sesiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarSesiones(); }, []);

  // Abrir modal
  const abrirModal = (sesion) => {
    console.debug('Sesión seleccionada:', {
      tokenActivo: sesion?.tokenActivo,
      requiereUbicacion: sesion?.requiereUbicacion,
      latitudToken: sesion?.latitudToken,
      longitudToken: sesion?.longitudToken,
    });

    setSelectedSesion(sesion);
    setModalVisible(true);
    setToken('');
    setUbicacion({ latitud: null, longitud: null });
    setErrorUbicacion(null);
  };

  // 🔄 Sincroniza el switch según lo que exige la sesión
  useEffect(() => {
    if (!modalVisible) return;
    setUsarUbicacion(requiereGeoSesion);
  }, [modalVisible, requiereGeoSesion]);

  // Obtener ubicación del usuario
  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setErrorUbicacion('Tu navegador no soporta geolocalización');
      message.error('Tu navegador no soporta geolocalización');
      return;
    }

    setLoadingUbicacion(true);
    setErrorUbicacion(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacion({ latitud: pos.coords.latitude, longitud: pos.coords.longitude });
        setLoadingUbicacion(false);
        message.success('Ubicación obtenida');
      },
      (err) => {
        console.warn('Error obteniendo ubicación:', err);
        setErrorUbicacion('No se pudo obtener la ubicación');
        setLoadingUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Confirmar asistencia
  const handleMarcarAsistencia = async () => {
    if (!token) {
      message.error('Debes ingresar el token de asistencia');
      return;
    }

    try {
      setMarcando(true);

      const base = {
        token: token.trim().toUpperCase(),
        estado: 'presente',
        origen: 'jugador',
      };

      if (requiereGeoSesion) {
        // ⚠️ Si es obligatorio, debe tener coordenadas
        if (!hasCoords(ubicacion.latitud, ubicacion.longitud)) {
          message.error('Esta sesión exige ubicación para marcar asistencia.');
          setMarcando(false);
          return;
        }

        await marcarAsistenciaPorToken({
          ...base,
          latitud: toNum(ubicacion.latitud),
          longitud: toNum(ubicacion.longitud),
        });
      } else {
        // 🌐 Si es opcional
        const incluir = usarUbicacion && hasCoords(ubicacion.latitud, ubicacion.longitud);
        const payload = incluir
          ? { ...base, latitud: toNum(ubicacion.latitud), longitud: toNum(ubicacion.longitud) }
          : base;

        await marcarAsistenciaPorToken(payload);
      }

      message.success('¡Asistencia registrada correctamente!');
      setModalVisible(false);
      setToken('');
      setUbicacion({ latitud: null, longitud: null });
      await cargarSesiones(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error marcando asistencia:', error);
      const msg = error.response?.data?.message || 'Error al registrar asistencia';
      message.error(msg);
    } finally {
      setMarcando(false);
    }
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
    cargarSesiones(page, pageSize);
  };

  // Tabla
  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      render: (fecha) => (
        <Space><CalendarOutlined /> {formatearFecha(fecha)}</Space>
      ),
    },
    {
      title: 'Horario',
      render: (_, r) => (
        <Space><FieldTimeOutlined /> {formatearHora(r.horaInicio)} - {formatearHora(r.horaFin)}</Space>
      ),
    },
    { title: 'Cancha', dataIndex: 'cancha' },
    {
      title: 'Tipo de Sesión',
      dataIndex: 'tipoSesion',
      render: (t) => <Tag color="blue">{t || 'Entrenamiento'}</Tag>,
    },
    {
      title: 'Estado',
      render: (_, r) => {
        if (!r.asistenciaMarcada) return <Tag>Sin registrar</Tag>;
        const map = {
          presente: { color: 'success', icon: <CheckCircleOutlined />, text: 'Presente' },
          ausente: { color: 'error', icon: <CloseCircleOutlined />, text: 'Ausente' },
          justificado: { color: 'warning', icon: <QuestionCircleOutlined />, text: 'Justificado' },
        };
        const cfg = map[r.estadoAsistencia] || map.presente;
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>;
      },
    },
    {
      title: 'Acción',
      align: 'center',
      width: 160,
      render: (_, r) =>
        r.asistenciaMarcada ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Asistencia Registrada</Tag>
        ) : (
          <Tooltip title="Marcar asistencia">
            <Button
              type="primary"
              size="middle"
              icon={<CheckSquareOutlined />}
              onClick={() => abrirModal(r)}
              disabled={!r.tokenActivo}
            />
          </Tooltip>
        ),
    },
  ];

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <Card title={<Title level={3}>Marcar Asistencia</Title>} style={{ borderRadius: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={sesiones.map((s) => ({ ...s, key: s.id }))}
                pagination={false}
                style={{ marginTop: 20 }}
              />

              {sesiones.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    showSizeChanger
                    showTotal={(total) => `Total: ${total} sesiones`}
                    pageSizeOptions={['5', '10', '20', '50']}
                  />
                </div>
              )}
            </>
          )}

          {/* Modal */}
          <Modal
            title={<span><KeyOutlined /> Ingresar Token de Asistencia</span>}
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            onOk={handleMarcarAsistencia}
            okText="Confirmar Asistencia"
            confirmLoading={marcando}
            okButtonProps={{
              disabled: !token || (requiereGeoSesion && !hasCoords(ubicacion.latitud, ubicacion.longitud))
            }}
          >
            <p>
              <strong>Sesión:</strong> {selectedSesion?.tipoSesion} — {selectedSesion?.cancha?.nombre || selectedSesion?.cancha}
            </p>

            <Input
              prefix={<KeyOutlined />}
              placeholder="Ej: ABC123"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              onPressEnter={handleMarcarAsistencia}
              maxLength={20}
            />

            {requiereGeoSesion && (
              <Alert
                message="Esta sesión exige ubicación para marcar asistencia."
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            <div style={{ marginTop: 20, marginBottom: 10 }}>
              <Space>
                <EnvironmentOutlined />
                <Text strong>
                  {requiereGeoSesion ? 'Registrar ubicación (obligatorio)' : 'Registrar ubicación (opcional)'}
                </Text>
                {!requiereGeoSesion && (
                  <Switch
                    checked={usarUbicacion}
                    onChange={(v) => {
                      setUsarUbicacion(v);
                      if (!v) setUbicacion({ latitud: null, longitud: null });
                    }}
                  />
                )}
              </Space>
            </div>

            {(requiereGeoSesion || usarUbicacion) && (
              <div style={{ border: '1px solid #d9d9d9', padding: 12, borderRadius: 8, background: '#fafafa' }}>
                <Button
                  type="default"
                  icon={<AimOutlined />}
                  onClick={obtenerUbicacion}
                  loading={loadingUbicacion}
                  size="small"
                >
                  {ubicacion.latitud ? 'Actualizar ubicación' : 'Obtener ubicación'}
                </Button>

                {errorUbicacion && (
                  <Alert message={errorUbicacion} type="error" showIcon style={{ marginTop: 12 }} />
                )}

                {hasCoords(ubicacion.latitud, ubicacion.longitud) && (
                  <div style={{ marginTop: 10 }}>
                    <Text type="secondary" style={{ display: 'block' }}>
                      Lat: {toNum(ubicacion.latitud).toFixed(6)}
                    </Text>
                    <Text type="secondary" style={{ display: 'block' }}>
                      Lng: {toNum(ubicacion.longitud).toFixed(6)}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </Modal>
        </Card>
      </ConfigProvider>
    </MainLayout>
  );
}
