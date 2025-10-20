import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Empty,
  Tooltip,
  Modal,
  Popconfirm,
  Input,
  Select,
  Pagination,
  Avatar,
  Typography
} from 'antd';
import {
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
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
  const [filtroCarrera, setFiltroCarrera] = useState('');
  const [filtroAnio, setFiltroAnio] = useState(null);

  // Modal detalle
  const [detalleModal, setDetalleModal] = useState(false);
  const [jugadorDetalle, setJugadorDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

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
    setFiltroCarrera('');
    setFiltroAnio(null);
  };

  const handlePageChange = (page, pageSize) => {
    cargarJugadores(page, pageSize);
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
      width: 250,
    },
    {
      title: 'Posición',
      dataIndex: 'posicion',
      key: 'posicion',
      render: (posicion) => posicion || '—',
      width: 120,
    },
    {
      title: 'Carrera',
      dataIndex: 'carrera',
      key: 'carrera',
      render: (carrera) => carrera || '—',
      width: 180,
    },
    {
      title: 'Año Ingreso',
      dataIndex: 'anioIngreso',
      key: 'anioIngreso',
      align: 'center',
      width: 120,
    },
    {
      title: 'Grupos',
      key: 'grupos',
      render: (_, record) => {
        const grupos = record.jugadorGrupos || [];
        if (grupos.length === 0) {
          return <Text type="secondary">Sin grupo</Text>;
        }
        return (
          <Space size={4} wrap>
            {grupos.map((jg) => (
              <Tag key={jg.grupo?.id} icon={<TeamOutlined />} color="blue">
                {jg.grupo?.nombre}
              </Tag>
            ))}
          </Space>
        );
      },
      width: 200,
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
      width: 100,
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
          <Tooltip title="Editar">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/jugadores/editar/${record.id}`)} 
            />
          </Tooltip>
          <Tooltip title="Gestionar grupos">
            <Button 
              type="link" 
              icon={<TeamOutlined />} 
              onClick={() => navigate(`/jugadores/${record.id}/grupos`)} 
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar este jugador?"
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
      width: 180,
      align: 'center',
      fixed: 'right',
    },
  ];

  return (
    <MainLayout>
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
            placeholder="Buscar por nombre, RUT..."
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

          <Input
            allowClear
            value={filtroCarrera}
            onChange={(e) => setFiltroCarrera(e.target.value)}
            placeholder="Filtrar por carrera"
          />

          <Select
            allowClear
            placeholder="Año de ingreso"
            value={filtroAnio}
            onChange={setFiltroAnio}
            showSearch
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <Option key={year} value={year}>{year}</Option>
            ))}
          </Select>

          <Space>
            {(busqueda || filtroEstado || filtroCarrera || filtroAnio) && (
              <Button onClick={limpiarFiltros}>Limpiar</Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => cargarJugadores(pagination.current, pagination.pageSize)}
            >
              Actualizar
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={jugadoresFiltrados}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  busqueda || filtroEstado || filtroCarrera || filtroAnio
                    ? 'No se encontraron jugadores con los filtros aplicados'
                    : 'No hay jugadores registrados'
                }
              >
                {!busqueda && !filtroEstado && !filtroCarrera && !filtroAnio && (
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
          <div style={{ textAlign: 'center', marginTop: 24 }}>
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
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined />
            <span>Detalle del Jugador</span>
          </div>
        }
        open={detalleModal}
        onCancel={() => { setDetalleModal(false); setJugadorDetalle(null); }}
        footer={[
          <Button key="close" onClick={() => setDetalleModal(false)}>
            Cerrar
          </Button>
        ]}
        width={700}
      >
        {loadingDetalle ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <UserOutlined style={{ fontSize: 48, color: '#ccc' }} />
            <p>Cargando...</p>
          </div>
        ) : jugadorDetalle ? (
          <div>
            {/* Información Personal */}
            <h3>Información Personal</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 16,
              marginBottom: 24 
            }}>
              <div>
                <Text strong>Nombre:</Text>
                <div>{jugadorDetalle.usuario?.nombre || '—'}</div>
              </div>
              <div>
                <Text strong>RUT:</Text>
                <div>{jugadorDetalle.usuario?.rut || '—'}</div>
              </div>
              <div>
                <Text strong>Email:</Text>
                <div>{jugadorDetalle.usuario?.email || '—'}</div>
              </div>
              <div>
                <Text strong>Estado:</Text>
                <div>
                  <Tag color={ESTADO_COLORS[jugadorDetalle.estado]}>
                    {jugadorDetalle.estado?.toUpperCase() || 'N/A'}
                  </Tag>
                </div>
              </div>
            </div>

            {/* Información Deportiva */}
            <h3>Información Deportiva</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 16,
              marginBottom: 24 
            }}>
              <div>
                <Text strong>Posición:</Text>
                <div>{jugadorDetalle.posicion || '—'}</div>
              </div>
              <div>
                <Text strong>Lateralidad:</Text>
                <div>{jugadorDetalle.lateralidad || '—'}</div>
              </div>
              <div>
                <Text strong>Altura:</Text>
                <div>{jugadorDetalle.altura ? `${jugadorDetalle.altura} cm` : '—'}</div>
              </div>
              <div>
                <Text strong>Peso:</Text>
                <div>{jugadorDetalle.peso ? `${jugadorDetalle.peso} kg` : '—'}</div>
              </div>
            </div>

            {/* Información Académica */}
            <h3>Información Académica</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 16,
              marginBottom: 24 
            }}>
              <div>
                <Text strong>Carrera:</Text>
                <div>{jugadorDetalle.carrera || '—'}</div>
              </div>
              <div>
                <Text strong>Año de Ingreso:</Text>
                <div>{jugadorDetalle.anioIngreso || '—'}</div>
              </div>
            </div>

            {/* Grupos */}
            <h3>Grupos Asignados</h3>
            {jugadorDetalle.jugadorGrupos?.length > 0 ? (
              <Space wrap>
                {jugadorDetalle.jugadorGrupos.map((jg) => (
                  <Tag 
                    key={jg.grupo?.id} 
                    icon={<TeamOutlined />} 
                    color="blue"
                    style={{ padding: '4px 12px' }}
                  >
                    {jg.grupo?.nombre}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">No está asignado a ningún grupo</Text>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
    </MainLayout>
  );
}