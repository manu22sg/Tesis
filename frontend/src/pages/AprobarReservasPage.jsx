import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Input, 
  message, 
  Tag, 
  Statistic, 
  Row, 
  Col,
  DatePicker,
  Select,
  Tooltip,
  Badge,
  Descriptions,
  Empty
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  obtenerEstadisticas,
  obtenerReservasPendientes,
  aprobarReserva as aprobarReservaService,
  rechazarReserva as rechazarReservaService
} from '../services/aprobacion.services.js';

const { TextArea } = Input;
const { Option } = Select;

const AprobarReservasPage = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    pendiente: 0,
    aprobada: 0,
    rechazada: 0,
    cancelada: 0,
    completada: 0,
    total: 0,
    reservasHoy: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    fecha: null,
    canchaId: null,
    page: 1,
    limit: 10
  });

  // Modales
  const [modalAprobar, setModalAprobar] = useState({ visible: false, reserva: null });
  const [modalRechazar, setModalRechazar] = useState({ visible: false, reserva: null });
  const [modalDetalle, setModalDetalle] = useState({ visible: false, reserva: null });
  
  // Formularios
  const [observacion, setObservacion] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    const [data, error] = await obtenerEstadisticas();
    if (error) {
      console.error('Error:', error);
      return;
    }
    if (data?.success) {
      setEstadisticas(data.data);
    }
  };

  // Cargar reservas pendientes
  const cargarReservasPendientes = async () => {
    setLoading(true);
    const filtrosFormateados = {
      ...filtros,
      fecha: filtros.fecha ? filtros.fecha.format('YYYY-MM-DD') : undefined
    };

    const [data, error] = await obtenerReservasPendientes(filtrosFormateados);
    
    setLoading(false);

    if (error) {
      message.error(error);
      return;
    }

    if (data?.success) {
      setReservas(data.data.reservas);
      setPagination(data.data.pagination);
    }
  };

  // Aprobar reserva
  const handleAprobarReserva = async () => {
    if (!modalAprobar.reserva) return;

    setLoadingAction(true);
    
    const [data, error] = await aprobarReservaService(
      modalAprobar.reserva.id, 
      observacion
    );
    
    setLoadingAction(false);

    if (error) {
      message.error(error);
      return;
    }

    if (data?.success) {
      message.success('Reserva aprobada exitosamente');
      setModalAprobar({ visible: false, reserva: null });
      setObservacion('');
      cargarReservasPendientes();
      cargarEstadisticas();
    }
  };

  // Rechazar reserva
  const handleRechazarReserva = async () => {
    if (!modalRechazar.reserva) return;

    if (!motivoRechazo || motivoRechazo.trim().length < 10) {
      message.warning('El motivo de rechazo debe tener al menos 10 caracteres');
      return;
    }

    setLoadingAction(true);

    const [data, error] = await rechazarReservaService(
      modalRechazar.reserva.id,
      motivoRechazo.trim()
    );

    setLoadingAction(false);

    if (error) {
      message.error(error);
      return;
    }

    if (data?.success) {
      message.success('Reserva rechazada exitosamente');
      setModalRechazar({ visible: false, reserva: null });
      setMotivoRechazo('');
      cargarReservasPendientes();
      cargarEstadisticas();
    }
  };

  // Manejar cambio de paginación
  const handleTableChange = (paginationInfo) => {
    setFiltros({
      ...filtros,
      page: paginationInfo.current,
      limit: paginationInfo.pageSize
    });
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setFiltros({ ...filtros, page: 1 });
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      fecha: null,
      canchaId: null,
      page: 1,
      limit: 10
    });
  };

  useEffect(() => {
    cargarReservasPendientes();
  }, [filtros.page, filtros.limit]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  // Columnas de la tabla
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      fixed: 'left',
    },
    {
      title: 'Usuario',
      dataIndex: ['usuario', 'nombre'],
      key: 'usuario',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.usuario?.nombre || 'N/A'}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.usuario?.email || ''}
          </div>
        </div>
      ),
    },
    {
      title: 'Cancha',
      dataIndex: ['cancha', 'nombre'],
      key: 'cancha',
      render: (nombre) => nombre || 'N/A',
    },
    {
      title: 'Fecha Solicitud',
      dataIndex: 'fechaSolicitud',
      key: 'fechaSolicitud',
      render: (fecha) => fecha ? dayjs(fecha).format('DD/MM/YYYY') : 'N/A',
    },
    {
      title: 'Horario',
      key: 'horario',
      render: (_, record) => `${record.horaInicio || ''} - ${record.horaFin || ''}`,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => {
        const colors = {
          pendiente: 'gold',
          aprobada: 'green',
          rechazada: 'red',
          cancelada: 'default',
          completada: 'blue'
        };
        return <Tag color={colors[estado] || 'default'}>{(estado || '').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Participantes',
      key: 'participantes',
      render: (_, record) => (
        <Badge count={record.participantes?.length || 0} showZero color="#1890ff" />
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      fixed: 'right',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalles">
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => setModalDetalle({ visible: true, reserva: record })}
            />
          </Tooltip>
          <Button 
            type="primary" 
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => setModalAprobar({ visible: true, reserva: record })}
          >
            Aprobar
          </Button>
          <Button 
            danger 
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => setModalRechazar({ visible: true, reserva: record })}
          >
            Rechazar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>
        Gestión de Aprobación de Reservas
      </h1>

      {/* Estadísticas */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pendientes"
              value={estadisticas.pendiente}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Aprobadas"
              value={estadisticas.aprobada}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rechazadas"
              value={estadisticas.rechazada}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Reservas Hoy"
              value={estadisticas.reservasHoy}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card 
        title={<span><FilterOutlined /> Filtros</span>}
        style={{ marginBottom: '24px' }}
        extra={
          <Space>
            <Button onClick={limpiarFiltros}>Limpiar</Button>
            <Button type="primary" onClick={aplicarFiltros}>Aplicar</Button>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: '8px' }}>Fecha:</div>
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="Seleccionar fecha"
              value={filtros.fecha}
              onChange={(date) => setFiltros({ ...filtros, fecha: date })}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: '8px' }}>Cancha:</div>
            <Select
              style={{ width: '100%' }}
              placeholder="Seleccionar cancha"
              allowClear
              value={filtros.canchaId}
              onChange={(value) => setFiltros({ ...filtros, canchaId: value })}
            >
              <Option value={1}>Cancha 1</Option>
              <Option value={2}>Cancha 2</Option>
              <Option value={3}>Cancha 3</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: '8px' }}>Resultados por página:</div>
            <Select
              style={{ width: '100%' }}
              value={filtros.limit}
              onChange={(value) => setFiltros({ ...filtros, limit: value, page: 1 })}
            >
              <Option value={10}>10</Option>
              <Option value={20}>20</Option>
              <Option value={30}>30</Option>
              <Option value={50}>50</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tabla de Reservas */}
      <Card 
        title={
          <span>
            <TeamOutlined /> Reservas Pendientes ({pagination.totalItems})
          </span>
        }
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={cargarReservasPendientes}
            loading={loading}
          >
            Actualizar
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={reservas}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.itemsPerPage,
            total: pagination.totalItems,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} reservas`,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: <Empty description="No hay reservas pendientes" />
          }}
        />
      </Card>

      {/* Modal Aprobar Reserva */}
      <Modal
        title={<span><CheckCircleOutlined style={{ color: '#52c41a' }} /> Aprobar Reserva</span>}
        open={modalAprobar.visible}
        onOk={handleAprobarReserva}
        onCancel={() => {
          setModalAprobar({ visible: false, reserva: null });
          setObservacion('');
        }}
        confirmLoading={loadingAction}
        okText="Aprobar"
        cancelText="Cancelar"
        okButtonProps={{ icon: <CheckCircleOutlined /> }}
      >
        {modalAprobar.reserva && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="ID">{modalAprobar.reserva.id}</Descriptions.Item>
              <Descriptions.Item label="Usuario">
                {modalAprobar.reserva.usuario?.nombre}
              </Descriptions.Item>
              <Descriptions.Item label="Cancha">
                {modalAprobar.reserva.cancha?.nombre}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha">
                {dayjs(modalAprobar.reserva.fechaSolicitud).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Horario">
                {modalAprobar.reserva.horaInicio} - {modalAprobar.reserva.horaFin}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '16px' }}>
              <div style={{ marginBottom: '8px' }}>Observación (opcional):</div>
              <TextArea
                rows={3}
                placeholder="Agregar observación sobre la aprobación..."
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                maxLength={500}
                showCount
              />
            </div>
          </>
        )}
      </Modal>

      {/* Modal Rechazar Reserva */}
      <Modal
        title={<span><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Rechazar Reserva</span>}
        open={modalRechazar.visible}
        onOk={handleRechazarReserva}
        onCancel={() => {
          setModalRechazar({ visible: false, reserva: null });
          setMotivoRechazo('');
        }}
        confirmLoading={loadingAction}
        okText="Rechazar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true, icon: <CloseCircleOutlined /> }}
      >
        {modalRechazar.reserva && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="ID">{modalRechazar.reserva.id}</Descriptions.Item>
              <Descriptions.Item label="Usuario">
                {modalRechazar.reserva.usuario?.nombre}
              </Descriptions.Item>
              <Descriptions.Item label="Cancha">
                {modalRechazar.reserva.cancha?.nombre}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha">
                {dayjs(modalRechazar.reserva.fechaSolicitud).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Horario">
                {modalRechazar.reserva.horaInicio} - {modalRechazar.reserva.horaFin}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                Motivo de Rechazo <span style={{ color: 'red' }}>*</span>:
              </div>
              <TextArea
                rows={4}
                placeholder="Describir el motivo del rechazo (mínimo 10 caracteres)..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                maxLength={500}
                showCount
                status={motivoRechazo.length > 0 && motivoRechazo.length < 10 ? 'error' : ''}
              />
              {motivoRechazo.length > 0 && motivoRechazo.length < 10 && (
                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                  El motivo debe tener al menos 10 caracteres
                </div>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Modal Ver Detalle */}
      <Modal
        title={<span><EyeOutlined /> Detalle de Reserva</span>}
        open={modalDetalle.visible}
        onCancel={() => setModalDetalle({ visible: false, reserva: null })}
        footer={[
          <Button key="close" onClick={() => setModalDetalle({ visible: false, reserva: null })}>
            Cerrar
          </Button>
        ]}
        width={700}
      >
        {modalDetalle.reserva && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="ID" span={2}>{modalDetalle.reserva.id}</Descriptions.Item>
              <Descriptions.Item label="Usuario" span={2}>
                <div>
                  <UserOutlined /> {modalDetalle.reserva.usuario?.nombre}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {modalDetalle.reserva.usuario?.email}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Cancha" span={2}>
                {modalDetalle.reserva.cancha?.nombre}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha Solicitud">
                {dayjs(modalDetalle.reserva.fechaSolicitud).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Horario">
                {modalDetalle.reserva.horaInicio} - {modalDetalle.reserva.horaFin}
              </Descriptions.Item>
              <Descriptions.Item label="Estado" span={2}>
                <Tag color={
                  modalDetalle.reserva.estado === 'pendiente' ? 'gold' :
                  modalDetalle.reserva.estado === 'aprobada' ? 'green' :
                  modalDetalle.reserva.estado === 'rechazada' ? 'red' : 'default'
                }>
                  {modalDetalle.reserva.estado?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Participantes" span={2}>
                <Badge count={modalDetalle.reserva.participantes?.length || 0} showZero />
                {modalDetalle.reserva.participantes?.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    {modalDetalle.reserva.participantes.map((p, idx) => (
                      <Tag key={idx}>{p.usuario?.nombre || 'N/A'}</Tag>
                    ))}
                  </div>
                )}
              </Descriptions.Item>
            </Descriptions>

            {modalDetalle.reserva.historial?.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4>Historial:</h4>
                {modalDetalle.reserva.historial.map((h, idx) => (
                  <Card key={idx} size="small" style={{ marginBottom: '8px' }}>
                    <div><strong>Acción:</strong> {h.accion}</div>
                    <div><strong>Observación:</strong> {h.observacion}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      Por: {h.usuario?.nombre || 'Sistema'}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default AprobarReservasPage;