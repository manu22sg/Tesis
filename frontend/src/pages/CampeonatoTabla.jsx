import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Breadcrumb,
  Button,
  Space,
  message,
  Spin,
  Table,
  Tag,
  Avatar,
  Row,
  Col,
  Statistic,
  Empty,
  Tooltip
} from 'antd';
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  TrophyOutlined,
  TeamOutlined,
  FireOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SwapOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import MainLayout, { useCampeonatoActivo } from '../components/MainLayout';
import { campeonatoService } from '../services/campeonato.services';

// Componente interno que usa el hook
function CampeonatoTablaContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCampeonatoActivo } = useCampeonatoActivo();
  
  const [campeonato, setCampeonato] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarCampeonato();
  }, [id]);

  const cargarCampeonato = async () => {
    setLoading(true);
    try {
      const data = await campeonatoService.obtener(id);
      setCampeonato(data);
      
      // Actualizar el campeonato activo en el sidebar
      setCampeonatoActivo({
        id: data.id,
        nombre: data.nombre
      });
    } catch (error) {
      message.error('Error al cargar información del campeonato');
      navigate('/campeonatos');
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas de cada equipo
  const tablaCalculada = useMemo(() => {
    if (!campeonato?.equipos || !campeonato?.partidos) return [];

    const partidosFinalizados = campeonato.partidos.filter(p => p.estado === 'finalizado');

    const estadisticas = campeonato.equipos.map(equipo => {
      const stats = {
        id: equipo.id,
        nombre: equipo.nombre,
        carrera: equipo.carrera,
        tipo: equipo.tipo,
        jugados: 0,
        ganados: 0,
        empatados: 0,
        perdidos: 0,
        golesFavor: 0,
        golesContra: 0,
        diferencia: 0,
        puntos: 0
      };

      partidosFinalizados.forEach(partido => {
        const esEquipoA = partido.equipoAId === equipo.id;
        const esEquipoB = partido.equipoBId === equipo.id;

        if (!esEquipoA && !esEquipoB) return;

        stats.jugados++;

        const golesPropios = esEquipoA ? partido.golesA : partido.golesB;
        const golesRival = esEquipoA ? partido.golesB : partido.golesA;

        stats.golesFavor += golesPropios;
        stats.golesContra += golesRival;

        if (golesPropios > golesRival) {
          stats.ganados++;
          stats.puntos += 3;
        } else if (golesPropios === golesRival) {
          stats.empatados++;
          stats.puntos += 1;
        } else {
          stats.perdidos++;
        }
      });

      stats.diferencia = stats.golesFavor - stats.golesContra;

      return stats;
    });

    // Ordenar por puntos, diferencia de gol, goles a favor
    return estadisticas.sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia;
      return b.golesFavor - a.golesFavor;
    });
  }, [campeonato]);

  // Calcular estadísticas generales
  const estadisticasGenerales = useMemo(() => {
    if (!campeonato?.partidos) return { total: 0, finalizados: 0, pendientes: 0, totalGoles: 0 };

    const partidos = campeonato.partidos;
    const finalizados = partidos.filter(p => p.estado === 'finalizado');
    const totalGoles = finalizados.reduce((sum, p) => sum + (p.golesA || 0) + (p.golesB || 0), 0);

    return {
      total: partidos.length,
      finalizados: finalizados.length,
      pendientes: partidos.filter(p => p.estado === 'pendiente').length,
      totalGoles
    };
  }, [campeonato]);

  const getPosicionColor = (posicion) => {
    if (posicion === 1) return '#ffd700'; // Oro
    if (posicion === 2) return '#c0c0c0'; // Plata
    if (posicion === 3) return '#cd7f32'; // Bronce
    return '#f0f0f0';
  };

  const columns = [
    {
      title: '#',
      key: 'posicion',
      width: 60,
      align: 'center',
      fixed: 'left',
      render: (_, __, index) => (
        <Avatar
          size={40}
          style={{
            backgroundColor: getPosicionColor(index + 1),
            color: index < 3 ? '#fff' : '#000',
            fontWeight: 'bold',
            fontSize: 18
          }}
        >
          {index + 1}
        </Avatar>
      )
    },
    {
      title: 'Equipo',
      dataIndex: 'nombre',
      key: 'nombre',
      fixed: 'left',
      width: 250,
      render: (nombre, record) => (
        <Space direction="vertical" size={0}>
          <strong style={{ fontSize: 16 }}>{nombre}</strong>
          <span style={{ fontSize: 12, color: '#666' }}>
            <Tag color="purple" size="small">{record.carrera}</Tag>
          </span>
        </Space>
      )
    },
    {
      title: 'PJ',
      dataIndex: 'jugados',
      key: 'jugados',
      width: 70,
      align: 'center'
    },
    {
      title: 'PG',
      dataIndex: 'ganados',
      key: 'ganados',
      width: 70,
      align: 'center',
      render: (ganados) => (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          {ganados}
        </Tag>
      )
    },
    {
      title: 'PE',
      dataIndex: 'empatados',
      key: 'empatados',
      width: 70,
      align: 'center',
      render: (empatados) => (
        <Tag color="orange" icon={<SwapOutlined />}>
          {empatados}
        </Tag>
      )
    },
    {
      title: 'PP',
      dataIndex: 'perdidos',
      key: 'perdidos',
      width: 70,
      align: 'center',
      render: (perdidos) => (
        <Tag color="red" icon={<CloseCircleOutlined />}>
          {perdidos}
        </Tag>
      )
    },
    {
      title: 'GF',
      dataIndex: 'golesFavor',
      key: 'golesFavor',
      width: 70,
      align: 'center',
      render: (gf) => <strong style={{ color: '#52c41a' }}>{gf}</strong>
    },
    {
      title: 'GC',
      dataIndex: 'golesContra',
      key: 'golesContra',
      width: 70,
      align: 'center',
      render: (gc) => <strong style={{ color: '#ff4d4f' }}>{gc}</strong>
    },
    {
      title: 'DIF',
      dataIndex: 'diferencia',
      key: 'diferencia',
      width: 80,
      align: 'center',
      render: (diferencia) => (
        <Tooltip title="Diferencia de goles">
          <Tag
            color={diferencia > 0 ? 'green' : diferencia < 0 ? 'red' : 'default'}
            icon={diferencia > 0 ? <RiseOutlined /> : diferencia < 0 ? <FallOutlined /> : null}
          >
            {diferencia > 0 ? '+' : ''}{diferencia}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: 'PTS',
      dataIndex: 'puntos',
      key: 'puntos',
      width: 90,
      align: 'center',
      fixed: 'right',
      render: (puntos) => (
        <Tag color="blue" style={{ fontSize: 16, fontWeight: 'bold', padding: '4px 12px' }}>
          {puntos}
        </Tag>
      )
    }
  ];

  if (!campeonato) {
    return (
      <Card>
        <Spin tip="Cargando..." />
      </Card>
    );
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/campeonatos/${id}/info`)}
            >
              Volver
            </Button>
            <BarChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <div>
              <h2 style={{ margin: 0 }}>Tabla de Posiciones - {campeonato.nombre}</h2>
              <span style={{ color: '#666' }}>Clasificación actualizada del campeonato</span>
            </div>
          </Space>
        </Space>
      </Card>

     

      {/* Tabla de Posiciones */}
      <Card
        title={
          <Space>
            <TrophyOutlined style={{ fontSize: 20, color: '#faad14' }} />
            <span style={{ fontSize: 18 }}>Tabla de Posiciones</span>
          </Space>
        }
      >
        {tablaCalculada.length > 0 ? (
          <>
            <Table
              columns={columns}
              dataSource={tablaCalculada}
              loading={loading}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1000 }}
              size="middle"
              rowClassName={(record, index) => {
                if (index === 0) return 'campeon-row';
                if (index === 1) return 'subcampeon-row';
                if (index === 2) return 'tercer-lugar-row';
                return '';
              }}
            />

            <div style={{ marginTop: 24, padding: 16, backgroundColor: '#fafafa', borderRadius: 8 }}>
              <h4>Leyenda:</h4>
              <Space direction="vertical" size="small">
                <span><strong>PJ:</strong> Partidos Jugados</span>
                <span><strong>PG:</strong> Partidos Ganados</span>
                <span><strong>PE:</strong> Partidos Empatados</span>
                <span><strong>PP:</strong> Partidos Perdidos</span>
                <span><strong>GF:</strong> Goles a Favor</span>
                <span><strong>GC:</strong> Goles en Contra</span>
                <span><strong>DIF:</strong> Diferencia de Goles</span>
                <span><strong>PTS:</strong> Puntos (Victoria = 3, Empate = 1, Derrota = 0)</span>
              </Space>
            </div>

            <style>{`
              .campeon-row {
                background-color: #fffbe6 !important;
              }
              .subcampeon-row {
                background-color: #f0f5ff !important;
              }
              .tercer-lugar-row {
                background-color: #fff7e6 !important;
              }
            `}</style>
          </>
        ) : (
          <Empty
            description="No hay datos disponibles"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {campeonato.estado === 'creado' && (
              <p style={{ color: '#666' }}>
                La tabla se actualizará cuando se jueguen partidos
              </p>
            )}
          </Empty>
        )}
      </Card>
    </>
  );
}

// Componente wrapper con MainLayout
export default function CampeonatoTabla() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campeonato, setCampeonato] = useState(null);

  useEffect(() => {
    const cargarNombre = async () => {
      try {
        const data = await campeonatoService.obtener(id);
        setCampeonato(data);
      } catch (error) {
        // Silencioso
      }
    };
    cargarNombre();
  }, [id]);

  const breadcrumb = (
    <Breadcrumb
      items={[
        {
          title: <a onClick={() => navigate('/campeonatos')}>Campeonatos</a>
        },
        {
          title: <a onClick={() => navigate(`/campeonatos/${id}/info`)}>{campeonato?.nombre || 'Cargando...'}</a>
        },
        {
          title: 'Tabla de Posiciones'
        }
      ]}
    />
  );

  return (
    <MainLayout breadcrumb={breadcrumb}>
      <CampeonatoTablaContent />
    </MainLayout>
  );
}