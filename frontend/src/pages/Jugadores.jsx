import { useState, useEffect, useMemo, useRef } from 'react';
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
import {FilterOutlined,
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

  // Data y carga
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginación (consistente con backend)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Filtros (server-side)
  const [busqueda, setBusqueda] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroCarrera, setFiltroCarrera] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState(null);

  // Opciones estables (acumuladas) para selects
  const [carrerasOpts, setCarrerasOpts] = useState([]); // string[]
  const [aniosOpts, setAniosOpts] = useState([]);       // number[]

  // Modal detalle
  const [detalleModal, setDetalleModal] = useState(false);
  const [jugadorDetalle, setJugadorDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Control de carreras de requests
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Debounce para la búsqueda
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(busqueda.trim()), 500);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Cargar jugadores (server-side)
  const cargarJugadores = async (page = 1, pageSize = pagination.pageSize, q = qDebounced) => {
    const currentReq = ++requestIdRef.current;
    try {
      setLoading(true);

      const params = { pagina: page, limite: pageSize };
      if (q) params.q = q;
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroCarrera) params.carrera = filtroCarrera;
      if (filtroAnio) params.anioIngreso = filtroAnio;

      const data = await obtenerJugadores(params);
      if (currentReq !== requestIdRef.current) return;

      const lista = data.jugadores || [];

      setJugadores(lista);
      setPagination({
        current: data.pagina ?? page,
        pageSize: pageSize,
        total: data.total ?? 0,
        totalPages: data.totalPaginas
      });

      // Actualiza opciones estables (acumula sin duplicar)
      if (lista.length) {
        const nuevasCarreras = [
          ...new Set([
            ...carrerasOpts,
            ...lista
              .map(j => j.carrera)
              .filter(c => typeof c === 'string' && c.trim() !== '')
          ])
        ].sort((a, b) => a.localeCompare(b));

        const nuevosAnios = [
          ...new Set([
            ...aniosOpts,
            ...lista.map(j => j.anioIngreso).filter(a => !!a)
          ])
        ].sort((a, b) => b - a);

        if (JSON.stringify(nuevasCarreras) !== JSON.stringify(carrerasOpts)) {
          setCarrerasOpts(nuevasCarreras);
        }
        if (JSON.stringify(nuevosAnios) !== JSON.stringify(aniosOpts)) {
          setAniosOpts(nuevosAnios);
        }
      }
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error cargando jugadores:', error);
      message.error('Error al cargar los jugadores');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // Efecto único: mount + cambios de filtros/búsqueda + cambio de pageSize
  useEffect(() => {
    cargarJugadores(1, pagination.pageSize, qDebounced);
  }, [filtroEstado, filtroCarrera, filtroAnio, qDebounced, pagination.pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
    cargarJugadores(page, pageSize, qDebounced);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado(null);
    setFiltroCarrera(null);
    setFiltroAnio(null);
  };

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
      cargarJugadores(pagination.current, pagination.pageSize, qDebounced);
    } catch (error) {
      console.error('Error eliminando jugador:', error);
      message.error(error.response?.data?.message || 'Error al eliminar el jugador');
    }
  };

  const columns = useMemo(() => [
    {
      title: 'Jugador',
      key: 'jugador',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
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
      // sin width fijo para que respire
      ellipsis: false,
    },
    {
      title: 'Posición',
      dataIndex: 'posicion',
      key: 'posicion',
      render: (posicion) => posicion || '—',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Carrera',
      dataIndex: 'carrera',
      key: 'carrera',
      // Más espacio + wrap + Tooltip
      render: (carrera) => {
        if (!carrera) return '—';
        return (
          <Tooltip title={carrera}>
            <span style={{ display: 'inline-block', maxWidth: 320, whiteSpace: 'normal', lineHeight: 1.2 }}>
              {carrera}
            </span>
          </Tooltip>
        );
      },
      width: 300, // más ancho que antes
    },
    {
      title: 'Año',
      dataIndex: 'anioIngreso',
      key: 'anioIngreso',
      align: 'center',
      width: 90,
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
              <Tag
                key={`${jg.grupo?.id}-${jg.grupo?.nombre}`}
                icon={<TeamOutlined />}
                color="blue"
                style={{ fontSize: 12 }}
              >
                {jg.grupo?.nombre}
              </Tag>
            ))}
          </Space>
        );
      },
      // sin width fijo, que se adapte
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
      width: 110,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      width: 230,
      render: (_, record) => (
        <Space size="small" wrap>
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
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleEliminar(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            placement="left"
          >
            <Tooltip title="Eliminar" placement="top">
              <Button danger size="middle" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [navigate]);

  const hayFiltrosActivos = !!(qDebounced || filtroEstado || filtroCarrera || filtroAnio);

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
          {/* Card de Filtros */}
          <Card
            title={
              <span>
                <FilterOutlined /> Filtros
              </span>
            }
            style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
            extra={
              hayFiltrosActivos && (
                <Button onClick={limpiarFiltros}>Limpiar Filtros</Button>
              )
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                gap: 12,
                alignItems: 'center'
              }}
            >
              <Input
                allowClear
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                prefix={<SearchOutlined />}
                placeholder="Buscar por nombre, RUT, carrera o posición…"
              />

              <Select
                allowClear
                placeholder="Estado"
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
                placeholder="Carrera"
                value={filtroCarrera}
                onChange={setFiltroCarrera}
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {carrerasOpts.map(carrera => (
                  <Option key={carrera} value={carrera}>{carrera}</Option>
                ))}
              </Select>

              <Select
                allowClear
                placeholder="Año"
                value={filtroAnio}
                onChange={setFiltroAnio}
                showSearch
                filterOption={(input, option) =>
                  (String(option?.children ?? '')).toLowerCase().includes(input.toLowerCase())
                }
              >
                {aniosOpts.map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Tabla */}
          <Table
            columns={columns}
            dataSource={jugadores}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="middle"
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

          {jugadores.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16 }}>
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
          onClose={() => { setDetalleModal(false); setJugadorDetalle(null); }}
          jugador={jugadorDetalle}
          loading={loadingDetalle}
        />
      </div>
    </ConfigProvider>
  </MainLayout>
);
}
