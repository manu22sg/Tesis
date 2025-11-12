// src/pages/DetalleCampeonatoPublico.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Space,
  Empty,
  Spin,
  Avatar,
  Badge,
  Descriptions,
  Button,
  Breadcrumb,
  ConfigProvider,
  Row,
  Col,
  Statistic
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  ArrowLeftOutlined,
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  FireOutlined,
  UserOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { campeonatoService } from '../services/campeonato.services.js';
import { equipoService } from '../services/equipo.services.js';
import * as estadisticaService from '../services/estadisticaCampeonato.services.js';
import MainLayout from '../components/MainLayout.jsx';
import { formatearFecha, formatearRangoHoras } from '../utils/formatters.js';

export default function DetalleCampeonatoPublico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campeonato, setCampeonato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [todosLosJugadores, setTodosLosJugadores] = useState([]);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);

  useEffect(() => {
    cargarCampeonato();
    cargarEquiposYJugadores();
  }, [id]);

  const cargarCampeonato = async () => {
    setLoading(true);
    try {
      const data = await campeonatoService.obtener(id);
      setCampeonato(data);
    } catch (error) {
      console.error('Error cargando campeonato:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEquiposYJugadores = async () => {
    try {
      const lista = await equipoService.listarPorCampeonato(id);
      const equiposData = Array.isArray(lista) ? lista : [];
      setEquipos(equiposData);

      if (equiposData.length > 0) {
        const promesas = equiposData.map(async (eq) => {
          const jugadores = await equipoService.listarJugadores(eq.id);
          return (jugadores || []).map((j) => ({
            id: j.id,
            usuario: { nombre: j.nombre ?? j.usuario?.nombre ?? '', apellido: '' },
            equipo: { id: eq.id, nombre: eq.nombre },
          }));
        });
        const result = await Promise.all(promesas);
        setTodosLosJugadores(result.flat());
        
        // Cargar estadísticas después de tener los jugadores
        await cargarEstadisticas(result.flat());
      }
    } catch (error) {
      console.error('Error cargando equipos y jugadores:', error);
    }
  };

  const cargarEstadisticas = async (jugadores) => {
    setLoadingEstadisticas(true);
    try {
      const data = await estadisticaService.listarEstadisticas({});
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      
      const enriched = items.map((est) => {
        const jugador = jugadores.find((j) => j.id === est.jugadorCampeonatoId);
        return {
          ...est,
          jugadorNombre:
            (jugador
              ? `${jugador.usuario?.nombre || ''} ${jugador.usuario?.apellido || ''}`.trim()
              : '') || 'Desconocido',
          equipoNombre: jugador?.equipo?.nombre || 'Sin equipo',
        };
      });
      
      setEstadisticas(enriched);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  // Calcular rankings de estadísticas
  const goleadores = useMemo(() => {
    if (!estadisticas.length) return [];
    
    // Agrupar goles por jugador
    const golesMap = {};
    estadisticas.forEach(est => {
      const key = est.jugadorCampeonatoId;
      if (!golesMap[key]) {
        golesMap[key] = {
          jugadorId: key,
          nombre: est.jugadorNombre,
          equipo: est.equipoNombre,
          goles: 0
        };
      }
      golesMap[key].goles += (est.goles || 0);
    });

    return Object.values(golesMap)
      .filter(j => j.goles > 0)
      .sort((a, b) => b.goles - a.goles)
      .slice(0, 10);
  }, [estadisticas]);

  const asistidores = useMemo(() => {
    if (!estadisticas.length) return [];
    
    const asistMap = {};
    estadisticas.forEach(est => {
      const key = est.jugadorCampeonatoId;
      if (!asistMap[key]) {
        asistMap[key] = {
          jugadorId: key,
          nombre: est.jugadorNombre,
          equipo: est.equipoNombre,
          asistencias: 0
        };
      }
      asistMap[key].asistencias += (est.asistencias || 0);
    });

    return Object.values(asistMap)
      .filter(j => j.asistencias > 0)
      .sort((a, b) => b.asistencias - a.asistencias)
      .slice(0, 10);
  }, [estadisticas]);

  const tarjetasRojas = useMemo(() => {
    if (!estadisticas.length) return [];
    
    const tarjetasMap = {};
    estadisticas.forEach(est => {
      const key = est.jugadorCampeonatoId;
      if (!tarjetasMap[key]) {
        tarjetasMap[key] = {
          jugadorId: key,
          nombre: est.jugadorNombre,
          equipo: est.equipoNombre,
          amarillas: 0,
          rojas: 0
        };
      }
      tarjetasMap[key].amarillas += (est.tarjetasAmarillas || 0);
      tarjetasMap[key].rojas += (est.tarjetasRojas || 0);
    });

    return Object.values(tarjetasMap)
      .filter(j => j.rojas > 0 || j.amarillas > 0)
      .sort((a, b) => (b.rojas * 2 + b.amarillas) - (a.rojas * 2 + a.amarillas))
      .slice(0, 10);
  }, [estadisticas]);

  // Calcular tabla de posiciones
  const tablaCalculada = useMemo(() => {
    if (!campeonato?.equipos || !campeonato?.partidos) return [];

    const partidosFinalizados = campeonato.partidos.filter(p => p.estado === 'finalizado');

    const estadisticas = campeonato.equipos.map(equipo => {
      const stats = {
        id: equipo.id,
        nombre: equipo.nombre,
        carrera: equipo.carrera,
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

    return estadisticas.sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia;
      return b.golesFavor - a.golesFavor;
    });
  }, [campeonato]);

  // Agrupar partidos por ronda
  const partidosPorRonda = useMemo(() => {
    if (!campeonato?.partidos) return {};
    
    const grupos = {};
    campeonato.partidos.forEach(partido => {
      if (!grupos[partido.ronda]) {
        grupos[partido.ronda] = [];
      }
      grupos[partido.ronda].push(partido);
    });

    return grupos;
  }, [campeonato]);

  const getRondaNombre = (ronda) => {
    const nombres = {
      final: 'Final',
      semifinal: 'Semifinal',
      cuartos: 'Cuartos de Final',
      octavos: 'Octavos de Final'
    };
    return nombres[ronda] || ronda.replace('_', ' ').toUpperCase();
  };

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'default',
      programado: 'blue',
      en_curso: 'processing',
      en_juego: 'orange',
      finalizado: 'success',
      cancelado: 'error'
    };
    return colors[estado] || 'default';
  };

  const getEstadoText = (estado) => {
    const texts = {
      pendiente: 'Pendiente',
      programado: 'Programado',
      en_curso: 'En Curso',
      en_juego: 'En Juego',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado'
    };
    return texts[estado] || estado;
  };

  // Columnas para tabla de posiciones
  const columnasTabla = [
    {
      title: '#',
      key: 'posicion',
      width: 60,
      align: 'center',
      render: (_, __, index) => (
        <Avatar
          size={40}
          style={{
            backgroundColor: index < 3 ? '#faad14' : '#e0e0e0',
            color: index < 3 ? '#fff' : '#000',
            fontWeight: 'bold'
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
      render: (nombre, record) => (
        <Space direction="vertical" size={0}>
          <strong>{nombre}</strong>
          <span style={{ fontSize: 12, color: '#666' }}>{record.carrera}</span>
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
      align: 'center'
    },
    {
      title: 'PE',
      dataIndex: 'empatados',
      key: 'empatados',
      width: 70,
      align: 'center'
    },
    {
      title: 'PP',
      dataIndex: 'perdidos',
      key: 'perdidos',
      width: 70,
      align: 'center'
    },
    {
      title: 'GF',
      dataIndex: 'golesFavor',
      key: 'golesFavor',
      width: 70,
      align: 'center'
    },
    {
      title: 'GC',
      dataIndex: 'golesContra',
      key: 'golesContra',
      width: 70,
      align: 'center'
    },
    {
      title: 'DIF',
      dataIndex: 'diferencia',
      key: 'diferencia',
      width: 80,
      align: 'center',
      render: (diff) => (
        <span style={{ color: diff > 0 ? '#52c41a' : diff < 0 ? '#ff4d4f' : '#666' }}>
          {diff > 0 ? `+${diff}` : diff}
        </span>
      )
    },
    {
      title: 'PTS',
      dataIndex: 'puntos',
      key: 'puntos',
      width: 90,
      align: 'center',
      render: (pts) => <strong style={{ fontSize: 16 }}>{pts}</strong>
    }
  ];

  // Columnas para fixture
  const columnasFixture = [
    {
      title: 'Equipo A',
      key: 'equipoA',
      render: (_, record) => {
        const equipo = campeonato?.equipos?.find(e => e.id === record.equipoAId);
        return (
          <Space>
            <TeamOutlined style={{ color: '#1890ff' }} />
            <strong>{equipo?.nombre || 'Equipo A'}</strong>
          </Space>
        );
      }
    },
    {
      title: 'Resultado',
      key: 'resultado',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <div>
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>
            {record.golesA ?? '-'} - {record.golesB ?? '-'}
          </span>
          {record.definidoPorPenales && (
            <div style={{ fontSize: 12, color: '#faad14' }}>
              Penales: {record.penalesA} - {record.penalesB}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Equipo B',
      key: 'equipoB',
      render: (_, record) => {
        const equipo = campeonato?.equipos?.find(e => e.id === record.equipoBId);
        return (
          <Space>
            <TeamOutlined style={{ color: '#52c41a' }} />
            <strong>{equipo?.nombre || 'Equipo B'}</strong>
          </Space>
        );
      }
    },
    {
      title: 'Fecha/Hora',
      key: 'fechaHora',
      width: 160,
      render: (_, record) => {
        if (!record.fecha) return <Tag>Por programar</Tag>;
        return (
          <Space direction="vertical" size={0}>
            <span>{formatearFecha(record.fecha)}</span>
            {record.horaInicio && (
              <span style={{ fontSize: 12, color: '#999' }}>
                {formatearRangoHoras(record.horaInicio, record.horaFin || '')}
              </span>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 120,
      align: 'center',
      render: (estado) => (
        <Tag color={getEstadoColor(estado)}>
          {getEstadoText(estado)}
        </Tag>
      )
    }
  ];

  if (loading) {
    return (
      <MainLayout>
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="Cargando..." />
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (!campeonato) {
    return (
      <MainLayout>
        <Card>
          <Empty description="Campeonato no encontrado" />
        </Card>
      </MainLayout>
    );
  }

  const rondasOrdenadas = Object.keys(partidosPorRonda).sort((a, b) => {
    const orden = { final: 1, semifinal: 2, cuartos: 3, octavos: 4 };
    return (orden[a] || 99) - (orden[b] || 99);
  });

  const breadcrumb = (
    <Breadcrumb
      items={[
        { title: <a onClick={() => navigate('/campeonatos/publico')}>Campeonatos</a> },
        { title: campeonato.nombre }
      ]}
    />
  );

  const tabItems = [
    {
      key: 'tabla',
      label: (
        <Space>
          <BarChartOutlined />
          Tabla de Posiciones
        </Space>
      ),
      children: (
        <Card>
          {tablaCalculada.length > 0 ? (
            <Table
              columns={columnasTabla}
              dataSource={tablaCalculada}
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={{ x: 800 }}
            />
          ) : (
            <Empty
              description="No hay datos disponibles"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      )
    },
    {
      key: 'fixture',
      label: (
        <Space>
          <CalendarOutlined />
          Fixture
        </Space>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {rondasOrdenadas.length > 0 ? (
            rondasOrdenadas.map(ronda => (
              <Card
                key={ronda}
                title={
                  <Space>
                    <FireOutlined style={{ color: '#ff4d4f' }} />
                    {getRondaNombre(ronda)}
                    <Tag>{partidosPorRonda[ronda].length} partidos</Tag>
                  </Space>
                }
              >
                <Table
                  columns={columnasFixture}
                  dataSource={partidosPorRonda[ronda]}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 800 }}
                />
              </Card>
            ))
          ) : (
            <Card>
              <Empty description="No hay partidos programados" />
            </Card>
          )}
        </Space>
      )
    },
    {
      key: 'estadisticas',
      label: (
        <Space>
          <ThunderboltOutlined />
          Estadísticas
        </Space>
      ),
      children: (
        <Spin spinning={loadingEstadisticas}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Goleadores */}
            <Card
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  <span>Tabla de Goleadores</span>
                </Space>
              }
            >
              {goleadores.length > 0 ? (
                <Table
                  dataSource={goleadores}
                  rowKey="jugadorId"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '#',
                      key: 'posicion',
                      width: 60,
                      align: 'center',
                      render: (_, __, index) => (
                        <Avatar
                          size={32}
                          style={{
                            backgroundColor: index < 3 ? '#faad14' : '#e0e0e0',
                            color: index < 3 ? '#fff' : '#000',
                            fontWeight: 'bold'
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      )
                    },
                    {
                      title: 'Jugador',
                      dataIndex: 'nombre',
                      key: 'nombre',
                      render: (nombre, record) => (
                        <Space direction="vertical" size={0}>
                          <strong>{nombre}</strong>
                          <span style={{ fontSize: 12, color: '#666' }}>{record.equipo}</span>
                        </Space>
                      )
                    },
                    {
                      title: 'Goles',
                      dataIndex: 'goles',
                      key: 'goles',
                      align: 'center',
                      width: 100,
                      render: (goles) => (
                        <span style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                          ⚽ {goles}
                        </span>
                      )
                    }
                  ]}
                />
              ) : (
                <Empty description="No hay goles registrados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            {/* Asistidores */}
            <Card
              title={
                <Space>
                  <FireOutlined style={{ color: '#1890ff' }} />
                  <span>Mejores Asistidores</span>
                </Space>
              }
            >
              {asistidores.length > 0 ? (
                <Table
                  dataSource={asistidores}
                  rowKey="jugadorId"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '#',
                      key: 'posicion',
                      width: 60,
                      align: 'center',
                      render: (_, __, index) => (
                        <Avatar size={32} style={{ backgroundColor: '#1890ff', color: '#fff' }}>
                          {index + 1}
                        </Avatar>
                      )
                    },
                    {
                      title: 'Jugador',
                      dataIndex: 'nombre',
                      key: 'nombre',
                      render: (nombre, record) => (
                        <Space direction="vertical" size={0}>
                          <strong>{nombre}</strong>
                          <span style={{ fontSize: 12, color: '#666' }}>{record.equipo}</span>
                        </Space>
                      )
                    },
                    {
                      title: 'Asistencias',
                      dataIndex: 'asistencias',
                      key: 'asistencias',
                      align: 'center',
                      width: 120,
                      render: (asist) => (
                        <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                          🎯 {asist}
                        </span>
                      )
                    }
                  ]}
                />
              ) : (
                <Empty description="No hay asistencias registradas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            {/* Tarjetas */}
            <Card
              title={
                <Space>
                  <FireOutlined style={{ color: '#ff4d4f' }} />
                  <span>Disciplina</span>
                </Space>
              }
            >
              {tarjetasRojas.length > 0 ? (
                <Table
                  dataSource={tarjetasRojas}
                  rowKey="jugadorId"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Jugador',
                      dataIndex: 'nombre',
                      key: 'nombre',
                      render: (nombre, record) => (
                        <Space direction="vertical" size={0}>
                          <strong>{nombre}</strong>
                          <span style={{ fontSize: 12, color: '#666' }}>{record.equipo}</span>
                        </Space>
                      )
                    },
                    {
                      title: 'Amarillas',
                      dataIndex: 'amarillas',
                      key: 'amarillas',
                      align: 'center',
                      width: 100,
                      render: (amarillas) => (
                        <span style={{ fontSize: 16 }}>🟨 {amarillas}</span>
                      )
                    },
                    {
                      title: 'Rojas',
                      dataIndex: 'rojas',
                      key: 'rojas',
                      align: 'center',
                      width: 100,
                      render: (rojas) => (
                        <span style={{ fontSize: 16 }}>🟥 {rojas}</span>
                      )
                    }
                  ]}
                />
              ) : (
                <Empty description="No hay tarjetas registradas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Space>
        </Spin>
      )
    },
    {
      key: 'equipos',
      label: (
        <Space>
          <TeamOutlined />
          Equipos
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]}>
          {campeonato.equipos?.length > 0 ? (
            campeonato.equipos.map(equipo => (
              <Col xs={24} sm={12} md={8} key={equipo.id}>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space>
                      <Avatar size={48} icon={<TeamOutlined />} style={{ backgroundColor: '#1890ff' }} />
                      <div>
                        <h4 style={{ margin: 0 }}>{equipo.nombre}</h4>
                        <span style={{ fontSize: 12, color: '#999' }}>{equipo.carrera}</span>
                      </div>
                    </Space>
                    
                    <div>
                      <Tag color="purple">{equipo.tipo}</Tag>
                    </div>

                    {equipo.jugadores && equipo.jugadores.length > 0 && (
                      <div>
                        <Badge
                          count={equipo.jugadores.length}
                          showZero
                          style={{ backgroundColor: '#52c41a' }}
                        >
                          <UserOutlined style={{ fontSize: 20 }} />
                        </Badge>
                        <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
                          jugadores
                        </span>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Card>
                <Empty description="No hay equipos inscritos" />
              </Card>
            </Col>
          )}
        </Row>
      )
    }
  ];

  return (
    <MainLayout breadcrumb={breadcrumb}>
      <ConfigProvider locale={locale}>
        <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/campeonatos/publico')}
            style={{ marginBottom: 16 }}
          >
            Volver
          </Button>

          {/* Header */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[24, 24]} align="middle">
              <Col flex="auto">
                <Space size="large">
                  <Avatar
                    size={64}
                    icon={<TrophyOutlined />}
                    style={{ backgroundColor: '#faad14' }}
                  />
                  <div>
                    <h2 style={{ margin: 0, fontSize: 28 }}>{campeonato.nombre}</h2>
                    <Space size="middle" style={{ marginTop: 8 }}>
                      <Tag color="purple">{campeonato.formato}</Tag>
                      <Tag color={
                        campeonato.genero === 'masculino' ? 'blue' :
                        campeonato.genero === 'femenino' ? 'pink' : 'orange'
                      }>
                        {campeonato.genero.charAt(0).toUpperCase() + campeonato.genero.slice(1)}
                      </Tag>
                      <Tag color={
                        campeonato.estado === 'en_juego' ? 'green' :
                        campeonato.estado === 'finalizado' ? 'gold' : 'blue'
                      }>
                        {campeonato.estado === 'en_juego' ? 'En Curso' :
                         campeonato.estado === 'finalizado' ? 'Finalizado' : 'Próximamente'}
                      </Tag>
                    </Space>
                  </div>
                </Space>
              </Col>
              <Col>
                <Space size="large">
                  <Statistic
                    title="Equipos"
                    value={campeonato.equipos?.length || 0}
                    prefix={<TeamOutlined />}
                  />
                  <Statistic
                    title="Partidos"
                    value={campeonato.partidos?.length || 0}
                    prefix={<CalendarOutlined />}
                  />
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Tabs */}
          <Card>
            <Tabs items={tabItems} defaultActiveKey="tabla" />
          </Card>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}