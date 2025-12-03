import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  App,
  Select,
  Empty,
  Tooltip,
  Modal,
  Spin,
  Pagination,
  ConfigProvider,
  Popconfirm,
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  EyeOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
  obtenerMisReservas, 
  obtenerReservaPorId, 
  cancelarReserva 
} from '../services/reserva.services.js';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import MainLayout from '../components/MainLayout.jsx';
import ModalEditarParticipantes from '../components/ModalEditarParticipantes.jsx';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
dayjs.locale('es');
import ModalDetalleReserva from '../components/ModalDetalleReserva';
import { useAuth } from '../context/AuthContext'; 

const estadoConfig = {
  pendiente: { color: 'gold', text: 'Pendiente' },
  aprobada: { color: 'green', text: 'Aprobada' },
  rechazada: { color: 'red', text: 'Rechazada' },
  cancelada: { color: 'default', text: 'Cancelada' },
  expirada: { color: 'volcano', text: 'Expirada' },
  completada: { color: 'blue', text: 'Completada' },
};

export default function MisReservas() {
  const { usuario } = useAuth(); // obtener usuario actual

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const { message } = App.useApp(); 

  const [detalleModal, setDetalleModal] = useState(false);
  const [reservaDetalle, setReservaDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [loadingCancelar, setLoadingCancelar] = useState(false);
  
  const [editarModal, setEditarModal] = useState(false);
  const [reservaEditar, setReservaEditar] = useState(null);

  const navigate = useNavigate();

const faltanMenosDe24Horas = (fechaReserva, horaInicio) => {
  const fechaReservaDate = dayjs(fechaReserva);
  const [horas, minutos] = horaInicio.split(':').map(Number);
  
  const fechaHoraReserva = fechaReservaDate.hour(horas).minute(minutos).second(0).millisecond(0);
  
  const ahora = dayjs();
  
  const diferenciaHoras = fechaHoraReserva.diff(ahora, 'hour', true);
  
  return diferenciaHoras < 24;
};

// ✅ Función para calcular tiempo restante usando dayjs
const calcularTiempoRestante = (fechaReserva, horaInicio) => {
  const fechaReservaDate = dayjs(fechaReserva);
  const [horas, minutos] = horaInicio.split(':').map(Number);
  
  const fechaHoraReserva = fechaReservaDate.hour(horas).minute(minutos).second(0).millisecond(0);
  const ahora = dayjs();
  
  const diferenciaMinutos = fechaHoraReserva.diff(ahora, 'minute');
  
  const horasRestantes = Math.floor(diferenciaMinutos / 60);
  const minutosRestantes = diferenciaMinutos % 60;
  
  return { horas: horasRestantes, minutos: minutosRestantes };
};


  
  const cargarReservas = async (page = 1, pageSize = 10, estado = filtroEstado) => {
    try {
      setLoading(true);
      const filtros = { page, limit: pageSize };
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
      message.error('Error al cargar sus reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReservas();
  }, []);

  const handleFiltroEstado = (value) => {
    const estado = value ?? '';
    setFiltroEstado(estado);
    cargarReservas(1, pagination.pageSize, estado);
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
    cargarReservas(page, pageSize, filtroEstado);
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

  const handleEditarParticipantes = async (reservaId) => {
    try {
      const detalle = await obtenerReservaPorId(reservaId);
      setReservaEditar(detalle);
      setEditarModal(true);
    } catch (error) {
      console.error('Error cargando reserva:', error);
      message.error('Error al cargar la reserva');
    }
  };

  const handleEditarSuccess = () => {
    cargarReservas(pagination.current, pagination.pageSize, filtroEstado);
  };

  const handleCancelarReserva = async (reservaId) => {
    try {
      setLoadingCancelar(true);
      await cancelarReserva(reservaId);
      message.success('Reserva cancelada exitosamente');
      await cargarReservas(pagination.current, pagination.pageSize, filtroEstado);
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      message.error(error.message || 'Error al cancelar la reserva');
    } finally {
      setLoadingCancelar(false);
    }
  };

  const puedeEditar = (estado) => {
    return ['pendiente', 'aprobada'].includes(estado);
  };

  const puedeCancelar = (estado) => {
    return ['pendiente', 'aprobada'].includes(estado);
  };

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'fechaReserva',
      key: 'fecha',
      render: (fecha) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarOutlined style={{ color: '#014898' }} />
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
          <ClockCircleOutlined style={{ color: '#006B5B' }} />
          <span>
            {formatearHora(record.horaInicio)} - {formatearHora(record.horaFin)}
          </span>
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
        return (
          <span style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: '12px',
            fontWeight: 500,
            border: '1px solid #B9BBBB',
            backgroundColor: '#f5f5f5'
          }}>
            {config.text}
          </span>
        );
      },
      width: 120,
      align: 'center',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'left',
      width: 200,
      render: (_, record) => {
        const menosDe24h = faltanMenosDe24Horas(record.fechaReserva, record.horaInicio);
        const tiempoRestante = calcularTiempoRestante(record.fechaReserva, record.horaInicio);
        const mensajeTooltip = menosDe24h 
          ? `No se puede editar/cancelar (faltan ${tiempoRestante.horas}h ${tiempoRestante.minutos}m)`
          : null;

        return (
          <Space size="small">
            <Tooltip title="Ver detalle">
              <Button
                size="middle"
                icon={<EyeOutlined />}
                onClick={() => verDetalle(record.id)}
              />
            </Tooltip>
            
            {/* ✅ Botón editar con validación de 24h */}
            {puedeEditar(record.estado) && (
              <Tooltip title={mensajeTooltip || "Editar participantes"}>
                <Button
                  type="default"
                  size="middle"
                  icon={<EditOutlined />}
                  onClick={() => handleEditarParticipantes(record.id)}
                  disabled={menosDe24h}
                />
              </Tooltip>
            )}
            
            {/* ✅ Botón cancelar con validación de 24h */}
            {puedeCancelar(record.estado) && (
              <Popconfirm
                title="¿Cancelar reserva?"
                description="Esta acción no se puede deshacer"
                onConfirm={() => handleCancelarReserva(record.id)}
                okText="Sí, cancelar"
                cancelText="No"
                okButtonProps={{ danger: true }}
                disabled={menosDe24h}
              >
                <Tooltip title={mensajeTooltip || "Cancelar reserva"}>
                  <Button
                    danger
                    size="middle"
                    icon={<CloseCircleOutlined />}
                    loading={loadingCancelar}
                    disabled={menosDe24h}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
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
                <span style={{ color: '#555' }}>Estado:</span>
                <Select
                  style={{ width: 200 }}
                  allowClear
                  value={filtroEstado}
                  onChange={(v) => handleFiltroEstado(v)}
                  onClear={() => handleFiltroEstado('')}
                  options={[
                    { label: 'Todos', value: '' },
                    { label: 'Pendiente', value: 'pendiente' },
                    { label: 'Aprobada', value: 'aprobada' },
                    { label: 'Rechazada', value: 'rechazada' },
                    { label: 'Cancelada', value: 'cancelada' },
                    { label: 'Expirada', value: 'expirada' },
                    { label: 'Completada', value: 'completada' },
                  ]}
                />

                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => cargarReservas(pagination.current, pagination.pageSize, filtroEstado)}
                >
                  Actualizar
                </Button>

                <Button type="primary" onClick={() => navigate('/reservas/nueva')}>
                  Nueva Reserva
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={reservas}
              rowKey="id"
              loading={loading}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty
                    description={
                      filtroEstado
                        ? `No tiene reservas con estado "${
                            estadoConfig[filtroEstado]?.text || filtroEstado
                          }"`
                        : 'No tiene reservas registradas'
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

            {reservas.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total) => `Total: ${total} reservas`}
                  pageSizeOptions={['5', '10', '20', '50']}
                />
              </div>
            )}
          </Card>

          {/* Modal de detalle */}
         <ModalDetalleReserva
        visible={detalleModal}
        reserva={reservaDetalle}
        onClose={() => {
          setDetalleModal(false);
          setReservaDetalle(null);
        }}
        usuarioActual={usuario} // 👈 Pasar usuario actual
      />
          <ModalEditarParticipantes
            visible={editarModal}
            onCancel={() => {
              setEditarModal(false);
              setReservaEditar(null);
            }}
            reserva={reservaEditar}
            onSuccess={handleEditarSuccess}
          />
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}