import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Empty,
  Typography,
  Tag,
  Spin,
  Input,
  Select,
  Row,
  Col,
  Modal,
  Alert,
  Tabs,
  Pagination,
  ConfigProvider,
  Tooltip,
  Popconfirm, Avatar
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  TeamOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SearchOutlined,
  DeleteOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerGrupoPorId } from '../services/grupo.services.js';
import DetalleSesionModal from '../components/DetalleSesionModal.jsx';
import { obtenerSesionPorId } from '../services/sesion.services.js';
import { removerJugadorDeGrupo, asignarJugadorAGrupo, obtenerJugadores } from '../services/jugador.services.js';
import { obtenerSesiones, eliminarSesion } from '../services/sesion.services.js';
import MainLayout from '../components/MainLayout.jsx';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
import JugadorDetalleModal from '../components/JugadorDetalleModal.jsx';
import { obtenerJugadorPorId } from '../services/jugador.services.js';
const { Title, Text } = Typography;
const { Option } = Select;

export default function GrupoMiembros() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [miembrosFiltrados, setMiembrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalleModal, setDetalleModal] = useState(false);
  const [sesionDetalle, setSesionDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Filtros miembros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCarrera, setFiltroCarrera] = useState('todos');

  // Paginación miembros (frontend)
  const [paginationMiembros, setPaginationMiembros] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Modal agregar miembros
  const [modalAgregar, setModalAgregar] = useState(false);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [agregando, setAgregando] = useState(false);

  // Entrenamientos/Sesiones
  const [sesiones, setSesiones] = useState([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const [tabActiva, setTabActiva] = useState('miembros');
const [modalJugadorVisible, setModalJugadorVisible] = useState(false);
const [jugadorDetalle, setJugadorDetalle] = useState(null);
const [loadingJugadorDetalle, setLoadingJugadorDetalle] = useState(false);

  // Paginación entrenamientos (backend)
  const [paginationEntrenamientos, setPaginationEntrenamientos] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  useEffect(() => {
    if (tabActiva === 'entrenamientos') {
      cargarSesiones(1, 10);
    }
  }, [tabActiva, id]);

  useEffect(() => {
    aplicarFiltros();
  }, [busqueda, filtroEstado, filtroCarrera, miembros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const grupoData = await obtenerGrupoPorId(parseInt(id));
      setGrupo(grupoData);
      
      // Procesar miembros desde jugadorGrupos
      const miembrosData = (grupoData.jugadorGrupos || []).map(jg => ({
        id: jg.jugador?.id,
        jugadorGrupoId: jg.id,
        nombre: jg.jugador?.usuario?.nombre || 'Sin nombre',
        rut: jg.jugador?.usuario?.rut || 'Sin RUT',
        email: jg.jugador?.usuario?.email || 'Sin email',
        carrera: jg.jugador?.carrera || 'Sin carrera',
        telefono: jg.jugador?.telefono || 'Sin teléfono',
        anioIngreso: jg.jugador?.anioIngreso || 'N/A',
        estado: jg.jugador?.estado || 'activo',
        fechaNacimiento: jg.jugador?.fechaNacimiento,
        fechaAsignacion: jg.fechaAsignacion,
      }));
      
      setMiembros(miembrosData);
      setMiembrosFiltrados(miembrosData);
      setPaginationMiembros(prev => ({ ...prev, total: miembrosData.length }));
    } catch (error) {
      console.error('Error cargando datos:', error);
      message.error('Error al cargar los datos del grupo');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...miembros];

    // Filtro de búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      resultado = resultado.filter(m => 
        m.nombre?.toLowerCase().includes(busquedaLower) ||
        m.rut?.toLowerCase().includes(busquedaLower) ||
        m.email?.toLowerCase().includes(busquedaLower) ||
        m.carrera?.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro de estado
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(m => m.estado === filtroEstado);
    }

    // Filtro de carrera
    if (filtroCarrera !== 'todos') {
      resultado = resultado.filter(m => m.carrera === filtroCarrera);
    }

    setMiembrosFiltrados(resultado);
    setPaginationMiembros(prev => ({ ...prev, total: resultado.length, current: 1 }));
  };

  const handleRemoverMiembro = async (jugadorId) => {
    try {
      await removerJugadorDeGrupo(jugadorId, parseInt(id));
      message.success('Jugador removido del grupo correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error removiendo miembro:', error);
      message.error(error.response?.data?.message || 'Error al remover miembro');
    }
  };
  
  const handleVerDetalleSesion = async (sesionId) => {
    try {
      setLoadingDetalle(true);
      setDetalleModal(true);
      const detalle = await obtenerSesionPorId(sesionId);
      setSesionDetalle(detalle);
    } catch (error) {
      console.error('Error cargando detalle de sesión:', error);
      message.error('Error al cargar el detalle de la sesión');
      setDetalleModal(false);
    } finally {
      setLoadingDetalle(false);
    }
  };
  const handleVerDetalleJugador = async (jugadorId) => {
  try {
    setLoadingJugadorDetalle(true);
    setModalJugadorVisible(true);

    const jugador = await obtenerJugadorPorId(jugadorId);
    setJugadorDetalle(jugador);
  } catch (error) {
    console.error('Error cargando detalle del jugador:', error);
    message.error('Error al cargar el detalle del jugador');
    setModalJugadorVisible(false);
  } finally {
    setLoadingJugadorDetalle(false);
  }
};


  const handleAgregarMiembro = async () => {
    try {
      setModalAgregar(true);
      // Cargar todos los jugadores
      const todosJugadores = await obtenerJugadores({ limit: 1000 });
      
      // Obtener IDs de jugadores que ya están en el grupo
      const idsEnGrupo = miembros.map(m => m.id);
      
      // Filtrar jugadores que NO están en el grupo
      const disponibles = (todosJugadores.jugadores || []).filter(
        j => !idsEnGrupo.includes(j.id)
      );
      
      setJugadoresDisponibles(disponibles);
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      message.error('Error al cargar jugadores disponibles');
    }
  };

  const handleConfirmarAgregar = async () => {
    if (!jugadorSeleccionado) {
      message.warning('Selecciona un jugador');
      return;
    }

    try {
      setAgregando(true);
      await asignarJugadorAGrupo(jugadorSeleccionado, parseInt(id));
      message.success('Jugador agregado al grupo correctamente');
      setModalAgregar(false);
      setJugadorSeleccionado(null);
      cargarDatos();
    } catch (error) {
      console.error('Error agregando jugador:', error);
      message.error(error.response?.data?.message || 'Error al agregar al grupo');
    } finally {
      setAgregando(false);
    }
  };

  // PAGINACIÓN DESDE BACKEND - Entrenamientos
  const cargarSesiones = async (page = 1, limit = 10) => {
    try {
      setLoadingSesiones(true);
      const data = await obtenerSesiones({ 
        grupoId: parseInt(id), 
        page, 
        limit 
      });
      
      // Extraer datos correctamente según estructura del backend
      const sesionesData = data?.sesiones || data?.data?.sesiones || [];
      const paginationData = data?.pagination || data?.data?.pagination || {};
      
      setSesiones(sesionesData);
      setPaginationEntrenamientos({
        current: paginationData.currentPage || page,
        pageSize: paginationData.itemsPerPage || limit,
        total: paginationData.totalItems || 0
      });
    } catch (error) {
      console.error('❌ Error cargando sesiones:', error);
      message.error('Error al cargar los entrenamientos');
    } finally {
      setLoadingSesiones(false);
    }
  };

  const handleEliminarSesion = async (sesionId) => {
    try {
      await eliminarSesion(sesionId);
      message.success('Entrenamiento eliminado correctamente');
      // Recargar la página actual
      cargarSesiones(paginationEntrenamientos.current, paginationEntrenamientos.pageSize);
    } catch (error) {
      console.error('Error eliminando sesión:', error);
      message.error(error.response?.data?.message || 'Error al eliminar entrenamiento');
    }
  };

  // Paginación frontend - Solo miembros
  const handlePageChangeMiembros = (page, pageSize) => {
    setPaginationMiembros({ ...paginationMiembros, current: page, pageSize });
  };

  // Paginación backend - Entrenamientos
  const handlePageChangeEntrenamientos = (page, pageSize) => {
    setPaginationEntrenamientos({ ...paginationEntrenamientos, current: page, pageSize });
    cargarSesiones(page, pageSize);
  };

  // Obtener carreras únicas para el filtro
  const carrerasUnicas = [...new Set(miembros.map(m => m.carrera))].filter(Boolean);

  // Calcular miembros paginados (frontend)
  const getMiembrosPaginados = () => {
    const startIndex = (paginationMiembros.current - 1) * paginationMiembros.pageSize;
    const endIndex = startIndex + paginationMiembros.pageSize;
    return miembrosFiltrados.slice(startIndex, endIndex);
  };

  // Columnas de entrenamientos
  const columnasEntrenamientos = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <span>{formatearFecha(fecha)}</span>
        </div>
      ),
      sorter: (a, b) => new Date(a.fecha) - new Date(b.fecha),
    },
    {
      title: 'Horario',
      key: 'horario',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#52c41a' }} />
          <span>{formatearHora(record.horaInicio)} - {formatearHora(record.horaFin)}</span>
        </div>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoSesion',
      key: 'tipoSesion',
      render: (tipo) => (
        <Tag color="blue">{tipo}</Tag>
      ),
    },
    {
      title: 'Cancha',
      dataIndex: ['cancha', 'nombre'],
      key: 'cancha',
      render: (nombre) => nombre || 'Sin cancha',
    },
    {
      title: 'Objetivos',
      dataIndex: 'objetivos',
      key: 'objetivos',
      render: (objetivos) => (
        <Text ellipsis style={{ maxWidth: 200 }}>
          {objetivos || 'Sin objetivos'}
        </Text>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver Detalle">
            <Button
              type="primary"
              size="middle"
              icon={<CalendarOutlined />}
              onClick={() => handleVerDetalleSesion(record.id)}
            />
          </Tooltip>

          <Tooltip title="Eliminar Entrenamiento">
            <Popconfirm
              title="¿Eliminar entrenamiento?"
              description="Esta acción no se puede deshacer"
              onConfirm={() => handleEliminarSesion(record.id)}
              okText="Sí, eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                size="middle"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Columnas de miembros
  const columns = [
     {
    title: 'Jugador',
    key: 'jugador',
    render: (_, record) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar 
          size={40} 
          icon={<UserOutlined />} 
          style={{ backgroundColor: '#1890ff' }}
        />
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.nombre || 'Sin nombre'}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.rut || 'Sin RUT'}
          </Text>
        </div>
      </div>
    ),
    width: 220,
  },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <Text style={{ fontSize: 13 }}>{email}</Text>
      ),
    },
    {
      title: 'Carrera',
      dataIndex: 'carrera',
      key: 'carrera',
      render: (carrera) => (
        <Tag color="blue">{carrera}</Tag>
      ),
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      render: (telefono) => (
        <Text style={{ fontSize: 13 }}>{telefono}</Text>
      ),
    },
    {
      title: 'Año Ingreso',
      dataIndex: 'anioIngreso',
      key: 'anioIngreso',
      align: 'center',
      width: 120,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={estado === 'activo' ? 'success' : 'default'}>
          {estado?.toUpperCase()}
        </Tag>
      ),
      align: 'center',
      width: 100,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver Perfil">
            <Button
  type="primary"
  size="middle"
  icon={<UserOutlined />}
  onClick={() => handleVerDetalleJugador(record.id)}
