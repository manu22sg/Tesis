import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Collapse,
  Table,
  Statistic,
  Row,
  Col,
  Typography,
  message,
  Spin,
  ConfigProvider,
  Avatar,
  Divider,
  Empty
} from 'antd';
import {
  ArrowLeftOutlined,
  TrophyOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import locale from 'antd/locale/es_ES';
import MainLayout from '../components/MainLayout.jsx';
import { ojeadorService } from '../services/jugadorCampeonato.services.js';

const { Title, Text } = Typography;

export default function PerfilJugador() {
  const { usuarioId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState([]);

  useEffect(() => {
    cargarPerfil();
  }, [usuarioId]); // eslint-disable-line

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const data = await ojeadorService.obtenerPerfil(usuarioId);
      setPerfil(data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      message.error('Error al cargar el perfil del jugador');
    } finally {
      setLoading(false);
    }
  };

  const { usuario, totalesGenerales, promedios, historialCampeonatos } = perfil || {};

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          gap: 16
        }}>
          <Spin size="large" />
          <Text>Cargando perfil del jugador...</Text>
        </div>
      );
    }

    if (!perfil) {
      return (
        <div style={{ padding: 24 }}>
          <Card>
            <Text type="danger">No se pudo cargar el perfil del jugador</Text>
            <div style={{ marginTop: 16 }}>
              <Button onClick={() => navigate(-1)}>Volver</Button>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          Volver al Ojeador
        </Button>

        {/* Header con info básica */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Avatar 
              size={100} 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
            />
            <div style={{ flex: 1 }}>
              <Title level={2} style={{ margin: 0 }}>
                {usuario.nombre}
              </Title>
              <Space size="middle" style={{ marginTop: 8 }}>
                <Text type="secondary">RUT: {usuario.rut}</Text>
                <Divider type="vertical" />
                <Text type="secondary">{usuario.carreraNombre || 'Sin carrera'}</Text>
                <Divider type="vertical" />
                <Text type="secondary">{usuario.email}</Text>
              </Space>
            </div>
          </div>
        </Card>

        {/* Estadísticas Generales */}
        <Card
          title={
            <Space>
              <TrophyOutlined />
              <span>Resumen General</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <Card variant="borderless" style={{ background: '#f0f5ff' }}>
                <Statistic
                  title="Campeonatos"
                  value={totalesGenerales.campeonatos}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card variant="borderless" style={{ background: '#f6ffed' }}>
                <Statistic
                  title="Goles Totales"
                  value={totalesGenerales.goles}
                  prefix="⚽"
                  valueStyle={{ color: '#52c41a' }}
                  suffix={
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      ({promedios.golesPartido}/partido)
                    </Text>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card variant="borderless" style={{ background: '#f9f0ff' }}>
                <Statistic
                  title="Asistencias Totales"
                  value={totalesGenerales.asistencias}
                  prefix="🎯"
                  valueStyle={{ color: '#722ed1' }}
                  suffix={
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      ({promedios.asistenciasPartido}/partido)
                    </Text>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card variant="borderless" style={{ background: '#fff7e6' }}>
                <Statistic
                  title="Partidos Jugados"
                  value={totalesGenerales.partidosJugados}
                  prefix={<FieldTimeOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                  suffix={
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      ({promedios.minutosPartido}' prom.)
                    </Text>
                  }
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="🟨 Amarillas"
                value={totalesGenerales.tarjetasAmarillas}
                valueStyle={{ fontSize: 20 }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="🟥 Rojas"
                value={totalesGenerales.tarjetasRojas}
                valueStyle={{ fontSize: 20 }}
              />
            </Col>
            {totalesGenerales.atajadas > 0 && (
              <Col xs={12} sm={6}>
                <Statistic
                  title="🧤 Atajadas"
                  value={totalesGenerales.atajadas}
                  valueStyle={{ fontSize: 20 }}
                />
              </Col>
            )}
            <Col xs={12} sm={6}>
              <Statistic
                title="⏱️ Minutos Totales"
                value={totalesGenerales.minutosJugados}
                suffix="min"
                valueStyle={{ fontSize: 20 }}
              />
            </Col>
          </Row>
        </Card>

        {/* Historial por Campeonato */}
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>Historial por Campeonato</span>
            </Space>
          }
        >
          {historialCampeonatos.length === 0 ? (
            <Text type="secondary">No hay historial de campeonatos</Text>
          ) : (
            <Collapse 
              accordion
              activeKey={expandedKeys}
              onChange={setExpandedKeys}
              items={historialCampeonatos.map((campeonato, index) => ({
                key: index,
                label: (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <Space>
                      <TrophyOutlined style={{ color: '#1890ff' }} />
                      <Text strong>{campeonato.campeonatoNombre}</Text>
                      <Tag color="blue">
                        {campeonato.anio}-{campeonato.semestre}
                      </Tag>
                      <Tag>{campeonato.formato}</Tag>
                    </Space>
                    <Space size="middle">
                      <Tag color="green">⚽ {campeonato.estadisticas.goles}</Tag>
                      <Tag color="purple">🎯 {campeonato.estadisticas.asistencias}</Tag>
                      <Tag>🏟️ {campeonato.estadisticas.partidosJugados} partidos</Tag>
                    </Space>
                  </div>
                ),
                children: (
                  <>
                    {/* Info del equipo y posición */}
                    <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                      <Descriptions.Item label="Equipo">
                        <Space>
                          <TeamOutlined />
                          {campeonato.equipoNombre}
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Carrera">
                        {campeonato.equipoCarrera || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Posición">
                        {campeonato.posicion || 'No especificada'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Camiseta">
                        {campeonato.numeroCamiseta ? (
                          <Tag color="blue">#{campeonato.numeroCamiseta}</Tag>
                        ) : 'N/A'}
                      </Descriptions.Item>
                    </Descriptions>

                    {/* Estadísticas del campeonato */}
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={8}>
                        <Card size="small" variant="borderless" style={{ background: '#f6ffed', textAlign: 'center' }}>
                          <Statistic
                            title="Goles"
                            value={campeonato.estadisticas.goles}
                            prefix="⚽"
                            valueStyle={{ color: '#52c41a', fontSize: 24 }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" variant="borderless" style={{ background: '#f9f0ff', textAlign: 'center' }}>
                          <Statistic
                            title="Asistencias"
                            value={campeonato.estadisticas.asistencias}
                            prefix="🎯"
                            valueStyle={{ color: '#722ed1', fontSize: 24 }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" variant="borderless" style={{ background: '#fff7e6', textAlign: 'center' }}>
                          <Statistic
                            title="Partidos"
                            value={campeonato.estadisticas.partidosJugados}
                            prefix="🏟️"
                            valueStyle={{ color: '#fa8c16', fontSize: 24 }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={6}>
                        <Text type="secondary">🟨 Amarillas:</Text>
                        <div><Text strong>{campeonato.estadisticas.tarjetasAmarillas}</Text></div>
                      </Col>
                      <Col span={6}>
                        <Text type="secondary">🟥 Rojas:</Text>
                        <div><Text strong>{campeonato.estadisticas.tarjetasRojas}</Text></div>
                      </Col>
                      {campeonato.estadisticas.atajadas > 0 && (
                        <Col span={6}>
                          <Text type="secondary">🧤 Atajadas:</Text>
                          <div><Text strong>{campeonato.estadisticas.atajadas}</Text></div>
                        </Col>
                      )}
                      <Col span={6}>
                        <Text type="secondary">⏱️ Minutos:</Text>
                        <div><Text strong>{campeonato.estadisticas.minutosJugados}'</Text></div>
                      </Col>
                    </Row>

                    <Divider orientation="left">Partidos Detallados</Divider>

                    {/* Tabla de partidos con resultados */}
                    {campeonato.partidos && campeonato.partidos.length > 0 ? (
                      <Table
                        columns={[
                          {
                            title: 'Fecha',
                            dataIndex: 'fecha',
                            key: 'fecha',
                            render: (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-CL') : '—',
                            width: 100
                          },
                          {
                            title: 'Ronda',
                            dataIndex: 'ronda',
                            key: 'ronda',
                            width: 100
                          },
                          {
                            title: 'Partido',
                            key: 'partido',
                            render: (_, record) => (
                              <Text strong>{record.equipoANombre} vs {record.equipoBNombre}</Text>
                            )
                          },
                          {
                            title: 'Resultado',
                            dataIndex: 'resultado',
                            key: 'resultado',
                            align: 'center',
                            width: 120,
                            render: (resultado, record) => {
                              if (!resultado) return <Text type="secondary">Pendiente</Text>;
                              return (
                                <div>
                                  <Tag color="blue" style={{ fontSize: 14, fontWeight: 'bold' }}>
                                    {resultado}
                                  </Tag>
                                  {record.definidoPorPenales && (
                                    <div style={{ fontSize: 11, marginTop: 4 }}>
                                      <Text type="secondary">
                                        Penales: {record.penalesA} - {record.penalesB}
                                      </Text>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          },
                          {
                            title: '⚽',
                            dataIndex: 'golesJugador',
                            key: 'golesJugador',
                            align: 'center',
                            width: 60,
                            render: (goles) => (
                              <Tag color={goles > 0 ? 'green' : 'default'}>{goles}</Tag>
                            )
                          },
                          {
                            title: '🎯',
                            dataIndex: 'asistenciasJugador',
                            key: 'asistenciasJugador',
                            align: 'center',
                            width: 60,
                            render: (asist) => (
                              <Tag color={asist > 0 ? 'purple' : 'default'}>{asist}</Tag>
                            )
                          },
                          {
                            title: '🧤',
                            dataIndex: 'atajadasJugador',
                            key: 'atajadasJugador',
                            align: 'center',
                            width: 60,
                            render: (ataj) => ataj > 0 ? <Tag color="orange">{ataj}</Tag> : '—'
                          },
                          {
                            title: '🟨',
                            dataIndex: 'tarjetasAmarillasJugador',
                            key: 'tarjetasAmarillasJugador',
                            align: 'center',
                            width: 60,
                            render: (am) => am > 0 ? <Tag color="gold">{am}</Tag> : '—'
                          },
                          {
                            title: '🟥',
                            dataIndex: 'tarjetasRojasJugador',
                            key: 'tarjetasRojasJugador',
                            align: 'center',
                            width: 60,
                            render: (roj) => roj > 0 ? <Tag color="red">{roj}</Tag> : '—'
                          },
                          {
                            title: 'Min.',
                            dataIndex: 'minutosJugados',
                            key: 'minutosJugados',
                            align: 'center',
                            width: 70,
                            render: (min) => <Text>{min}'</Text>
                          }
                        ]}
                        dataSource={campeonato.partidos}
                        rowKey="partidoId"
                        size="small"
                        pagination={false}
                        scroll={{ x: 1000 }}
                      />
                    ) : (
                      <Empty 
                        description="No hay partidos registrados en este campeonato"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </>
                )
              }))}
            />
          )}
        </Card>
      </div>
    );
  };

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        {renderContent()}
      </ConfigProvider>
    </MainLayout>
  );
}