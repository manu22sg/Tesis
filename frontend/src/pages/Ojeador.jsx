import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Input,
  Select,
  Table,
  Button,
  Space,
  Tag,
  Empty,
  Typography,
  message,
  Pagination,
  ConfigProvider,
  Avatar,
  Spin
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  TrophyOutlined,
  UserOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import locale from 'antd/locale/es_ES';
import MainLayout from '../components/MainLayout.jsx';
import { ojeadorService } from '../services/jugadorCampeonato.services.js';
import { carreraService } from '../services/carrera.services.js';

const { Text } = Typography;
const { Option } = Select;

export default function Ojeador() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [jugadores, setJugadores] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [filtroCarreraId, setFiltroCarreraId] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState(null);

  // Opciones de filtros
  const [carrerasOpts, setCarrerasOpts] = useState([]);
  const [loadingCarreras, setLoadingCarreras] = useState(true);

  const requestIdRef = useRef(0);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => setQDebounced(busqueda.trim()), 500);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Cargar carreras al inicio
  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const data = await carreraService.listar();
        setCarrerasOpts(data);
      } catch (error) {
        console.error('Error al cargar carreras:', error);
        message.error('Error al cargar las carreras');
      } finally {
        setLoadingCarreras(false);
      }
    };

    fetchCarreras();
  }, []);

  // Cargar jugadores
  const cargarJugadores = async (page = 1, pageSize = 10) => {
    const currentReq = ++requestIdRef.current;
    
    try {
      setLoading(true);

      const params = {
        pagina: page,
        limite: pageSize
      };

      if (qDebounced) params.q = qDebounced;
      if (filtroCarreraId) params.carreraId = filtroCarreraId;
      if (filtroAnio) params.anio = filtroAnio;

      const data = await ojeadorService.buscarJugadores(params);

      if (currentReq !== requestIdRef.current) return;

      const lista = data.jugadores || [];
      
      setJugadores(lista);
      setPagination({
        current: data.pagination?.currentPage || page,
        pageSize: pageSize,
        total: data.pagination?.totalItems || 0
      });

    } catch (error) {
      console.error('Error cargando jugadores:', error);
      message.error('Error al cargar los jugadores');
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar y cuando cambien filtros
  useEffect(() => {
    cargarJugadores(1, pagination.pageSize);
  }, [qDebounced, filtroCarreraId, filtroAnio]); // eslint-disable-line

  const handlePageChange = (page, pageSize) => {
    cargarJugadores(page, pageSize);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCarreraId(null);
    setFiltroAnio(null);
  };

  const verPerfil = (usuarioId) => {
    navigate(`/ojeador/${usuarioId}`);
  };

  const hayFiltrosActivos = !!(qDebounced || filtroCarreraId || filtroAnio);

  const columns = [
    {
      title: 'Jugador',
      key: 'jugador',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar 
            size={45} 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#1890ff' }} 
          />
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>
              {record.nombre || 'Sin nombre'} {record.apellido || ''}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.rut || 'Sin RUT'}
            </Text>
          </div>
        </div>
      ),
      width: 250
    },
    {
      title: 'Carrera',
      dataIndex: 'carreraNombre',
      key: 'carreraNombre',
      render: (carrera) => carrera || <Text type="secondary">—</Text>,
      ellipsis: true
    },
    {
      title: 'Campeonatos',
      dataIndex: 'totalCampeonatos',
      key: 'totalCampeonatos',
      align: 'center',
      render: (total) => (
        <Tag color="blue" icon={<TrophyOutlined />}>
          {total}
        </Tag>
      ),
      width: 130
    },
    {
      title: 'Goles',
      dataIndex: 'totalGoles',
      key: 'totalGoles',
      align: 'center',
      render: (goles) => (
        <Tag color="green" style={{ fontSize: 14, fontWeight: 'bold' }}>
          ⚽ {goles}
        </Tag>
      ),
      width: 100
    },
    {
      title: 'Asistencias',
      dataIndex: 'totalAsistencias',
      key: 'totalAsistencias',
      align: 'center',
      render: (asist) => (
        <Tag color="purple" style={{ fontSize: 14 }}>
          🎯 {asist}
        </Tag>
      ),
      width: 120
    },
    {
      title: 'Atajadas',
      dataIndex: 'totalAtajadas',
      key: 'totalAtajadas',
      align: 'center',
      render: (ataj) => (
        ataj > 0 ? (
          <Tag color="orange" style={{ fontSize: 14 }}>
            🧤 {ataj}
          </Tag>
        ) : <Text type="secondary">—</Text>
      ),
      width: 100
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => verPerfil(record.usuarioId)}
        >
          Ver Perfil
        </Button>
      )
    }
  ];

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TrophyOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <span style={{ fontSize: 20 }}>Ojeador de Jugadores</span>
              </div>
            }
           
          >
            {/* Card de Filtros */}
            <Card
              title={
                <span>
                  <FilterOutlined /> Búsqueda y Filtros
                </span>
              }
              style={{ marginBottom: 24, backgroundColor: '#fafafa' }}
              extra={
                hayFiltrosActivos && (
                  <Button onClick={limpiarFiltros}>Limpiar Filtros</Button>
                )
              }
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  gap: 16,
                  alignItems: 'center'
                }}
              >
                <Input
                  size="large"
                  allowClear
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  prefix={<SearchOutlined />}
                  placeholder="Buscar por nombre o RUT del jugador..."
                />

                <Select
                  size="large"
                  allowClear
                  showSearch
                  placeholder="Seleccionar carrera"
                  value={filtroCarreraId}
                  onChange={setFiltroCarreraId}
                  loading={loadingCarreras}
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {carrerasOpts.map(carrera => (
                    <Option key={carrera.id} value={carrera.id}>
                      {carrera.nombre}
                    </Option>
                  ))}
                </Select>

                <Select
                  size="large"
                  allowClear
                  placeholder="Filtrar por año"
                  value={filtroAnio}
                  onChange={setFiltroAnio}
                >
                  {[2025, 2024, 2023, 2022, 2021].map(year => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </div>
            </Card>

            {/* Tabla de Jugadores */}
            <Table
              columns={columns}
              dataSource={jugadores}
              rowKey="usuarioId"
              loading={loading}
              pagination={false}
              size="middle"
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      hayFiltrosActivos
                        ? 'No se encontraron jugadores con los filtros aplicados'
                        : 'No hay jugadores registrados en campeonatos'
                    }
                  >
                    {hayFiltrosActivos && (
                      <Button onClick={limpiarFiltros}>
                        Limpiar filtros
                      </Button>
                    )}
                  </Empty>
                )
              }}
            />

            {/* Paginación */}
            {jugadores.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total) => `Total: ${total} jugadores`}
                  pageSizeOptions={['10', '20', '50']}
                />
              </div>
            )}
          </Card>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}