/>
          </Tooltip>

          <Tooltip title="Remover del Grupo">
            <Popconfirm
              title="¿Remover del grupo?"
              description="El jugador ya no pertenecerá a este grupo"
              onConfirm={() => handleRemoverMiembro(record.id)}
              okText="Sí, remover"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                size="middle"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', paddingTop: 120 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (!grupo) {
    return (
      <MainLayout>
        <div style={{ padding: 24 }}>
          <Empty description="Grupo no encontrado">
            <Button type="primary" onClick={() => navigate('/grupos')}>
              Volver a Grupos
            </Button>
          </Empty>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          <Card>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {grupo.nombre}
                  </Title>
                  {grupo.descripcion && (
                    <Text type="secondary">{grupo.descripcion}</Text>
                  )}
                </div>
              </div>

              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/grupos')}
                >
                  Volver
                </Button>
                {tabActiva === 'miembros' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAgregarMiembro}
                  >
                    Agregar Miembros
                  </Button>
                )}
                {tabActiva === 'entrenamientos' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate(`/sesiones/crear?grupoId=${id}`)}
                  >
                    Nuevo Entrenamiento
                  </Button>
                )}
              </Space>
            </div>

            {/* Tabs */}
            <Tabs
              activeKey={tabActiva}
              onChange={setTabActiva}
              items={[
                {
                  key: 'miembros',
                  label: (
                    <span>
                      <UserOutlined />
                      Miembros ({miembros.length})
                    </span>
                  ),
                  children: (
                    <>
                      {/* Filtros Miembros */}
                      <Card style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={8}>
                            <Input
                              placeholder="Buscar por nombre, RUT, email o carrera..."
                              prefix={<SearchOutlined />}
                              value={busqueda}
                              onChange={(e) => setBusqueda(e.target.value)}
                              allowClear
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8}>
                            <Select
                              value={filtroEstado}
                              onChange={setFiltroEstado}
                              style={{ width: '100%' }}
                              placeholder="Filtrar por estado"
                            >
                              <Option value="todos">Todos los estados</Option>
                              <Option value="activo">Activos</Option>
                              <Option value="inactivo">Inactivos</Option>
                            </Select>
                          </Col>
                          <Col xs={24} sm={12} md={8}>
                            <Select
                              value={filtroCarrera}
                              onChange={setFiltroCarrera}
                              style={{ width: '100%' }}
                              placeholder="Filtrar por carrera"
                            >
                              <Option value="todos">Todas las carreras</Option>
                              {carrerasUnicas.map(carrera => (
                                <Option key={carrera} value={carrera}>
                                  {carrera}
                                </Option>
                              ))}
                            </Select>
                          </Col>
                        </Row>
                      </Card>

                      {/* Tabla Miembros */}
                      <Card>
                        <Table
                          columns={columns}
                          dataSource={getMiembrosPaginados()}
                          rowKey="id"
                          pagination={false}
                          locale={{
                            emptyText: (
                              <Empty description="No hay miembros en este grupo">
                                <Button
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  onClick={handleAgregarMiembro}
                                >
                                  Agregar Miembros
                                </Button>
                              </Empty>
                            ),
                          }}
                        />

                        {/* Paginación externa */}
                        {paginationMiembros.total > 0 && (
                          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <Pagination
                              current={paginationMiembros.current}
                              pageSize={paginationMiembros.pageSize}
                              total={paginationMiembros.total}
                              onChange={handlePageChangeMiembros}
                              onShowSizeChange={handlePageChangeMiembros}
                              showSizeChanger
                              showTotal={(total) => `Total: ${total} miembros`}
                              pageSizeOptions={['5', '10', '20', '50']}
                            />
                          </div>
                        )}
                      </Card>
                    </>
                  ),
                },
                {
                  key: 'entrenamientos',
                  label: (
                    <span>
                      <CalendarOutlined />
                      Entrenamientos ({paginationEntrenamientos.total})
                    </span>
                  ),
                  children: (
                    <>
                      {/* Botón actualizar entrenamientos */}
                      <Card style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                        <Row gutter={16} align="middle">
                          <Col flex="auto"></Col>
                          <Col>
                            <Button
                              icon={<ReloadOutlined />}
                              onClick={() => cargarSesiones(paginationEntrenamientos.current, paginationEntrenamientos.pageSize)}
                              loading={loadingSesiones}
                            >
                              Actualizar
                            </Button>
                          </Col>
                        </Row>
                      </Card>

                      {/* Tabla Entrenamientos */}
                      <Card>
                        <Table
                          columns={columnasEntrenamientos}
                          dataSource={sesiones}
                          rowKey="id"
                          loading={loadingSesiones}
                          pagination={false}
                          locale={{
                            emptyText: (
                              <Empty description="No hay entrenamientos programados">
                                <Button
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  onClick={() => navigate(`/sesiones/crear?grupoId=${id}`)}
                                >
                                  Crear Primer Entrenamiento
                                </Button>
                              </Empty>
                            ),
                          }}
                        />

                        {/* Paginación externa */}
                        {paginationEntrenamientos.total > 0 && (
                          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <Pagination
                              current={paginationEntrenamientos.current}
                              pageSize={paginationEntrenamientos.pageSize}
                              total={paginationEntrenamientos.total}
                              onChange={handlePageChangeEntrenamientos}
                              onShowSizeChange={handlePageChangeEntrenamientos}
                              showSizeChanger
                              showTotal={(total) => `Total: ${total} entrenamientos`}
                              pageSizeOptions={['5', '10', '20', '50']}
                            />
                          </div>
                        )}
                      </Card>
                    </>
                  ),
                },
              ]}
            />
          </Card>

          {/* Modal Agregar Miembros */}
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined />
                <span>Agregar Jugador al Grupo</span>
              </div>
            }
            open={modalAgregar}
            onCancel={() => {
              setModalAgregar(false);
              setJugadorSeleccionado(null);
            }}
            footer={[
              <Button
                key="cancel"
                onClick={() => {
                  setModalAgregar(false);
                  setJugadorSeleccionado(null);
                }}
              >
                Cancelar
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={agregando}
                onClick={handleConfirmarAgregar}
                disabled={!jugadorSeleccionado}
              >
                Agregar
              </Button>,
            ]}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong>Grupo: </Text>
              <Text>{grupo?.nombre}</Text>
            </div>

            <div>
              <Text strong>Selecciona un jugador:</Text>
              <Select
                value={jugadorSeleccionado}
                onChange={setJugadorSeleccionado}
                placeholder="Buscar por nombre, RUT o carrera..."
                style={{ width: '100%', marginTop: 8 }}
                showSearch
                filterOption={(input, option) => {
                  const searchText = input.toLowerCase();
                  return option.label.toLowerCase().includes(searchText);
                }}
                options={jugadoresDisponibles.map(jugador => ({
                  value: jugador.id,
                  label: `${jugador.usuario?.nombre || 'Sin nombre'} - ${jugador.usuario?.rut || 'Sin RUT'} - ${jugador.carrera || 'Sin carrera'}`,
                }))}
              />

              {jugadoresDisponibles.length === 0 && (
                <Alert
                  message="No hay jugadores disponibles"
                  description="Todos los jugadores ya están en este grupo"
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </div>
          </Modal>

          <DetalleSesionModal
            open={detalleModal}
            loading={loadingDetalle}
            sesion={sesionDetalle}
            onClose={() => {
              setDetalleModal(false);
              setSesionDetalle(null);
            }}
          />
          <JugadorDetalleModal
  visible={modalJugadorVisible}
  loading={loadingJugadorDetalle}
  jugador={jugadorDetalle}
  onClose={() => {
    setModalJugadorVisible(false);
    setJugadorDetalle(null);
  }}
/>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}