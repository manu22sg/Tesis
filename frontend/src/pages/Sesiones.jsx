import { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Space, message, Empty, Tooltip,
  Modal, Spin, Popconfirm, Input, DatePicker, Pagination, ConfigProvider, 
  TimePicker, InputNumber, Typography, Divider, Alert
} from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, TeamOutlined,
  EyeOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, 
  SearchOutlined, KeyOutlined, LockOutlined, UnlockOutlined, CopyOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
  obtenerSesiones, 
  obtenerSesionPorId, 
  eliminarSesion,
  activarTokenSesion,
  desactivarTokenSesion 
} from '../services/sesion.services.js';
import dayjs from 'dayjs';
import locale from 'antd/locale/es_ES';
import 'dayjs/locale/es';

const { Text, Paragraph } = Typography;
dayjs.locale('es');

const colorForTipo = (tipo) => {
  const t = (tipo || '').toLowerCase();
  const map = { tecnica: 'blue', táctica: 'green', tactica: 'green', fisica: 'orange', mixta: 'purple' };
  return map[t] || 'default';
};

function useDebounced(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function Sesiones() {
  const navigate = useNavigate();

  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0, totalPages: 0 });

  const [detalleModal, setDetalleModal] = useState(false);
  const [sesionDetalle, setSesionDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // 🔐 Estados para el modal de token
  const [tokenModal, setTokenModal] = useState(false);
  const [sesionToken, setSesionToken] = useState(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [ttlMin, setTtlMin] = useState(30);
  const [tokenLength, setTokenLength] = useState(6);

  // 🔍 filtros
  const [query, setQuery] = useState('');
  const debouncedQ = useDebounced(query, 400);
  const [filtroFecha, setFiltroFecha] = useState(null);
  const [filtroHorario, setFiltroHorario] = useState(null);

  const cargarSesiones = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);

      const filtros = {
        q: debouncedQ,
        page,
        limit: pageSize,
      };
      
      if (filtroFecha) {
        filtros.fecha = filtroFecha.format('YYYY-MM-DD');
      }

      if (filtroHorario && filtroHorario[0] && filtroHorario[1]) {
        filtros.horaInicio = filtroHorario[0].format('HH:mm');
        filtros.horaFin = filtroHorario[1].format('HH:mm');
      }

      const { sesiones: data, pagination: p } = await obtenerSesiones(filtros);

      setSesiones(data);
      setPagination({
        current: p.currentPage,
        pageSize: p.itemsPerPage,
        total: p.totalItems,
        totalPages: p.totalPages,
      });
    } catch (error) {
      console.error('Error cargando sesiones:', error);
      message.error('Error al cargar las sesiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSesiones(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, filtroFecha, filtroHorario]);

  const verDetalle = async (sesionId) => {
    try {
      setLoadingDetalle(true);
      setDetalleModal(true);
      const detalle = await obtenerSesionPorId(sesionId);
      setSesionDetalle(detalle);
    } catch (error) {
      console.error('Error cargando detalle:', error);
      message.error('Error al cargar el detalle de la sesión');
      setDetalleModal(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleEliminar = async (sesionId) => {
    try {
      await eliminarSesion(sesionId);
      message.success('Sesión eliminada correctamente');
      cargarSesiones(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error eliminando sesión:', error);
      message.error(error.response?.data?.message || 'Error al eliminar la sesión');
    }
  };

  // 🔐 Gestión de tokens
  const abrirModalToken = async (sesion) => {
    setSesionToken(sesion);
    setTtlMin(30);
    setTokenLength(6);
    setTokenModal(true);
  };

  const handleActivarToken = async () => {
    try {
      setLoadingToken(true);
      const sesionActualizada = await activarTokenSesion(sesionToken.id, { ttlMin, tokenLength });
      
      message.success('Token generado correctamente');
      
      setSesiones(prevSesiones => 
        prevSesiones.map(s => s.id === sesionToken.id ? sesionActualizada : s)
      );
      
      setSesionToken(sesionActualizada);
    } catch (error) {
      console.error('Error activando token:', error);
      message.error(error.response?.data?.message || 'Error al generar el token');
    } finally {
      setLoadingToken(false);
    }
  };

  const handleDesactivarToken = async () => {
    try {
      setLoadingToken(true);
      const sesionActualizada = await desactivarTokenSesion(sesionToken.id);
      
      message.success('Token desactivado correctamente');
      
      setSesiones(prevSesiones => 
        prevSesiones.map(s => s.id === sesionToken.id ? sesionActualizada : s)
      );
      
      setTokenModal(false);
      setSesionToken(null);
    } catch (error) {
      console.error('Error desactivando token:', error);
      message.error(error.response?.data?.message || 'Error al desactivar el token');
    } finally {
      setLoadingToken(false);
    }
  };

  const copiarToken = () => {
    if (sesionToken?.token) {
      navigator.clipboard.writeText(sesionToken.token);
      message.success('Token copiado al portapapeles');
    }
  };

  const limpiarFiltros = () => {
    setQuery('');
    setFiltroFecha(null);
    setFiltroHorario(null);
  };

  const handlePageChange = (page, pageSize) => {
    cargarSesiones(page, pageSize);
  };

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <span>{dayjs(fecha).format('DD/MM/YYYY')}</span>
        </div>
      ),
      width: 130,
    },
    {
      title: 'Horario',
      key: 'horario',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#52c41a' }} />
          <span>{r.horaInicio} - {r.horaFin}</span>
        </div>
      ),
      width: 150,
    },
    {
      title: 'Cancha',
      dataIndex: ['cancha', 'nombre'],
      key: 'cancha',
      render: (nombre) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <EnvironmentOutlined style={{ color: '#faad14' }} />
          <span>{nombre || 'Sin cancha'}</span>
        </div>
      ),
    },
    {
      title: 'Grupo',
      dataIndex: ['grupo', 'nombre'],
      key: 'grupo',
      render: (nombre) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TeamOutlined />
          <span>{nombre || 'Sin grupo'}</span>
        </div>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoSesion',
      key: 'tipoSesion',
      render: (tipo) => <Tag color={colorForTipo(tipo)}>{tipo || '—'}</Tag>,
      width: 120,
      align: 'center',
    },
    {
      title: 'Token',
      key: 'token',
      render: (_, record) => (
        record.tokenActivo ? (
          <Tag color="green" icon={<UnlockOutlined />}>Activo</Tag>
        ) : (
          <Tag color="default" icon={<LockOutlined />}>Inactivo</Tag>
        )
      ),
      width: 100,
      align: 'center',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver asistencias">
            <Button 
              type="link" 
              icon={<UserOutlined />} 
              onClick={() => navigate(`/sesiones/${record.id}/asistencias`)}
            />
          </Tooltip>
          <Tooltip title="Gestionar token">
            <Button 
              type="link" 
              icon={<KeyOutlined />} 
              onClick={() => abrirModalToken(record)}
              style={{ color: record.tokenActivo ? '#52c41a' : '#8c8c8c' }}
            />
          </Tooltip>
          <Tooltip title="Ver detalle">
            <Button type="link" icon={<EyeOutlined />} onClick={() => verDetalle(record.id)} />
          </Tooltip>
          <Tooltip title="Editar">
            <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/sesiones/editar/${record.id}`)} />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar esta sesión?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleEliminar(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      width: 220,
      align: 'center',
    },
  ];

  // Estilos
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-weekends .ant-picker-cell:nth-child(7n+6),
      .hide-weekends .ant-picker-cell:nth-child(7n+7) {
        display: none !important;
      }
      .hide-weekends thead tr th:nth-child(6),
      .hide-weekends thead tr th:nth-child(7) {
        display: none !important;
      }
      .timepicker-sesiones .ant-picker-time-panel-column {
        overflow-y: scroll !important;
        max-height: 200px !important;
        scrollbar-width: none;
      }
      .timepicker-sesiones .ant-picker-time-panel-column::-webkit-scrollbar {
        display: none;
      }
      .token-display {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        margin: 20px 0;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      }
      .token-code {
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 8px;
        margin: 10px 0;
        font-family: 'Courier New', monospace;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <ConfigProvider locale={locale}>
      <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CalendarOutlined style={{ fontSize: 24 }} />
              <span>Sesiones de Entrenamiento</span>
            </div>
          }
          extra={
            <Space wrap>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/sesiones/nueva')}
              >
                Nueva Sesión
              </Button>
            </Space>
          }
        >
          {/* Barra de filtros */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Input
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Filtrar por búsqueda"
              style={{ width: 280 }}
            />
            <DatePicker
              placeholder="Filtrar por fecha"
              format="DD/MM/YYYY"
              value={filtroFecha}
              onChange={setFiltroFecha}
              style={{ width: 180 }}
              disabledDate={(current) => {
                const day = current.day();
                return day === 0 || day === 6;
              }}
              classNames={{ popup: 'hide-weekends' }}
            />
            <TimePicker.RangePicker
              placeholder={['Hora inicio', 'Hora fin']}
              format="HH:mm"
              value={filtroHorario}
              onChange={setFiltroHorario}
              style={{ width: 240 }}
              minuteStep={30}
              disabledTime={() => ({
                disabledHours: () => [0,1,2,3,4,5,6,7,15,16,17,18,19,20,21,22,23],
                disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i).filter(m => m !== 0 && m !== 30),
              })}
              hideDisabledOptions
              showNow={false}
              classNames={{ popup: 'timepicker-sesiones' }}
            />
            {(filtroFecha || query || filtroHorario) && (
              <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => cargarSesiones(pagination.current, pagination.pageSize)}
            >
              Actualizar
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={sesiones}
            rowKey="id"
            loading={loading}
            pagination={false}
            locale={{
              emptyText: (
                <Empty
                  description={
                    query || filtroFecha || filtroHorario
                      ? 'No se encontraron sesiones con los filtros aplicados'
                      : 'No hay sesiones registradas'
                  }
                >
                  {!query && !filtroFecha && !filtroHorario && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => navigate('/sesiones/nueva')}
                    >
                      Crear primera sesión
                    </Button>
                  )}
                </Empty>
              ),
            }}
          />

          {sesiones.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
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
        </Card>

        {/* Modal Detalle */}
        <Modal
          title="Detalle de la Sesión"
          open={detalleModal}
          onCancel={() => { setDetalleModal(false); setSesionDetalle(null); }}
          footer={[<Button key="close" onClick={() => setDetalleModal(false)}>Cerrar</Button>]}
          width={600}
        >
          {loadingDetalle ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
          ) : sesionDetalle ? (
            <div>
              <h3>Información General</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><strong>Fecha:</strong> {dayjs(sesionDetalle.fecha).format('DD/MM/YYYY')}</div>
                <div><strong>Horario:</strong> {sesionDetalle.horaInicio} - {sesionDetalle.horaFin}</div>
                <div><strong>Cancha:</strong> {sesionDetalle.cancha?.nombre || 'Sin cancha'}</div>
                <div><strong>Grupo:</strong> {sesionDetalle.grupo?.nombre || 'Sin grupo'}</div>
                <div><strong>Tipo:</strong> <Tag color={colorForTipo(sesionDetalle.tipoSesion)}>{sesionDetalle.tipoSesion}</Tag></div>
              </div>
              {sesionDetalle.objetivos && (
                <div style={{ marginTop: 12 }}>
                  <strong>Objetivos:</strong>
                  <p style={{ marginTop: 4, color: '#666' }}>{sesionDetalle.objetivos}</p>
                </div>
              )}
            </div>
          ) : null}
        </Modal>

        {/* 🔐 Modal de Token */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <KeyOutlined />
              <span>Gestionar Token de Asistencia</span>
            </div>
          }
          open={tokenModal}
          onCancel={() => { setTokenModal(false); setSesionToken(null); }}
          footer={null}
          width={550}
        >
          {sesionToken && (
            <div>
              <Alert
                message="Token de Asistencia"
                description="Los jugadores usarán este código para registrar su asistencia a la sesión"
                type="info"
                showIcon
                style={{ marginBottom: 20 }}
              />

              {sesionToken.tokenActivo ? (
                <>
                  <div className="token-display">
                    <div style={{ fontSize: 14, opacity: 0.9 }}>Código de Asistencia</div>
                    <div className="token-code">{sesionToken.token}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      Expira: {dayjs(sesionToken.tokenExpiracion).format('DD/MM/YYYY HH:mm')}
                    </div>
                  </div>

                  <Space style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
                    <Button 
                      icon={<CopyOutlined />} 
                      onClick={copiarToken}
                      size="large"
                    >
                      Copiar Código
                    </Button>
                  </Space>

                  <Divider />

                  <Popconfirm
                    title="¿Desactivar token?"
                    description="Los jugadores ya no podrán registrar asistencia con este código"
                    onConfirm={handleDesactivarToken}
                    okText="Sí, desactivar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                  >
                    <Button 
                      danger 
                      block 
                      icon={<LockOutlined />}
                      loading={loadingToken}
                    >
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

                      <div>
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

                  <Button
                    type="primary"
                    block
                    icon={<UnlockOutlined />}
                    onClick={handleActivarToken}
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
      </div>
    </ConfigProvider>
  );
}