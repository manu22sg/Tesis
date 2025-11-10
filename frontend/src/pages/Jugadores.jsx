import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Empty,
  Tooltip,
  Popconfirm,
  Input,
  Select,
  Pagination,
  Avatar,
  Typography,
  ConfigProvider
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  obtenerJugadores,
  obtenerJugadorPorId,
  eliminarJugador
} from '../services/jugador.services.js';
import MainLayout from '../components/MainLayout.jsx';
import JugadorDetalleModal from '../components/JugadorDetalleModal.jsx';

const { Text } = Typography;
const { Option } = Select;

const ESTADO_COLORS = {
  activo: 'success',
  inactivo: 'default',
  lesionado: 'error',
  suspendido: 'warning'
};

export default function Jugadores() {
  const navigate = useNavigate();

  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroCarrera, setFiltroCarrera] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState(null);

  // Modal detalle
  const [detalleModal, setDetalleModal] = useState(false);
  const [jugadorDetalle, setJugadorDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Obtener carreras y años únicos de los jugadores cargados
  const carrerasUnicas = useMemo(() => {
    const carreras = jugadores
      .map(j => j.carrera)
      .filter(c => c && c.trim() !== '');
    return [...new Set(carreras)].sort();
  }, [jugadores]);

  const aniosUnicos = useMemo(() => {
    const anios = jugadores
      .map(j => j.anioIngreso)
      .filter(a => a);
    return [...new Set(anios)].sort((a, b) => b - a);
  }, [jugadores]);

  const cargarJugadores = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);

      const params = {
        pagina: page,
        limite: pageSize
      };

      if (filtroEstado) params.estado = filtroEstado;
      if (filtroCarrera) params.carrera = filtroCarrera;
      if (filtroAnio) params.anioIngreso = filtroAnio;

      const data = await obtenerJugadores(params);

      setJugadores(data.jugadores || []);
      setPagination({
        current: data.pagina,
        pageSize: pageSize,
        total: data.total,
        totalPages: data.totalPaginas
      });
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      message.error('Error al cargar los jugadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarJugadores(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroCarrera, filtroAnio]);

  const verDetalle = async (jugadorId) => {
    try {
      setLoadingDetalle(true);
      setDetalleModal(true);
      const detalle = await obtenerJugadorPorId(jugadorId);
      setJugadorDetalle(detalle);
    } catch (error) {
      console.error('Error cargando detalle:', error);
      message.error('Error al cargar el detalle del jugador');
      setDetalleModal(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleEliminar = async (jugadorId) => {
    try {
      await eliminarJugador(jugadorId);
      message.success('Jugador eliminado correctamente');
      cargarJugadores(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error eliminando jugador:', error);
      message.error(error.response?.data?.message || 'Error al eliminar el jugador');
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado(null);
    setFiltroCarrera(null);
    setFiltroAnio(null);
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
    cargarJugadores(page, pageSize);
  };

  const cerrarModal = () => {
    setDetalleModal(false);
    setJugadorDetalle(null);
  };

  // Filtrar localmente por búsqueda
  const jugadoresFiltrados = jugadores.filter(jugador => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      jugador.usuario?.nombre?.toLowerCase().includes(searchLower) ||
      jugador.usuario?.rut?.toLowerCase().includes(searchLower) ||
      jugador.carrera?.toLowerCase().includes(searchLower) ||
      jugador.posicion?.toLowerCase().includes(searchLower)
    );
  });

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
              {record.usuario?.nombre || 'Sin nombre'}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.usuario?.rut || 'Sin RUT'}
            </Text>
          </div>
        </div>
      ),
      width: 220,
    },
    {
      title: 'Posición',
      dataIndex: 'posicion',
      key: 'posicion',
      render: (posicion) => posicion || '—',
      width: 100,
    },
    {
      title: 'Carrera',
      dataIndex: 'carrera',
      key: 'carrera',
      render: (carrera) => carrera || '—',
      width: 150,
    },
    {
      title: 'Año',
      dataIndex: 'anioIngreso',
      key: 'anioIngreso',
      align: 'center',
      width: 80,
    },
    {
      title: 'Grupos',
      key: 'grupos',
      render: (_, record) => {
        const grupos = record.jugadorGrupos || [];
        if (grupos.length === 0) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Space size={4} wrap>
            {grupos.map((jg) => (
              <Tag key={jg.grupo?.id} icon={<TeamOutlined />} color="blue" style={{ fontSize: 12 }}>
                {jg.grupo?.nombre}
              </Tag>
            ))}
          </Space>
        );
      },
      width: 180,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={ESTADO_COLORS[estado] || 'default'}>
          {estado?.toUpperCase() || 'N/A'}
        </Tag>
      ),
      align: 'center',
      width: 90,
    },
    {
  title: 'Acciones',
  key: 'acciones',
  align: 'center',
  width: 220,
  fixed: 'right',
  render: (_, record) => (
    <Space size="small">
      <Tooltip title="Ver Detalle" placement="top">
        <Button
          type="primary"
          size="middle"
          icon={<EyeOutlined />}
          onClick={() => verDetalle(record.id)}
        />
      </Tooltip>

      <Tooltip title="Editar" placement="top">
        <Button
          size="middle"
          icon={<EditOutlined />}
          onClick={() => navigate(`/jugadores/editar/${record.id}`)}
        />
      </Tooltip>

      <Tooltip title="Grupos" placement="top">
        <Button
          size="middle"
          icon={<TeamOutlined />}
          onClick={() => navigate(`/jugadores/${record.id}/grupos`)}
        />
      </Tooltip>

      <Popconfirm
        title="¿Eliminar jugador?"
        onConfirm={() => handleEliminar(record.id)}
        okText="Aceptar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <Tooltip title="Eliminar" placement="top">
          <Button
            danger
            size="middle"
            icon={<DeleteOutlined />}
          />
        </Tooltip>
      </Popconfirm>
    </Space>
  ),
},
  ];

  const hayFiltrosActivos = busqueda || filtroEstado || filtroCarrera || filtroAnio;

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TrophyOutlined style={{ fontSize: 24 }} />
                <span>Jugadores</span>
              </div>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/jugadores/nuevo')}
              >
                Nuevo Jugador
              </Button>
            }
          >
            {/* Barra de filtros */}
            <div style={{ 
              marginBottom: 16, 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12 
            }}>
              <Input
                allowClear
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                prefix={<SearchOutlined />}
                placeholder="Buscar por nombre o RUT..."
              />
              
              <Select
                allowClear
                placeholder="Filtrar por estado"
                value={filtroEstado}
                onChange={setFiltroEstado}
              >
                <Option value="activo">Activo</Option>
                <Option value="inactivo">Inactivo</Option>
                <Option value="lesionado">Lesionado</Option>
                <Option value="suspendido">Suspendido</Option>
              </Select>

              <Select
                allowClear
                showSearch
                placeholder="Filtrar por carrera"
                value={filtroCarrera}
                onChange={setFiltroCarrera}
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {carrerasUnicas.map(carrera => (
                  <Option key={carrera} value={carrera}>{carrera}</Option>
                ))}
              </Select>

              <Select
                allowClear
                placeholder="Año de ingreso"
                value={filtroAnio}
                onChange={setFiltroAnio}
                showSearch
              >
                {aniosUnicos.map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>

              {hayFiltrosActivos && (
                <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
              )}
            </div>

            <Table
              columns={columns}
              dataSource={jugadoresFiltrados}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="middle"
              scroll={{ x: 1100 }}
              locale={{
                emptyText: (
                  <Empty
                    description={
                      hayFiltrosActivos
                        ? 'No se encontraron jugadores con los filtros aplicados'
                        : 'No hay jugadores registrados'
                    }
                  >
                    {!hayFiltrosActivos && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/jugadores/nuevo')}
                      >
                        Registrar primer jugador
                      </Button>
                    )}
                  </Empty>
                ),
              }}
            />

            {jugadoresFiltrados.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total) => `Total: ${total} jugadores`}
                  pageSizeOptions={['5', '10', '20', '50']}
                />
              </div>
            )}
          </Card>

          {/* Modal Detalle */}
          <JugadorDetalleModal
            visible={detalleModal}
            onClose={cerrarModal}
            jugador={jugadorDetalle}
            loading={loadingDetalle}
          />
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}