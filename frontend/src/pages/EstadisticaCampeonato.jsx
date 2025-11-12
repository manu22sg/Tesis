import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Tag,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Empty,
  Breadcrumb,
  Statistic,
  Input,
  Select,
  Alert,
  Pagination
} from 'antd';
import {
  DeleteOutlined,
  UserOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  ReloadOutlined,
  TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import * as estadisticaService from '../services/estadisticaCampeonato.services';
import { equipoService } from '../services/equipo.services';

const { Option } = Select;
const { Search } = Input;

function EstadisticasContent() {
  const { id: campeonatoId } = useParams();
  const navigate = useNavigate();
  
  const [estadisticas, setEstadisticas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [todosLosJugadores, setTodosLosJugadores] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filtros, setFiltros] = useState({
    busqueda: '',
    equipoId: null
  });

  // Cargar equipos del campeonato
  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        const response = await equipoService.listarPorCampeonato(campeonatoId);
        setEquipos(response || []);
      } catch (error) {
        console.error('Error cargando equipos:', error);
      }
    };
    cargarEquipos();
  }, [campeonatoId]);

  // Cargar todos los jugadores del campeonato
  useEffect(() => {
    const cargarJugadores = async () => {
      if (!equipos.length) return;
      
      try {
        const promesas = equipos.map(equipo => 
          estadisticaService.listarJugadoresPorEquipoYCampeonato(equipo.id, campeonatoId)
        );
        
        const resultados = await Promise.all(promesas);
        const todosJugadores = resultados.flat();
        setTodosLosJugadores(todosJugadores);
      } catch (error) {
        console.error('Error cargando jugadores:', error);
      }
    };
    
    cargarJugadores();
  }, [equipos, campeonatoId]);

  const cargarEstadisticas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await estadisticaService.listarEstadisticas({});
      
      // Enriquecer con información de jugadores y equipos
      const estadisticasEnriquecidas = await Promise.all(
        (data.items || []).map(async (est) => {
          try {
            // Obtener datos del jugador desde jugadorCampeonato
            const jugador = todosLosJugadores.find(j => j.id === est.jugadorCampeonatoId);
            
            return {
              ...est,
              jugadorNombre: jugador 
                ? `${jugador.usuario?.nombre || ''} ${jugador.usuario?.apellido || ''}`.trim()
                : 'Desconocido',
              equipoNombre: jugador?.equipo?.nombre || 'Sin equipo',
              partidoInfo: est.partido || {}
            };
          } catch {
            return {
              ...est,
              jugadorNombre: 'Desconocido',
              equipoNombre: 'Sin equipo',
              partidoInfo: {}
            };
          }
        })
      );
      
      setEstadisticas(estadisticasEnriquecidas);
      
    } catch (error) {
      message.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [todosLosJugadores]);

  useEffect(() => {
    if (todosLosJugadores.length > 0) {
      cargarEstadisticas();
    }
  }, [todosLosJugadores, cargarEstadisticas]);

  const handleEliminar = useCallback(async (id) => {
    try {
      await estadisticaService.eliminarEstadistica(id);
      message.success('Estadística eliminada correctamente');
      cargarEstadisticas();
    } catch (error) {
      message.error(typeof error === 'string' ? error : 'Error al eliminar estadística');
    }
  }, [cargarEstadisticas]);

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      equipoId: null
    });
  };

  // Filtrar estadísticas
  const estadisticasFiltradas = useMemo(() => {
    return estadisticas.filter(est => {
      const matchBusqueda = filtros.busqueda
        ? (est.jugadorNombre?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
           est.equipoNombre?.toLowerCase().includes(filtros.busqueda.toLowerCase()))
        : true;
      
      const matchEquipo = filtros.equipoId
        ? est.equipoNombre === equipos.find(e => e.id === filtros.equipoId)?.nombre
        : true;
      
      return matchBusqueda && matchEquipo;
    });
  }, [estadisticas, filtros, equipos]);

  // Calcular totales
  const totales = useMemo(() => {
    return estadisticasFiltradas.reduce((acc, est) => ({
      goles: acc.goles + (est.goles || 0),
      asistencias: acc.asistencias + (est.asistencias || 0),
      atajadas: acc.atajadas + (est.atajadas || 0),
      amarillas: acc.amarillas + (est.tarjetasAmarillas || 0),
      rojas: acc.rojas + (est.tarjetasRojas || 0),
      minutos: acc.minutos + (est.minutosJugados || 0)
    }), {
      goles: 0,
      asistencias: 0,
      atajadas: 0,
      amarillas: 0,
      rojas: 0,
      minutos: 0
    });
  }, [estadisticasFiltradas]);

  const columns = useMemo(() => [
    {
      title: 'Jugador',
      key: 'jugador',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <UserOutlined />
            <span><strong>{record.jugadorNombre || `ID ${record.jugadorCampeonatoId}`}</strong></span>
          </Space>
          <span style={{ fontSize: '12px', color: '#8c8c8c', marginLeft: 20 }}>
            {record.equipoNombre || 'Sin equipo'}
          </span>
        </Space>
      ),
      sorter: (a, b) => (a.jugadorNombre || '').localeCompare(b.jugadorNombre || ''),
    },
    {
      title: 'Partido',
      key: 'partido',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color="blue">
            {record.partidoInfo?.equipoA} vs {record.partidoInfo?.equipoB}
          </Tag>
          <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
            {record.partidoInfo?.ronda}
          </span>
        </Space>
      )
    },
    {
      title: '⚽ Goles',
      dataIndex: 'goles',
      key: 'goles',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.goles - b.goles,
      render: (goles) => (
        <Tag color={goles > 0 ? 'green' : 'default'}>
          <strong style={{ fontSize: '16px' }}>{goles}</strong>
        </Tag>
      )
    },
    {
      title: '🎯 Asist.',
      dataIndex: 'asistencias',
      key: 'asistencias',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.asistencias - b.asistencias,
      render: (asistencias) => (
        <Tag color={asistencias > 0 ? 'blue' : 'default'}>
          <strong style={{ fontSize: '16px' }}>{asistencias}</strong>
        </Tag>
      )
    },
    {
      title: '🧤 Ataj.',
      dataIndex: 'atajadas',
      key: 'atajadas',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.atajadas - b.atajadas,
      render: (atajadas) => (
        <Tag color={atajadas > 0 ? 'cyan' : 'default'}>
          <strong style={{ fontSize: '16px' }}>{atajadas}</strong>
        </Tag>
      )
    },
    {
      title: 'Tarjetas',
      key: 'tarjetas',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tag color="gold" style={{ fontSize: '14px' }}>
            🟨 {record.tarjetasAmarillas || 0}
          </Tag>
          <Tag color="red" style={{ fontSize: '14px' }}>
            🟥 {record.tarjetasRojas || 0}
          </Tag>
        </Space>
      )
    },
    {
      title: '⏱️ Minutos',
      dataIndex: 'minutosJugados',
      key: 'minutosJugados',
      width: 90,
      align: 'center',
      sorter: (a, b) => a.minutosJugados - b.minutosJugados,
      render: (minutos) => <strong>{minutos}'</strong>
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm
          title="¿Eliminar estadística?"
          description="Esta acción no se puede deshacer"
          onConfirm={() => handleEliminar(record.id)}
          okText="Eliminar"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Eliminar">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Popconfirm>
      )
    }
  ], [handleEliminar]);

  const hayFiltrosActivos = filtros.busqueda || filtros.equipoId;

  return (
    <>
      <Alert
        message="Las estadísticas se gestionan desde cada partido"
        description="Para agregar o editar estadísticas, ve a la sección de Partidos y usa el botón de estadísticas en cada partido."
        type="info"
        showIcon
        icon={<TrophyOutlined />}
        style={{ marginBottom: 16 }}
      />

      {/* Tarjetas de Estadísticas Generales */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="⚽ Total Goles"
              value={totales.goles}
              valueStyle={{ color: '#52c41a', fontSize: 28, fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="🎯 Asistencias"
              value={totales.asistencias}
              valueStyle={{ color: '#1890ff', fontSize: 28, fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="🧤 Atajadas"
              value={totales.atajadas}
              valueStyle={{ color: '#13c2c2', fontSize: 28, fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="🟨 T. Amarillas"
              value={totales.amarillas}
              valueStyle={{ color: '#faad14', fontSize: 28, fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="🟥 T. Rojas"
              value={totales.rojas}
              valueStyle={{ color: '#f5222d', fontSize: 28, fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="⏱️ Minutos"
              value={totales.minutos}
              suffix="'"
              valueStyle={{ color: '#722ed1', fontSize: 28, fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card
        title={<span><FilterOutlined /> Filtros</span>}
        style={{ marginBottom: 16 }}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={limpiarFiltros}
            disabled={!hayFiltrosActivos}
          >
            Limpiar
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12}>
            <Search
              placeholder="Buscar por jugador o equipo..."
              allowClear
              enterButton
              size="large"
              value={filtros.busqueda}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={12}>
            <Select
              placeholder="Filtrar por equipo"
              allowClear
              size="large"
              style={{ width: '100%' }}
              value={filtros.equipoId}
              onChange={(value) => setFiltros(prev => ({ ...prev, equipoId: value }))}
              suffixIcon={<TeamOutlined />}
            >
              {equipos.map(equipo => (
                <Option key={equipo.id} value={equipo.id}>
                  {equipo.nombre}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tabla Principal */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <span>Estadísticas del Campeonato</span>
            <Tag color="blue">{estadisticasFiltradas.length} registros</Tag>
            {hayFiltrosActivos && (
              <Tag color="orange">Filtrado</Tag>
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={estadisticasFiltradas}
          loading={loading}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1000 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  hayFiltrosActivos
                    ? 'No se encontraron resultados con los filtros aplicados'
                    : 'No hay estadísticas registradas'
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

        {/* Paginación personalizada */}
        {estadisticasFiltradas.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Pagination
              defaultCurrent={1}
              defaultPageSize={20}
              showSizeChanger
              showTotal={(total) => `Total: ${total} registros`}
              pageSizeOptions={['10', '20', '50', '100']}
              total={estadisticasFiltradas.length}
            />
          </div>
        )}
      </Card>
    </>
  );
}

// Componente wrapper con MainLayout
export default function EstadisticasCampeonato() {
  const { id } = useParams();
  const navigate = useNavigate();

  const breadcrumb = (
    <Breadcrumb
      items={[
        {
          title: <a onClick={() => navigate('/campeonatos')}>Campeonatos</a>
        },
        {
          title: <a onClick={() => navigate(`/campeonatos/${id}/info`)}>Detalle</a>
        },
        {
          title: 'Estadísticas'
        }
      ]}
    />
  );

  return (
    <MainLayout breadcrumb={breadcrumb}>
      <EstadisticasContent />
    </MainLayout>
  );
}