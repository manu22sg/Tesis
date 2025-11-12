// src/pages/CampeonatosPublico.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Empty,
  Spin,
  Select,
  Badge,
  Statistic,
  Divider,
  ConfigProvider
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  FireOutlined,
  EyeOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { campeonatoService } from '../services/campeonato.services.js';
import MainLayout from '../components/MainLayout.jsx';

const { Option } = Select;

export default function CampeonatosPublico() {
  const navigate = useNavigate();
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatosOriginales, setCampeonatosOriginales] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    formato: null,
    genero: null,
    anio: null,
    semestre: null,
    estado: null
  });

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  const cargarCampeonatos = async () => {
    setLoading(true);
    try {
      const data = await campeonatoService.listar();
      setCampeonatos(data);
      setCampeonatosOriginales(data);
    } catch (error) {
      console.error('Error cargando campeonatos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let resultado = [...campeonatosOriginales];

    if (filtros.formato) {
      resultado = resultado.filter(c => c.formato === filtros.formato);
    }
    if (filtros.genero) {
      resultado = resultado.filter(c => c.genero === filtros.genero);
    }
    if (filtros.anio) {
      resultado = resultado.filter(c => c.anio === filtros.anio);
    }
    if (filtros.semestre) {
      resultado = resultado.filter(c => c.semestre === filtros.semestre);
    }
    if (filtros.estado) {
      resultado = resultado.filter(c => c.estado === filtros.estado);
    }

    setCampeonatos(resultado);
  }, [filtros, campeonatosOriginales]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      formato: null,
      genero: null,
      anio: null,
      semestre: null,
      estado: null
    });
  };

  // Años disponibles
  const aniosDisponibles = useMemo(() => {
    const anios = [...new Set(campeonatosOriginales.map(c => c.anio))];
    return anios.sort((a, b) => b - a);
  }, [campeonatosOriginales]);

  const getEstadoConfig = (estado) => {
    const config = {
      creado: { color: 'blue', text: 'Próximamente' },
      en_juego: { color: 'green', text: 'En Curso' },
      finalizado: { color: 'gold', text: 'Finalizado' },
      cancelado: { color: 'red', text: 'Cancelado' }
    };
    return config[estado] || { color: 'default', text: estado };
  };

  const hayFiltrosActivos = Object.values(filtros).some(v => v !== null);

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          {/* Header */}
          <Card
            style={{ marginBottom: 24 }}
            bodyStyle={{ padding: '24px 32px' }}
          >
            <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24 }}>Campeonatos Universitarios</h2>
                  <p style={{ margin: 0, color: '#666' }}>
                    Explora los campeonatos y sigue los resultados
                  </p>
                </div>
              </Space>
              <Statistic
                title="Campeonatos Activos"
                value={campeonatos.filter(c => c.estado === 'en_juego').length}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Space>
          </Card>

          {/* Filtros */}
          <Card
            title={<Space><FilterOutlined /> Filtros</Space>}
            style={{ marginBottom: 24, backgroundColor: '#fafafa' }}
            extra={
              <Button onClick={limpiarFiltros} disabled={!hayFiltrosActivos}>
                Limpiar Filtros
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Formato"
                  allowClear
                  value={filtros.formato}
                  onChange={(value) => handleFiltroChange('formato', value)}
                >
                  <Option value="5v5">5v5</Option>
                  <Option value="7v7">7v7</Option>
                  <Option value="11v11">11v11</Option>
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Género"
                  allowClear
                  value={filtros.genero}
                  onChange={(value) => handleFiltroChange('genero', value)}
                >
                  <Option value="masculino">Masculino</Option>
                  <Option value="femenino">Femenino</Option>
                  <Option value="mixto">Mixto</Option>
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Año"
                  allowClear
                  value={filtros.anio}
                  onChange={(value) => handleFiltroChange('anio', value)}
                >
                  {aniosDisponibles.map(anio => (
                    <Option key={anio} value={anio}>{anio}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Semestre"
                  allowClear
                  value={filtros.semestre}
                  onChange={(value) => handleFiltroChange('semestre', value)}
                >
                  <Option value={1}>Semestre 1</Option>
                  <Option value={2}>Semestre 2</Option>
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Estado"
                  allowClear
                  value={filtros.estado}
                  onChange={(value) => handleFiltroChange('estado', value)}
                >
                  <Option value="creado">Próximamente</Option>
                  <Option value="en_juego">En Curso</Option>
                  <Option value="finalizado">Finalizado</Option>
                </Select>
              </Col>
            </Row>
          </Card>

          {/* Grid de Campeonatos */}
          {loading ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" tip="Cargando campeonatos..." />
              </div>
            </Card>
          ) : campeonatos.length > 0 ? (
            <Row gutter={[24, 24]}>
              {campeonatos.map(campeonato => {
                const estadoConfig = getEstadoConfig(campeonato.estado);
                const cantidadEquipos = campeonato.equipos?.length || 0;
                const cantidadPartidos = campeonato.partidos?.length || 0;
                const partidosFinalizados = campeonato.partidos?.filter(p => p.estado === 'finalizado').length || 0;

                return (
                  <Col xs={24} sm={12} lg={8} key={campeonato.id}>
                    <Card
                      hoverable
                      style={{
                        height: '100%',
                        borderRadius: 8,
                        overflow: 'hidden'
                      }}
                      bodyStyle={{ padding: 0 }}
                    >
                      {/* Header del card */}
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          padding: '24px',
                          color: 'white'
                        }}
                      >
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <TrophyOutlined style={{ fontSize: 32 }} />
                          <Tag color={estadoConfig.color} style={{ fontSize: 12 }}>
                            {estadoConfig.text}
                          </Tag>
                        </Space>
                        <h3 style={{ color: 'white', marginTop: 12, marginBottom: 0 }}>
                          {campeonato.nombre}
                        </h3>
                      </div>

                      {/* Body del card */}
                      <div style={{ padding: '20px' }}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                          {/* Info básica */}
                          <Row gutter={16}>
                            <Col span={12}>
                              <Space direction="vertical" size={0}>
                                <span style={{ fontSize: 12, color: '#999' }}>Formato</span>
                                <Tag color="purple">{campeonato.formato}</Tag>
                              </Space>
                            </Col>
                            <Col span={12}>
                              <Space direction="vertical" size={0}>
                                <span style={{ fontSize: 12, color: '#999' }}>Género</span>
                                <Tag color={
                                  campeonato.genero === 'masculino' ? 'blue' :
                                  campeonato.genero === 'femenino' ? 'pink' : 'orange'
                                }>
                                  {campeonato.genero.charAt(0).toUpperCase() + campeonato.genero.slice(1)}
                                </Tag>
                              </Space>
                            </Col>
                          </Row>

                          <Divider style={{ margin: '8px 0' }} />

                          {/* Estadísticas */}
                          <Row gutter={16}>
                            <Col span={12}>
                              <Space>
                                <TeamOutlined style={{ color: '#1890ff' }} />
                                <div>
                                  <div style={{ fontSize: 20, fontWeight: 'bold' }}>{cantidadEquipos}</div>
                                  <div style={{ fontSize: 12, color: '#999' }}>Equipos</div>
                                </div>
                              </Space>
                            </Col>
                            <Col span={12}>
                              <Space>
                                <CalendarOutlined style={{ color: '#52c41a' }} />
                                <div>
                                  <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                                    {partidosFinalizados}/{cantidadPartidos}
                                  </div>
                                  <div style={{ fontSize: 12, color: '#999' }}>Partidos</div>
                                </div>
                              </Space>
                            </Col>
                          </Row>

                          <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                            {campeonato.anio} • Semestre {campeonato.semestre}
                          </div>

                          <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            block
                            onClick={() => navigate(`/campeonatos/${campeonato.id}/publico`)}
                          >
                            Ver Detalles
                          </Button>
                        </Space>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Card>
              <Empty
                description={
                  hayFiltrosActivos
                    ? 'No se encontraron campeonatos con los filtros aplicados'
                    : 'No hay campeonatos disponibles'
                }
              >
                {hayFiltrosActivos && (
                  <Button type="primary" onClick={limpiarFiltros}>
                    Limpiar Filtros
                  </Button>
                )}
              </Empty>
            </Card>
          )}
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}