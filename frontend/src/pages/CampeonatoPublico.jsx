// src/pages/CampeonatosPublico.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Row, Col, Tag, Button, Space, Empty, Spin, Select,
  Statistic, Divider, ConfigProvider
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  TrophyOutlined, TeamOutlined, CalendarOutlined,
  FireOutlined, EyeOutlined, FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { campeonatoService } from '../services/campeonato.services.js';
import MainLayout from '../components/MainLayout.jsx';

const { Option } = Select;

export default function CampeonatosPublico() {
  const navigate = useNavigate();
  const [campeonatosOriginales, setCampeonatosOriginales] = useState([]);
  const [loading, setLoading] = useState(false);

  // ⭐ FILTROS – INCLUYE POR DEFECTO SOLO “creado” & “en_juego”
  const [filtros, setFiltros] = useState({
    formato: null,
    genero: null,
    anio: null,
    semestre: null,
    estado: ['creado', 'en_juego']
  });

  // === CARGAR CAMPEONATOS ===
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const data = await campeonatoService.listar();
        setCampeonatosOriginales(data || []);
      } catch (error) {
        console.error('Error cargando campeonatos:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // === CALCULAR FILTRADOS SIN TOCAR ESTADO ===
  const campeonatosFiltrados = useMemo(() => {
    let res = [...campeonatosOriginales];

    // estado es array (creado / en_juego)
    if (filtros.estado?.length > 0) {
      res = res.filter(c => filtros.estado.includes(c.estado));
    }

    if (filtros.formato) res = res.filter(c => c.formato === filtros.formato);
    if (filtros.genero) res = res.filter(c => c.genero === filtros.genero);
    if (filtros.anio) res = res.filter(c => c.anio === filtros.anio);
    if (filtros.semestre) res = res.filter(c => c.semestre === filtros.semestre);

    return res;
  }, [filtros, campeonatosOriginales]);

  const limpiarFiltros = () => {
    setFiltros({
      formato: null,
      genero: null,
      anio: null,
      semestre: null,
      estado: ['creado', 'en_juego']
    });
  };

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
        <div style={{ padding: 24, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
          
          {/* HEADER */}
          <Card style={{ marginBottom: 24 }} bodyStyle={{ padding: '24px 32px' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0 }}>Campeonatos Universitarios</h2>
                <p style={{ margin: 0, color: '#666' }}>
                  Explora los campeonatos activos y próximos
                </p>
              </div>
              <Statistic
                title="En Curso"
                value={campeonatosFiltrados.filter(c => c.estado === 'en_juego').length}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Space>
          </Card>

          {/* FILTROS */}
          <Card
            title={<Space><FilterOutlined /> Filtros</Space>}
            style={{ marginBottom: 24, backgroundColor: '#fafafa' }}
            extra={<Button onClick={limpiarFiltros} disabled={!hayFiltrosActivos}>Limpiar</Button>}
          >
            <Row gutter={[16, 16]}>
              
              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Formato"
                  value={filtros.formato}
                  onChange={v => setFiltros(p => ({ ...p, formato: v }))}
                >
                  <Option value="5v5">5v5</Option>
                  <Option value="7v7">7v7</Option>
                  <Option value="11v11">11v11</Option>
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Género"
                  value={filtros.genero}
                  onChange={v => setFiltros(p => ({ ...p, genero: v }))}
                >
                  <Option value="masculino">Masculino</Option>
                  <Option value="femenino">Femenino</Option>
                  <Option value="mixto">Mixto</Option>
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Año"
                  value={filtros.anio}
                  onChange={v => setFiltros(p => ({ ...p, anio: v }))}
                >
                  {aniosDisponibles.map(a => (
                    <Option key={a} value={a}>{a}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Semestre"
                  value={filtros.semestre}
                  onChange={v => setFiltros(p => ({ ...p, semestre: v }))}
                >
                  <Option value={1}>Semestre 1</Option>
                  <Option value={2}>Semestre 2</Option>
                </Select>
              </Col>

              {/* ⭐ ESTADO MULTISELECT (mostrando solo próximos/en curso por defecto) */}
              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Estado"
                  value={filtros.estado}
                  onChange={v => setFiltros(p => ({ ...p, estado: v }))}
                >
                  <Option value="creado">Próximamente</Option>
                  <Option value="en_juego">En Curso</Option>
                  <Option value="finalizado">Finalizado</Option>
                  <Option value="cancelado">Cancelado</Option>
                </Select>
              </Col>
            </Row>
          </Card>

          {/* RESULTADO */}
          {loading ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
              </div>
            </Card>
          ) : campeonatosFiltrados.length > 0 ? (
            <Row gutter={[24, 24]}>
              {campeonatosFiltrados.map(c => {
                const estadoConfig = getEstadoConfig(c.estado);
                const equiposCount = c.equipos?.length || 0;
                const totalPartidos = c.partidos?.length || 0;
                const finalizados = c.partidos?.filter(p => p.estado === 'finalizado').length || 0;

                return (
                  <Col xs={24} sm={12} lg={8} key={c.id}>
                    <Card
                      hoverable
                      bodyStyle={{ padding: 0 }}
                      style={{ borderRadius: 8 }}
                    >
                      {/* HEADER */}
                      <div style={{
                        padding: 24,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                      }}>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <TrophyOutlined style={{ fontSize: 32 }} />
                          <Tag color={estadoConfig.color}>{estadoConfig.text}</Tag>
                        </Space>
                        <h3 style={{ marginTop: 12 }}>{c.nombre}</h3>
                      </div>

                      {/* BODY */}
                      <div style={{ padding: 20 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                           <Row gutter={12}>

      {/* Formato */}
      <Col span={12}>
        <span style={{ color: '#999' }}>Formato</span>
        <Tag color="purple">
          {(c.formato || "").charAt(0).toUpperCase() + (c.formato || "").slice(1)}
        </Tag>
      </Col>

      {/* Género con colores dinámicos */}
      <Col span={12}>
        <span style={{ color: '#999' }}>Género </span>
        <Tag color={
          c.genero === "masculino" ? "blue" :
          c.genero === "femenino" ? "pink" : "orange"
        }>
          {(c.genero || "").charAt(0).toUpperCase() + (c.genero || "").slice(1)}
        </Tag>
      </Col>

    </Row>

                          <Divider />

                          <Row gutter={12}>
                            <Col span={12}>
                              <TeamOutlined style={{ color: '#1890ff' }} />
                              <strong style={{ marginLeft: 8 }}>{equiposCount}</strong> Equipos
                            </Col>
                            <Col span={12}>
                              <CalendarOutlined style={{ color: '#52c41a' }} />
                              <strong style={{ marginLeft: 8 }}>
                                {finalizados}/{totalPartidos}
                              </strong> Partidos
                            </Col>
                          </Row>

                          <div style={{ color: '#999' }}>
                            {c.anio} • Semestre {c.semestre}
                          </div>

                          <Button
                            type="primary"
                            block
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/campeonatos/${c.id}/publico`)}
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
              <Empty description="No hay campeonatos disponibles" />
            </Card>
          )}

        </div>
      </ConfigProvider>
    </MainLayout>
  );
}
