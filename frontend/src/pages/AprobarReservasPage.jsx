import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Input, 
  message, 
  Tag, 
  Row, 
  Col,
  DatePicker,
  Select,
  Tooltip,
  Badge,
  Descriptions,
  Empty,
  ConfigProvider,
  Pagination
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined,
  FilterOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import locale from 'antd/locale/es_ES';

import {
  obtenerEstadisticas,
  obtenerReservasPendientes, // si luego usas un endpoint general, cámbialo aquí
  aprobarReserva as aprobarReservaService,
  rechazarReserva as rechazarReservaService
} from '../services/aprobacion.services.js';
import { getDisponibilidadPorFecha } from '../services/horario.services.js';
import { buscarUsuarios } from '../services/auth.services.js';
import MainLayout from '../components/MainLayout.jsx';
import ModalDetalleReserva from '../components/ModalDetalleReserva.jsx';
import { formatearFecha, formatearRangoHoras } from '../utils/formatters.js';

dayjs.locale('es');

const { TextArea } = Input;
const { Option } = Select;

const AprobarReservasPage = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [canchasDisponibles, setCanchasDisponibles] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);

  const [estadisticas, setEstadisticas] = useState({
    pendiente: 0,
    aprobada: 0,
    rechazada: 0,
    completada: 0,
    expirada: 0,
    total: 0,
    reservasHoy: 0
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    fecha: null,
    canchaId: null,
    estado: 'todas',
    usuarioId: null
  });

  // Modales
  const [modalAprobar, setModalAprobar] = useState({ visible: false, reserva: null });
  const [modalRechazar, setModalRechazar] = useState({ visible: false, reserva: null });
  const [modalDetalle, setModalDetalle] = useState({ visible: false, reserva: null });
  
  // Formularios
  const [observacion, setObservacion] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Debounce ref para búsqueda de usuarios
  const searchTimeout = useRef(null);

  // Buscar usuarios dinámicamente (con debounce 300ms)
  const handleBuscarUsuarios = async (value) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!value || value.trim() === '') {
      setUsuarios([]);
      return;
    }

    if (value.trim().length >= 1) {
      searchTimeout.current = setTimeout(async () => {
        setBuscandoUsuarios(true);
        try {
          const data = await buscarUsuarios(value.trim(), { 
            roles: ["estudiante", "academico"], 
            estado: 'activo' 
          });
          setUsuarios(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error buscando usuarios:', error);
          setUsuarios([]);
        } finally {
          setBuscandoUsuarios(false);
        }
      }, 300);
    }
  };

  // Cargar canchas disponibles
  useEffect(() => {
    const cargarCanchas = async () => {
      try {
        const fechaHoy = dayjs().format('YYYY-MM-DD');
        const response = await getDisponibilidadPorFecha(fechaHoy, 1, 100);
        const lista = (response.data || []).map((d) => ({
          label: d.cancha.nombre,
          value: d.cancha.id,
        }));
        setCanchasDisponibles(lista);
      } catch (err) {
        console.error('Error cargando canchas:', err);
      }
    };
    cargarCanchas();
  }, []);

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    const [data, error] = await obtenerEstadisticas();
    if (error) return console.error('Error:', error);
    if (data?.success) setEstadisticas(data.data);
  };

  const cargarReservas = async (page = 1, limit = 5) => {
    setLoading(true);
    const filtrosFormateados = {};

    if (filtros.fecha) filtrosFormateados.fecha = filtros.fecha.format('YYYY-MM-DD');
    if (filtros.canchaId) filtrosFormateados.canchaId = filtros.canchaId;
    if (filtros.estado && filtros.estado !== 'todas') filtrosFormateados.estado = filtros.estado;
    if (filtros.usuarioId) filtrosFormateados.usuarioId = filtros.usuarioId;

    filtrosFormateados.page = page;
    filtrosFormateados.limit = limit;

    const [data, error] = await obtenerReservasPendientes(filtrosFormateados);
    setLoading(false);

    if (error) {
      message.error(error);
      return;
    }

    if (data?.success) {
      setReservas(data.data.reservas);
      setPagination({
        current: page, // usamos la que pedimos para evitar desfase
        pageSize: data.data.pagination.itemsPerPage,
        total: data.data.pagination.totalItems
      });
    }
  };

  // Aprobar reserva
  const handleAprobarReserva = async () => {
    if (!modalAprobar.reserva) return;
    setLoadingAction(true);
    const [data, error] = await aprobarReservaService(modalAprobar.reserva.id, observacion);
    setLoadingAction(false);

    if (error) return message.error(error);

    if (data?.success) {
      message.success('Reserva aprobada exitosamente');
      setModalAprobar({ visible: false, reserva: null });
      setObservacion('');
      cargarReservas(pagination.current, pagination.pageSize);
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
    const [data, error] = await rechazarReservaService(modalRechazar.reserva.id, motivoRechazo.trim());
    setLoadingAction(false);

    if (error) return message.error(error);

    if (data?.success) {
      message.success('Reserva rechazada exitosamente');
      setModalRechazar({ visible: false, reserva: null });
      setMotivoRechazo('');
      cargarReservas(pagination.current, pagination.pageSize);
      cargarEstadisticas();
    }
  };

  const handlePageChange = (page, pageSize) => {
    setPagination((p) => ({ ...p, current: page, pageSize }));
    cargarReservas(page, pageSize);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      fecha: null,
      canchaId: null,
      estado: 'todas',
      usuarioId: null
    });
    setUsuarios([]);
    setPagination((p) => ({ ...p, current: 1 })); 
  };
  const ucfirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');


  // Efecto: recargar al cambiar filtros
  useEffect(() => {
    cargarReservas(1, pagination.pageSize);
  }, [filtros.fecha, filtros.canchaId, filtros.estado, filtros.usuarioId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  // Columnas tabla
  const columns = [
    {
      title: 'Usuario',
      dataIndex: ['usuario', 'nombre'],
      key: 'usuario',
      render: (_, record) => (
        <div>
          <strong>{record.usuario?.nombre || 'N/A'}</strong>
          <div style={{ fontSize: 12, color: '#888' }}>{record.usuario?.rut || ''}</div>
        </div>
      ),
    },
    {
      title: 'Cancha',
      dataIndex: ['cancha', 'nombre'],
      key: 'cancha',
      render: (nombre) => nombre || 'N/A',
      width: 160,
    },
    {
      title: 'Fecha Reserva',
      dataIndex: 'fechaReserva',
      key: 'fechaReserva',
      render: (fecha) => formatearFecha(fecha) || 'N/A',
      width: 140,
    },
    {
      title: 'Horario',
      key: 'horario',
      render: (_, record) => formatearRangoHoras(record.horaInicio, record.horaFin),
      width: 120,
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
          completada: 'blue',
          expirada: 'volcano'
        };
       return <Tag color={colors[estado] || 'default'}>{ucfirst(estado || '')}</Tag>;
      },
      width: 130,
      align: 'center',
    },
    {
      title: 'Participantes',
      key: 'participantes',
      render: (_, record) => (
        <Badge count={record.participantes?.length || 0} showZero color="#1890ff" />
      ),
      width: 130,
      align: 'center',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'left',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalles">
            <Button
              size="middle"
              icon={<EyeOutlined />}
              onClick={() => setModalDetalle({ visible: true, reserva: record })}
            />
          </Tooltip>

          {record.estado === 'pendiente' && (
            <>
              <Tooltip title="Aprobar reserva">
                <Button
                  type="primary"
                  size="middle"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setModalAprobar({ visible: true, reserva: record })}
                />
              </Tooltip>

              <Tooltip title="Rechazar reserva">
                <Button
                  danger
                  size="middle"
                  icon={<CloseCircleOutlined />}
                  onClick={() => setModalRechazar({ visible: true, reserva: record })}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <Card title={<><TeamOutlined /> Gestión de Reservas</>} variant="filled">
          {/* Filtros */}
          <Card
            title={<span><FilterOutlined /> Filtros</span>}
            style={{ marginBottom: '1rem', backgroundColor: '#fafafa' }}
            extra={<Button onClick={limpiarFiltros}>Limpiar Filtros</Button>}
          >
            <Row gutter={12} align="middle">
              <Col xs={24} sm={6}>
                <Select
  showSearch
  allowClear
  placeholder=" Buscar por nombre o RUT"
  filterOption={false}
  onSearch={handleBuscarUsuarios}
  loading={buscandoUsuarios}
  value={filtros.usuarioId || null}
  onChange={(value) => {
    setFiltros({ ...filtros, usuarioId: value });
    setPagination((p) => ({ ...p, current: 1 }));
  }}
  notFoundContent={buscandoUsuarios ? 'Buscando...' : (usuarios.length === 0 ? null : 'Sin resultados')}
  style={{ width: '100%' }}
  size="medium"
  suffixIcon={null}  // <-- Agregar esta línea
>
                  {usuarios.map((user) => (
                    <Option key={user.id} value={user.id}>
          {user.nombre} <span>- {user.rut}</span></Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={6}>
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Seleccionar fecha de reserva"
                  value={filtros.fecha}
                  onChange={(date) => {
                    setFiltros({ ...filtros, fecha: date });
                    setPagination((p) => ({ ...p, current: 1 }));
                  }}
                  size="medium"
                />
              </Col>

              <Col xs={24} sm={6}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Seleccionar cancha"
                  allowClear
                  value={filtros.canchaId}
                  onChange={(value) => {
                    setFiltros({ ...filtros, canchaId: value });
                    setPagination((p) => ({ ...p, current: 1 }));
                  }}
                  loading={canchasDisponibles.length === 0}
                  size="medium"
                >
                  {canchasDisponibles.map((cancha) => (
                    <Option key={cancha.value} value={cancha.value}>
                      {cancha.label}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={6}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Seleccionar estado"
                  value={filtros.estado}
                  onChange={(value) => {
                    setFiltros({ ...filtros, estado: value });
                    setPagination((p) => ({ ...p, current: 1 }));
                  }}
                  size="medium"
                >
                  <Option value="todas">Todos los estados</Option>
                  <Option value="pendiente">Pendiente</Option>
                  <Option value="aprobada">Aprobada</Option>
                  <Option value="rechazada">Rechazada</Option>
                  <Option value="completada">Completada</Option>
                  <Option value="expirada">Expirada</Option>
                </Select>
              </Col>
            </Row>
          </Card>

          {/* Tabla */}
          <Card>
            <Table
              columns={columns}
              dataSource={reservas}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 900 }}
              locale={{ emptyText: <Empty description="No hay reservas encontradas" /> }}
              style={{ whiteSpace: 'normal' }}
              size="middle"
            />

            {reservas.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger
                  onShowSizeChange={handlePageChange}
                  showTotal={(total) => `Total: ${total} reservas`}
                  pageSizeOptions={['5', '10', '20', '50']}
                />
              </div>
            )}
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
                  <Descriptions.Item label="Usuario">
                    {modalAprobar.reserva.usuario?.nombre}
                  </Descriptions.Item>
                  <Descriptions.Item label="Cancha">
                    {modalAprobar.reserva.cancha?.nombre}
                  </Descriptions.Item>
                  <Descriptions.Item label="Fecha">
                    {formatearFecha(modalAprobar.reserva.fechaReserva)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Horario">
                    {formatearRangoHoras(modalAprobar.reserva.horaInicio, modalAprobar.reserva.horaFin)}
                  </Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 8 }}>Observación (opcional):</div>
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
                  <Descriptions.Item label="Usuario">
                    {modalRechazar.reserva.usuario?.nombre}
                  </Descriptions.Item>
                  <Descriptions.Item label="Cancha">
                    {modalRechazar.reserva.cancha?.nombre}
                  </Descriptions.Item>
                  <Descriptions.Item label="Fecha">
                    {formatearFecha(modalRechazar.reserva.fechaReserva)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Horario">
                    {formatearRangoHoras(modalRechazar.reserva.horaInicio, modalRechazar.reserva.horaFin)}
                  </Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 8 }}>
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
                    <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                      El motivo debe tener al menos 10 caracteres
                    </div>
                  )}
                </div>
              </>
            )}
          </Modal>

          {/* Modal Ver Detalle */}
          <ModalDetalleReserva
            visible={modalDetalle.visible}
            reserva={modalDetalle.reserva}
            onClose={() => setModalDetalle({ visible: false, reserva: null })}
          />
        </Card>
      </ConfigProvider>
    </MainLayout>
  );
};

export default AprobarReservasPage;
