import React, { useState, useEffect } from 'react';
import {
  Card, Button, Modal, message, Space, Tag, Descriptions,
  Alert, Spin, Empty, Table, Typography, Form, Select,
  DatePicker, TimePicker, Row, Col, Tooltip
} from 'antd';
import {
  ThunderboltOutlined, PlayCircleOutlined, TrophyOutlined,
  FireOutlined, CheckCircleOutlined, EditOutlined, CalendarOutlined,
  EnvironmentOutlined, ClockCircleOutlined, TeamOutlined
} from '@ant-design/icons';
import { campeonatoService } from '../services/campeonato.services.js';
import { partidoService } from '../services/partido.services.js';
import { obtenerCanchas } from '../services/cancha.services.js';
import RegistrarResultadoModal from './RegistrarResultadoModal.jsx';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/es';

dayjs.extend(customParseFormat);
dayjs.locale('es');

const { Title, Text } = Typography;
const { Option } = Select;

const FixtureManager = ({ campeonatoId, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [campeonato, setCampeonato] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  
  // Modales
  const [modalResultado, setModalResultado] = useState(false);
  const [modalProgramar, setModalProgramar] = useState(false);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);
  
  // Formularios
  const [formProgramar] = Form.useForm();

  useEffect(() => {
    if (campeonatoId) {
      cargarDatos();
      cargarCanchas();
    }
  }, [campeonatoId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await campeonatoService.obtener(campeonatoId);
      setCampeonato(data);
      setPartidos(data.partidos || []);
      if (onUpdate) onUpdate();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarCanchas = async () => {
    try {
      const responseCanchas = await obtenerCanchas();
      setCanchas(responseCanchas.canchas || []);
    } catch (error) {
      console.error('Error al cargar canchas:', error);
      setCanchas([]);
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

  const handleGenerarSiguienteRonda = async () => {
    const partidosAgrupados = agruparPartidosPorRonda();
    const rondasOrdenadas = Object.keys(partidosAgrupados).sort((a, b) => {
      const orden = { final: 1, semifinal: 2, cuartos: 3, octavos: 4 };
      return (orden[b] || 99) - (orden[a] || 99);
    });
    
    const ultimaRonda = rondasOrdenadas[0];
    const partidosUltimaRonda = partidosAgrupados[ultimaRonda] || [];
    const partidosPendientes = partidosUltimaRonda.filter(p => p.estado !== 'finalizado');
    
    if (partidosPendientes.length > 0) {
      Modal.warning({
        title: 'Partidos pendientes',
        content: (
          <div>
            <p>Hay {partidosPendientes.length} partido(s) pendiente(s) en la ronda "{getRondaNombre(ultimaRonda)}".</p>
            <p>Debes finalizar todos los partidos y asignar ganadores antes de generar la siguiente ronda.</p>
          </div>
        ),
      });
      return;
    }

    Modal.confirm({
      title: '¿Generar Siguiente Ronda?',
      content: (
        <div>
          <p>Se generará automáticamente la siguiente ronda con los ganadores de <strong>"{getRondaNombre(ultimaRonda)}"</strong>.</p>
          <Alert
            message="Importante"
            description="Asegúrate de que todos los partidos estén finalizados y tengan un ganador asignado."
            type="info"
            showIcon
            style={{ marginTop: 12 }}
          />
        </div>
      ),
      okText: 'Sí, generar',
      cancelText: 'Cancelar',
      icon: <PlayCircleOutlined />,
      onOk: async () => {
        setLoading(true);
        try {
          const resultado = await campeonatoService.generarSiguienteRonda(campeonatoId);

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
                      <Text type="secondary">¡Campeón del torneo!</Text>
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
                <div>Ronda anterior: {getRondaNombre(resultado.rondaAnterior)}</div>
                <div>Nueva ronda: {getRondaNombre(resultado.ronda)}</div>
                <div>Partidos creados: {resultado.partidosCreados}</div>
              </div>,
              6
            );
          }

          cargarDatos();
        } catch (error) {
          message.error(error?.response?.data?.error || 'Error al generar siguiente ronda');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleAbrirModalResultado = (partido) => {
    setPartidoSeleccionado(partido);
    setModalResultado(true);
  };

  const handleAbrirModalProgramar = (partido) => {
    setPartidoSeleccionado(partido);
    formProgramar.resetFields();
    
    if (partido.canchaId) {
      formProgramar.setFieldsValue({
        canchaId: partido.canchaId,
        fecha: partido.fecha ? dayjs(partido.fecha) : null,
        horaInicio: partido.horaInicio ? dayjs(partido.horaInicio, 'HH:mm') : null,
        horaFin: partido.horaFin ? dayjs(partido.horaFin, 'HH:mm') : null
      });
    }
    
    setModalProgramar(true);
  };

  const handleRegistrarResultado = async (datos) => {
    const { partidoId, golesA, golesB, penalesA, penalesB } = datos;
    
    try {
      const payload = {
        golesA: Number(golesA),
        golesB: Number(golesB),
        penalesA: penalesA !== null && penalesA !== undefined ? Number(penalesA) : null,
        penalesB: penalesB !== null && penalesB !== undefined ? Number(penalesB) : null
      };
      
      await partidoService.registrarResultado(partidoId, payload);
      
      message.success('Resultado registrado exitosamente');
      setModalResultado(false);
      setPartidoSeleccionado(null);
      cargarDatos();
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Response data:', error?.response?.data);
      message.error(error?.response?.data?.error || error?.message || 'Error al registrar resultado');
    }
  };

  const handleProgramar = async (values) => {
    setLoading(true);
    try {
      const data = {
        canchaId: values.canchaId,
        fecha: values.fecha.format('YYYY-MM-DD'),
        horaInicio: values.horaInicio.format('HH:mm'),
        horaFin: values.horaFin.format('HH:mm')
      };
      
      await partidoService.programar(partidoSeleccionado.id, data);
      message.success('Partido programado exitosamente');
      setModalProgramar(false);
      cargarDatos();
    } catch (error) {
      console.error('❌ Error al programar:', error);
      message.error(error?.response?.data?.error || 'Error al programar partido');
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

  const getRondaNombre = (ronda) => {
    const nombres = {
      final: 'Final',
      semifinal: 'Semifinal',
      cuartos: 'Cuartos de Final',
      octavos: 'Octavos de Final'
    };
    return nombres[ronda] || ronda.replace('_', ' ').toUpperCase();
  };

  const disabledDate = (current) => {
    if (!current) return false;
    if (current < dayjs().startOf('day')) return true;
    const day = current.day();
    return day === 0 || day === 6;
  };

  const disabledHours = () => {
    const hours = [];
    // Deshabilitar horas antes de las 8:00
    for (let i = 0; i < 8; i++) {
      hours.push(i);
    }
    // Deshabilitar horas después de las 18:00
    for (let i = 19; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const disabledMinutes = (selectedHour) => {
    // Si es después de las 18:00, deshabilitar todos los minutos
    if (selectedHour > 18) {
      return Array.from({ length: 60 }, (_, i) => i);
    }
    // Si es antes de las 8:00, deshabilitar todos los minutos
    if (selectedHour < 8) {
      return Array.from({ length: 60 }, (_, i) => i);
    }
    return [];
  };

  const partidosAgrupados = agruparPartidosPorRonda();
  const rondasOrdenadas = Object.keys(partidosAgrupados).sort((a, b) => {
    const orden = { final: 1, semifinal: 2, cuartos: 3, octavos: 4 };
    return (orden[b] || 99) - (orden[a] || 99);
  });

  const totalPartidos = partidos.length;
  const cantidadEquipos = campeonato?.equipos?.length || 0;
  const hayEquiposSuficientes = cantidadEquipos >= 2;

  if (!campeonato) {
    return (
      <Card>
        <Spin tip="Cargando..." />
      </Card>
    );
  }

  const columns = [
    {
      title: 'N°',
      dataIndex: 'orden',
      key: 'orden',
      width: 60,
      align: 'center',
      render: (orden) => <Text strong>{orden}</Text>
    },
    {
      title: 'Equipo A',
      dataIndex: 'equipoAId',
      key: 'equipoA',
      width: 180,
      render: (id) => {
        const equipo = campeonato.equipos?.find(e => e.id === id);
        return (
          <Space>
            <TeamOutlined style={{ color: '#1890ff' }} />
            <Text strong>{equipo?.nombre || `Equipo ${id}`}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Resultado',
      key: 'resultado',
      align: 'center',
      width: 140,
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 16 }}>
            {record.golesA ?? '-'} - {record.golesB ?? '-'}
          </Text>
          {record.definidoPorPenales && (
            <div>
              <Text type="warning" style={{ fontSize: 12 }}>
                Penales: {record.penalesA} - {record.penalesB}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Equipo B',
      dataIndex: 'equipoBId',
      key: 'equipoB',
      width: 180,
      render: (id) => {
        const equipo = campeonato.equipos?.find(e => e.id === id);
        return (
          <Space>
            <TeamOutlined style={{ color: '#52c41a' }} />
            <Text strong>{equipo?.nombre || `Equipo ${id}`}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Ganador',
      dataIndex: 'ganadorId',
      key: 'ganador',
      width: 150,
      render: (id) => {
        if (!id) return <Text type="secondary">-</Text>;
        const equipo = campeonato.equipos?.find(e => e.id === id);
        return (
          <Tag color="gold" icon={<TrophyOutlined />}>
            {equipo?.nombre || `Equipo ${id}`}
          </Tag>
        );
      }
    },
    {
      title: 'Cancha',
      dataIndex: 'canchaId',
      key: 'cancha',
      width: 130,
      render: (id, record) => {
        if (!id) return <Text type="secondary">Sin asignar</Text>;
        const cancha = canchas.find(c => c.id === id);
        return (
          <Space>
            <EnvironmentOutlined />
            <Text>{cancha?.nombre || `Cancha ${id}`}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Fecha/Hora',
      key: 'fechaHora',
      width: 160,
      render: (_, record) => {
        if (!record.fecha) return <Text type="secondary">No programado</Text>;
        return (
          <Space direction="vertical" size={0}>
            <Text>
              <CalendarOutlined /> {dayjs(record.fecha).format('DD/MM/YYYY')}
            </Text>
            {record.horaInicio && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> {record.horaInicio} - {record.horaFin || '...'}
              </Text>
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
      render: (estado) => (
        <Tag color={getEstadoColor(estado)}>
          {getEstadoText(estado)}
        </Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          {['pendiente', 'programado'].includes(record.estado) && (
            <Tooltip title="Programar">
              <Button
                type="text"
                size="small"
                icon={<CalendarOutlined />}
                onClick={() => handleAbrirModalProgramar(record)}
              >
                Programar
              </Button>
            </Tooltip>
          )}
          {record.estado !== 'finalizado' && (
            <Tooltip title="Registrar Resultado">
              <Button
                type="primary"
                size="small"
                icon={<TrophyOutlined />}
                onClick={() => handleAbrirModalResultado(record)}
              >
                Resultado
              </Button>
            </Tooltip>
          )}
          {record.estado === 'finalizado' && (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Finalizado
            </Tag>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
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
                disabled={!hayEquiposSuficientes}
              >
                Sortear Primera Ronda
              </Button>
            )}
            
            {campeonato.estado === 'en_juego' && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleGenerarSiguienteRonda}
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
              {campeonato.genero.charAt(0).toUpperCase() + campeonato.genero.slice(1)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Tag color={
              campeonato.estado === 'creado' ? 'blue' :
              campeonato.estado === 'en_juego' ? 'green' :
              campeonato.estado === 'finalizado' ? 'gold' : 'default'
            }>
            {getEstadoText(campeonato.estado)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Año/Semestre">
            {campeonato.anio} - S{campeonato.semestre}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Alertas de estado */}
      {campeonato.estado === 'creado' && totalPartidos === 0 && !hayEquiposSuficientes && (
        <Alert
          message="Equipos insuficientes"
          description={`Se necesitan al menos 2 equipos para generar el fixture. Actualmente hay ${cantidadEquipos} equipo(s) inscrito(s).`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {campeonato.estado === 'creado' && totalPartidos === 0 && hayEquiposSuficientes && (
        <Alert
          message="Campeonato sin fixture"
          description={`Este campeonato tiene ${cantidadEquipos} equipos inscritos. Haz clic en "Sortear Primera Ronda" para generar el fixture automáticamente.`}
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
          {rondasOrdenadas.map((ronda) => {
            const partidosRonda = partidosAgrupados[ronda];
            const partidosFinalizados = partidosRonda.filter(p => p.estado === 'finalizado').length;
            const todosFinalizados = partidosFinalizados === partidosRonda.length;

            return (
              <Card
                key={ronda}
                title={
                  <Space>
                    <FireOutlined style={{ color: '#ff4d4f' }} />
                    <span>{getRondaNombre(ronda)}</span>
                    <Tag>{partidosRonda.length} partidos</Tag>
                    {todosFinalizados && (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        Completa
                      </Tag>
                    )}
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <Table
                  dataSource={partidosRonda.map((partido, idx) => ({
                    ...partido,
                    orden: idx + 1
                  }))}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={columns}
                  scroll={{ x: false }}
                />
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No hay partidos generados"
          >
            {campeonato.estado === 'creado' && hayEquiposSuficientes && (
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

      {/* Modal para registrar resultado */}
      <RegistrarResultadoModal
        visible={modalResultado}
        onCancel={() => {
          setModalResultado(false);
          setPartidoSeleccionado(null);
        }}
        onSuccess={handleRegistrarResultado}
        partido={partidoSeleccionado}
        equipos={campeonato.equipos}
      />

      {/* Modal para programar partido */}
      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>Programar Partido</span>
          </Space>
        }
        open={modalProgramar}
        onCancel={() => {
          setModalProgramar(false);
          setPartidoSeleccionado(null);
        }}
        onOk={() => formProgramar.submit()}
        confirmLoading={loading}
        okText="Programar"
        cancelText="Cancelar"
        width={600}
      >
        {partidoSeleccionado && (
          <>
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f2f5' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                  {campeonato.equipos?.find(e => e.id === partidoSeleccionado.equipoAId)?.nombre || 'Equipo A'} 
                  <span style={{ margin: '0 16px', color: '#1890ff' }}>VS</span>
                  {campeonato.equipos?.find(e => e.id === partidoSeleccionado.equipoBId)?.nombre || 'Equipo B'}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Tag color="purple">{getRondaNombre(partidoSeleccionado.ronda)}</Tag>
                </div>
              </Space>
            </Card>

            <Alert
              message="Horario permitido"
              description="Los partidos solo pueden programarse entre las 08:00 y las 18:00 horas."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form
              form={formProgramar}
              layout="vertical"
              onFinish={handleProgramar}
            >
              <Form.Item
                name="canchaId"
                label="Cancha"
                rules={[{ required: true, message: 'Selecciona una cancha' }]}
              >
                <Select placeholder="Seleccionar cancha">
                  {canchas.map(cancha => (
                    <Option key={cancha.id} value={cancha.id}>
                      <Space>
                        <EnvironmentOutlined />
                        {cancha.nombre}
                        {cancha.estado && (
                          <Tag color={cancha.estado === 'disponible' ? 'green' : 'red'}>
                            {cancha.estado}
                          </Tag>
                        )}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="fecha"
                label="Fecha"
                rules={[{ required: true, message: 'Selecciona una fecha' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  disabledDate={disabledDate}
                  placeholder="Seleccionar fecha"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="horaInicio"
                    label="Hora de Inicio"
                    rules={[
                      { required: true, message: 'Hora requerida' },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const hour = value.hour();
                          if (hour < 8 || hour > 18) {
                            return Promise.reject(new Error('La hora debe estar entre 08:00 y 18:00'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      minuteStep={15}
                      placeholder="Entre 08:00 y 18:00"
                      disabledHours={disabledHours}
                      disabledMinutes={disabledMinutes}
                      showNow={false}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="horaFin"
                    label="Hora de Fin"
                    dependencies={['horaInicio']}
                    rules={[
                      { required: true, message: 'Hora requerida' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value) return Promise.resolve();
                          const horaInicio = getFieldValue('horaInicio');
                          if (!horaInicio) return Promise.resolve();
                          
                          const hour = value.hour();
                          if (hour < 8 || hour > 18) {
                            return Promise.reject(new Error('La hora debe estar entre 08:00 y 18:00'));
                          }
                          
                          if (value.isBefore(horaInicio) || value.isSame(horaInicio)) {
                            return Promise.reject(new Error('Debe ser posterior a la hora de inicio'));
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      minuteStep={15}
                      placeholder="Entre 08:00 y 18:00"
                      disabledHours={disabledHours}
                      disabledMinutes={disabledMinutes}
                      showNow={false}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default FixtureManager;