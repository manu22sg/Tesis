import React, { useState, useEffect } from 'react';
import {
  Card, Button, Modal, message, Space, Tag, Descriptions,
  Alert, Spin, Empty, Table, Typography, Row, Col, Statistic,
  Divider, Input, Form
} from 'antd';
import {
  ThunderboltOutlined, PlayCircleOutlined, TrophyOutlined,
  TeamOutlined, CheckCircleOutlined, ClockCircleOutlined,
  FireOutlined
} from '@ant-design/icons';
import { campeonatoService } from '../services/campeonato.services.js';

const { Title, Text } = Typography;

const FixtureManager = ({ campeonatoId, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [campeonato, setCampeonato] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [modalSiguienteRonda, setModalSiguienteRonda] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (campeonatoId) {
      cargarDatos();
    }
  }, [campeonatoId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await campeonatoService.obtener(campeonatoId);
      setCampeonato(data);
      setPartidos(data.partidos || []);
      if (onUpdate) onUpdate(); // Notifica al padre para que recargue
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSortearPrimeraRonda = async () => {
    Modal.confirm({
      title: '¿Sortear Primera Ronda?',
      content: 'Esto generará automáticamente los partidos de la primera ronda basándose en los equipos inscritos.',
      okText: 'Sí, sortear',
      cancelText: 'Cancelar',
      onOk: async () => {
        setLoading(true);
        try {
          const resultado = await campeonatoService.sortearPrimeraRonda(campeonatoId);
          
          message.success(
            <div>
              <div><strong>¡Primera ronda generada!</strong></div>
              <div>Ronda: {resultado.ronda}</div>
              <div>Partidos creados: {resultado.partidosCreados?.length || 0}</div>
              {resultado.byes?.length > 0 && (
                <div>Equipos con BYE: {resultado.byes.length}</div>
              )}
            </div>,
            6
          );
          
          cargarDatos();
        } catch (error) {
          message.error(error?.response?.data?.error || 'Error al sortear primera ronda');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleGenerarSiguienteRonda = async (values) => {
    setLoading(true);
    try {
      const resultado = await campeonatoService.generarSiguienteRonda(
        campeonatoId,
        values.rondaAnterior
      );

      if (resultado.fin) {
        Modal.success({
          title: '🏆 ¡Campeonato Finalizado!',
          content: (
            <div>
              <p>{resultado.mensaje}</p>
              {resultado.nombreGanador && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <TrophyOutlined style={{ fontSize: 48, color: '#faad14' }} />
                  <Title level={4} style={{ marginTop: 8 }}>
                    {resultado.nombreGanador}
                  </Title>
                </div>
              )}
            </div>
          ),
          width: 500
        });
      } else {
        message.success(
          <div>
            <div><strong>¡Siguiente ronda generada!</strong></div>
            <div>Ronda: {resultado.ronda}</div>
            <div>Partidos creados: {resultado.partidosCreados}</div>
          </div>,
          6
        );
      }

      setModalSiguienteRonda(false);
      form.resetFields();
      cargarDatos();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al generar siguiente ronda');
    } finally {
      setLoading(false);
    }
  };

  const agruparPartidosPorRonda = () => {
    const grupos = {};
    partidos.forEach(partido => {
      if (!grupos[partido.ronda]) {
        grupos[partido.ronda] = [];
      }
      grupos[partido.ronda].push(partido);
    });
    return grupos;
  };

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'default',
      en_curso: 'processing',
      finalizado: 'success',
      cancelado: 'error'
    };
    return colors[estado] || 'default';
  };

  const getEstadoText = (estado) => {
    const texts = {
      pendiente: 'Pendiente',
      en_curso: 'En Curso',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado'
    };
    return texts[estado] || estado;
  };

  const getRondaNombre = (ronda) => {
    const nombres = {
      final: 'Final',
      semifinal: 'Semifinal',
      cuartos: 'Cuartos de Final',
      octavos: 'Octavos de Final'
    };
    return nombres[ronda] || ronda.replace('_', ' ').toUpperCase();
  };

  const partidosAgrupados = agruparPartidosPorRonda();
  const rondasOrdenadas = Object.keys(partidosAgrupados).sort((a, b) => {
    const orden = {
      final: 1,
      semifinal: 2,
      cuartos: 3,
      octavos: 4
    };
    return (orden[b] || 99) - (orden[a] || 99);
  });

  const totalPartidos = partidos.length;
  const partidosFinalizados = partidos.filter(p => p.estado === 'finalizado').length;
  const partidosPendientes = partidos.filter(p => p.estado === 'pendiente').length;

  if (!campeonato) {
    return (
      <Card>
        <Spin tip="Cargando..." />
      </Card>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header con estadísticas */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Partidos"
              value={totalPartidos}
              prefix={<FireOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Finalizados"
              value={partidosFinalizados}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Pendientes"
              value={partidosPendientes}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Equipos"
              value={campeonato.equipos?.length || 0}
              prefix={<TeamOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Información del campeonato */}
      <Card 
        title={
          <Space>
            <TrophyOutlined />
            <span>{campeonato.nombre}</span>
          </Space>
        }
        extra={
          <Space>
            {campeonato.estado === 'creado' && totalPartidos === 0 && (
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleSortearPrimeraRonda}
                loading={loading}
              >
                Sortear Primera Ronda
              </Button>
            )}
            
            {campeonato.estado === 'en_juego' && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => setModalSiguienteRonda(true)}
                loading={loading}
              >
                Generar Siguiente Ronda
              </Button>
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={4} size="small">
          <Descriptions.Item label="Formato">
            <Tag color="purple">{campeonato.formato}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Género">
            <Tag color={
              campeonato.genero === 'masculino' ? 'blue' :
              campeonato.genero === 'femenino' ? 'pink' : 'orange'
            }>
              {campeonato.genero}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Tag color={
              campeonato.estado === 'creado' ? 'blue' :
              campeonato.estado === 'en_juego' ? 'green' :
              campeonato.estado === 'finalizado' ? 'gold' : 'default'
            }>
              {campeonato.estado}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Año/Semestre">
            {campeonato.anio} - S{campeonato.semestre}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Alertas de estado */}
      {campeonato.estado === 'creado' && totalPartidos === 0 && (
        <Alert
          message="Campeonato sin fixture"
          description={`Este campeonato tiene ${campeonato.equipos?.length || 0} equipos inscritos. Haz clic en "Sortear Primera Ronda" para generar el fixture automáticamente.`}
          type="info"
          showIcon
          icon={<ThunderboltOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {campeonato.estado === 'finalizado' && (
        <Alert
          message="🏆 Campeonato Finalizado"
          description="Este campeonato ha concluido. Consulta la ronda final para ver al campeón."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Fixture por rondas */}
      {totalPartidos > 0 ? (
        <div>
          {rondasOrdenadas.map(ronda => (
            <Card
              key={ronda}
              title={
                <Space>
                  <FireOutlined style={{ color: '#ff4d4f' }} />
                  <span>{getRondaNombre(ronda)}</span>
                  <Tag>{partidosAgrupados[ronda].length} partidos</Tag>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Table
                dataSource={partidosAgrupados[ronda]}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Orden',
                    dataIndex: 'ordenLlave',
                    key: 'ordenLlave',
                    width: 80,
                    render: (orden) => <Text strong>#{orden}</Text>
                  },
                  {
                    title: 'Equipo A',
                    dataIndex: 'equipoAId',
                    key: 'equipoA',
                    render: (id) => {
                      const equipo = campeonato.equipos?.find(e => e.id === id);
                      return equipo?.nombre || `Equipo #${id}`;
                    }
                  },
                  {
                    title: 'Resultado',
                    key: 'resultado',
                    align: 'center',
                    width: 120,
                    render: (_, record) => (
                      <Text strong style={{ fontSize: 16 }}>
                        {record.golesA || 0} - {record.golesB || 0}
                      </Text>
                    )
                  },
                  {
                    title: 'Equipo B',
                    dataIndex: 'equipoBId',
                    key: 'equipoB',
                    render: (id) => {
                      const equipo = campeonato.equipos?.find(e => e.id === id);
                      return equipo?.nombre || `Equipo #${id}`;
                    }
                  },
                  {
                    title: 'Ganador',
                    dataIndex: 'ganadorId',
                    key: 'ganador',
                    render: (id) => {
                      if (!id) return <Text type="secondary">-</Text>;
                      const equipo = campeonato.equipos?.find(e => e.id === id);
                      return (
                        <Tag color="gold" icon={<TrophyOutlined />}>
                          {equipo?.nombre || `Equipo #${id}`}
                        </Tag>
                      );
                    }
                  },
                  {
                    title: 'Estado',
                    dataIndex: 'estado',
                    key: 'estado',
                    render: (estado) => (
                      <Tag color={getEstadoColor(estado)}>
                        {getEstadoText(estado)}
                      </Tag>
                    )
                  },
                  {
                    title: 'Cancha',
                    dataIndex: 'canchaId',
                    key: 'cancha',
                    render: (id) => id ? `Cancha #${id}` : <Text type="secondary">No asignada</Text>
                  }
                ]}
              />
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No hay partidos generados"
          >
            {campeonato.estado === 'creado' && (
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleSortearPrimeraRonda}
              >
                Sortear Primera Ronda
              </Button>
            )}
          </Empty>
        </Card>
      )}

      {/* Modal para generar siguiente ronda */}
      <Modal
        title="Generar Siguiente Ronda"
        open={modalSiguienteRonda}
        onCancel={() => {
          setModalSiguienteRonda(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Generar"
        cancelText="Cancelar"
      >
        <Alert
          message="Importante"
          description="Asegúrate de que todos los partidos de la ronda anterior estén finalizados y tengan un ganador asignado."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerarSiguienteRonda}
        >
          <Form.Item
            name="rondaAnterior"
            label="Nombre de la Ronda Anterior"
            rules={[
              { required: true, message: 'Ingresa el nombre de la ronda anterior' }
            ]}
            tooltip="Ej: octavos, cuartos, semifinal"
          >
            <Input 
              placeholder="Ej: semifinal"
              autoFocus
            />
          </Form.Item>
        </Form>

        <Divider />
        
        <div>
          <Text strong>Rondas disponibles en este campeonato:</Text>
          <div style={{ marginTop: 8 }}>
            {rondasOrdenadas.map(ronda => (
              <Tag key={ronda} style={{ marginBottom: 4 }}>
                {getRondaNombre(ronda)}
              </Tag>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FixtureManager;