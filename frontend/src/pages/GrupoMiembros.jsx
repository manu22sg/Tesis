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
  Statistic,
  Popconfirm,
  Modal,
  Alert,
  Tabs
} from 'antd';
import {
  TeamOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SearchOutlined,
  DeleteOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerGrupoPorId } from '../services/grupo.services.js';
import { removerJugadorDeGrupo, asignarJugadorAGrupo, obtenerJugadores } from '../services/jugador.services.js';
import { obtenerSesiones, eliminarSesion } from '../services/sesion.services.js';
import MainLayout from '../components/MainLayout.jsx';
const { Title, Text } = Typography;
const { Option } = Select;

export default function GrupoMiembros() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [miembrosFiltrados, setMiembrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros miembros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCarrera, setFiltroCarrera] = useState('todos');

  // Modal agregar miembros
  const [modalAgregar, setModalAgregar] = useState(false);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [agregando, setAgregando] = useState(false);

  // Entrenamientos/Sesiones
  const [sesiones, setSesiones] = useState([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const [tabActiva, setTabActiva] = useState('miembros');

  useEffect(() => {
    cargarDatos();
  }, [id]);

  useEffect(() => {
    if (tabActiva === 'entrenamientos') {
      cargarSesiones();
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

  const cargarSesiones = async () => {
    try {
      setLoadingSesiones(true);
      const data = await obtenerSesiones({ grupoId: parseInt(id), limit: 50 });
      console.log('Sesiones cargadas:', data);
      setSesiones(data.sesiones || []);
    } catch (error) {
      console.error('Error cargando sesiones:', error);
      console.log(error);
      message.error('Error al cargar los entrenamientos');
    } finally {
      setLoadingSesiones(false);
    }
  };

  const handleEliminarSesion = async (sesionId) => {
    try {
      await eliminarSesion(sesionId);
      message.success('Entrenamiento eliminado correctamente');
      cargarSesiones();
    } catch (error) {
      console.error('Error eliminando sesión:', error);
      message.error(error.response?.data?.message || 'Error al eliminar entrenamiento');
    }
  };

  const handleVerJugador = (jugadorId) => {
    navigate(`/jugadores/${jugadorId}`);
  };

  // Obtener carreras únicas para el filtro
  const carrerasUnicas = [...new Set(miembros.map(m => m.carrera))].filter(Boolean);

  // Columnas de entrenamientos
  const columnasEntrenamientos = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <span>{new Date(fecha).toLocaleDateString('es-CL')}</span>
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
          <span>{record.horaInicio} - {record.horaFin}</span>
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
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/sesiones/${record.id}`)}
          >
            Ver Detalle
          </Button>
          <Popconfirm
            title="¿Eliminar entrenamiento?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleEliminarSesion(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 200,
      align: 'center',
    },
  ];

  const columns = [
    {
      title: 'Jugador',
      key: 'jugador',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserOutlined style={{ fontSize: 18, color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>
              {record.nombre}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.rut}
            </Text>
          </div>
        </div>
      ),
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
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleVerJugador(record.id)}
          >
            Ver Perfil
          </Button>
          <Popconfirm
            title="¿Remover del grupo?"
            description="El jugador ya no pertenecerá a este grupo"
            onConfirm={() => handleRemoverMiembro(record.id)}
            okText="Sí, remover"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              Remover
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 180,
      align: 'center',
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!grupo) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="Grupo no encontrado">
          <Button type="primary" onClick={() => navigate('/grupos')}>
            Volver a Grupos
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <MainLayout>
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
                  {/* Estadísticas Miembros */}
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={8}>
                      <Card>
                        <Statistic
                          title="Total de Miembros"
                          value={miembros.length}
                          prefix={<UserOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card>
                        <Statistic
                          title="Miembros Activos"
                          value={miembros.filter(m => m.estado === 'activo').length}
                          prefix={<UserOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card>
                        <Statistic
                          title="Resultados Filtrados"
                          value={miembrosFiltrados.length}
                          prefix={<SearchOutlined />}
                          valueStyle={{ color: '#faad14' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  {/* Filtros Miembros */}
                  <Card style={{ marginBottom: 16 }}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={8}>
                        <Input
                          placeholder="Buscar por nombre, RUT, email o carrera..."
                          prefix={<SearchOutlined />}
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          allowClear
                          size="large"
                        />
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Select
                          value={filtroEstado}
                          onChange={setFiltroEstado}
                          style={{ width: '100%' }}
                          size="large"
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
                          size="large"
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
                  <Table
                    columns={columns}
                    dataSource={miembrosFiltrados}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total: ${total} miembros`,
                    }}
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
                </>
              ),
            },
            {
              key: 'entrenamientos',
              label: (
                <span>
                  <CalendarOutlined />
                  Entrenamientos ({sesiones.length})
                </span>
              ),
              children: (
                <>
                  {/* Tabla Entrenamientos */}
                  <Table
                    columns={columnasEntrenamientos}
                    dataSource={sesiones}
                    rowKey="id"
                    loading={loadingSesiones}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total: ${total} entrenamientos`,
                    }}
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
            size="large"
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
    </div>
    </MainLayout>
  );
}