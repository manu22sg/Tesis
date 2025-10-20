import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Select,
  Empty,
  Tooltip,
  Modal,
  Spin,
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { obtenerMisReservas, obtenerReservaPorId } from '../services/reserva.services.js';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import MainLayout from '../components/MainLayout.jsx';
dayjs.locale('es');

const estadoConfig = {
  pendiente: { color: 'gold', text: 'Pendiente' },
  aprobada: { color: 'green', text: 'Aprobada' },
  rechazada: { color: 'red', text: 'Rechazada' },
  cancelada: { color: 'default', text: 'Cancelada' },
};

export default function MisReservas() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detalleModal, setDetalleModal] = useState(false);
  const [reservaDetalle, setReservaDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const navigate = useNavigate();

  const cargarReservas = async (page = 1, estado = filtroEstado) => {
    try {
      setLoading(true);
      const filtros = {
        page,
        limit: pagination.pageSize,
      };
      if (estado) filtros.estado = estado;

      const { reservas: data, pagination: paginationData } = await obtenerMisReservas(filtros);
      
      setReservas(data);
      setPagination({
        current: paginationData.currentPage,
        pageSize: paginationData.itemsPerPage,
        total: paginationData.totalItems,
      });
    } catch (error) {
      console.error('Error cargando reservas:', error);
      message.error('Error al cargar tus reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReservas();
  }, []);

  const handleFiltroEstado = (value) => {
    setFiltroEstado(value);
    cargarReservas(1, value);
  };

  const handleTableChange = (paginationInfo) => {
    cargarReservas(paginationInfo.current, filtroEstado);
  };

  const verDetalle = async (reservaId) => {
    try {
      setLoadingDetalle(true);
      setDetalleModal(true);
      const detalle = await obtenerReservaPorId(reservaId);
      setReservaDetalle(detalle);
    } catch (error) {
      console.error('Error cargando detalle:', error);
      message.error('Error al cargar el detalle de la reserva');
      setDetalleModal(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'fechaSolicitud',
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
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#52c41a' }} />
          <span>{record.horaInicio} - {record.horaFin}</span>
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
          <span>{nombre}</span>
        </div>
      ),
    },
    {
      title: 'Participantes',
      dataIndex: 'participantes',
      key: 'participantes',
      render: (participantes) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserOutlined />
          <span>{participantes?.length || 0}</span>
        </div>
      ),
      width: 120,
      align: 'center',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => {
        const config = estadoConfig[estado] || { color: 'default', text: estado };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      width: 120,
      align: 'center',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalle">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => verDetalle(record.id)}
            />
          </Tooltip>
        </Space>
      ),
      width: 100,
      align: 'center',
    },
  ];

  return (
    <MainLayout>
    <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CalendarOutlined style={{ fontSize: 24 }} />
            <span>Mis Reservas</span>
          </div>
        }
        extra={
          <Space>
            <Select
              placeholder="Filtrar por estado"
              style={{ width: 180 }}
              allowClear
              value={filtroEstado || undefined}
              onChange={handleFiltroEstado}
              options={[
                { label: 'Pendientes', value: 'pendiente' },
                { label: 'Aprobadas', value: 'aprobada' },
                { label: 'Rechazadas', value: 'rechazada' },
                { label: 'Canceladas', value: 'cancelada' },
              ]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => cargarReservas(pagination.current, filtroEstado)}
            >
              Actualizar
            </Button>
            <Button type="primary" onClick={() => navigate('/reservas/nueva')}>
              + Nueva Reserva
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={reservas}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <Empty
                description={
                  filtroEstado
                    ? `No tienes reservas con estado "${estadoConfig[filtroEstado]?.text || filtroEstado}"`
                    : 'No tienes reservas registradas'
                }
              >
                {!filtroEstado && (
                  <Button type="primary" onClick={() => navigate('/reservas/nueva')}>
                    Crear mi primera reserva
                  </Button>
                )}
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Modal de detalle */}
      <Modal
        title="Detalle de la Reserva"
        open={detalleModal}
        onCancel={() => {
          setDetalleModal(false);
          setReservaDetalle(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetalleModal(false)}>
            Cerrar
          </Button>,
        ]}
        width={700}
      >
        {loadingDetalle ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : reservaDetalle ? (
          <div>
            {/* Información general */}
            <div style={{ marginBottom: 24 }}>
              <h3>Información General</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <strong>Fecha:</strong> {dayjs(reservaDetalle.fechaSolicitud).format('DD/MM/YYYY')}
                </div>
                <div>
                  <strong>Horario:</strong> {reservaDetalle.horaInicio} - {reservaDetalle.horaFin}
                </div>
                <div>
                  <strong>Cancha:</strong> {reservaDetalle.cancha?.nombre}
                </div>
                <div>
                  <strong>Estado:</strong>{' '}
                  <Tag color={estadoConfig[reservaDetalle.estado]?.color}>
                    {estadoConfig[reservaDetalle.estado]?.text}
                  </Tag>
                </div>
              </div>
              {reservaDetalle.motivo && (
                <div style={{ marginTop: 12 }}>
                  <strong>Motivo:</strong> {reservaDetalle.motivo}
                </div>
              )}
            </div>

            {/* Participantes */}
            <div style={{ marginBottom: 24 }}>
              <h3>Participantes ({reservaDetalle.participantes?.length || 0})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reservaDetalle.participantes?.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      background: '#f6ffed',
                      border: '1px solid #b7eb8f',
                      borderRadius: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      <UserOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                      {p.usuario?.nombre || p.nombreOpcional || 'N/A'}
                    </span>
                    <span style={{ color: '#666', fontSize: 12 }}>{p.rut}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historial */}
            {reservaDetalle.historial && reservaDetalle.historial.length > 0 && (
              <div>
                <h3>Historial</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reservaDetalle.historial.map((h, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        background: '#f5f5f5',
                        borderRadius: 6,
                        fontSize: 13,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{h.accion}</strong>
                        <span style={{ color: '#999' }}>
                          {dayjs(h.fecha).format('DD/MM/YYYY HH:mm')}
                        </span>
                      </div>
                      {h.observacion && (
                        <div style={{ marginTop: 4, color: '#666' }}>{h.observacion}</div>
                      )}
                      {h.usuario && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                          Por: {h.usuario.nombre}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
    </MainLayout>
  );
}