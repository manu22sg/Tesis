import React, { useState, useEffect } from 'react';
import {
  Card, Button, Table, Modal, Form, Select, Space, message,
  Tag, Empty, DatePicker, TimePicker, Row, Col, Statistic,
  InputNumber, Divider, Badge, Tooltip, Tabs
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined,
  TrophyOutlined, EditOutlined, CheckCircleOutlined, FireOutlined,
  PlayCircleOutlined, StopOutlined, TeamOutlined
} from '@ant-design/icons';
import { partidoService } from '../services/partido.services.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { Option } = Select;
const { TabPane } = Tabs;

const PartidoManager = ({ campeonatoId, canchas = [], onUpdate }) => {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalProgramarVisible, setModalProgramarVisible] = useState(false);
  const [modalResultadoVisible, setModalResultadoVisible] = useState(false);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroRonda, setFiltroRonda] = useState(null);
  const [formProgramar] = Form.useForm();
  const [formResultado] = Form.useForm();

  useEffect(() => {
    if (campeonatoId) {
      cargarPartidos();
    }
  }, [campeonatoId, filtroEstado, filtroRonda]);

  const cargarPartidos = async () => {
    setLoading(true);
    try {
      const data = await partidoService.listarPorCampeonato(campeonatoId, {
        estado: filtroEstado,
        ronda: filtroRonda
      });
      setPartidos(data.data || data);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al cargar partidos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalProgramar = (partido) => {
    setPartidoSeleccionado(partido);
    formProgramar.resetFields();
    
    // Si ya tiene datos, precargarlos
    if (partido.canchaId) {
      formProgramar.setFieldsValue({
        canchaId: partido.canchaId,
        fecha: partido.fecha ? dayjs(partido.fecha) : null,
        horaInicio: partido.horaInicio ? dayjs(partido.horaInicio, 'HH:mm') : null,
        horaFin: partido.horaFin ? dayjs(partido.horaFin, 'HH:mm') : null
      });
    }
    
    setModalProgramarVisible(true);
  };

  const abrirModalResultado = (partido) => {
    setPartidoSeleccionado(partido);
    formResultado.resetFields();
    
    // Si ya tiene resultados, precargarlos
    if (partido.golesA !== null) {
      formResultado.setFieldsValue({
        golesA: partido.golesA,
        golesB: partido.golesB
      });
    }
    
    setModalResultadoVisible(true);
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
      setModalProgramarVisible(false);
      cargarPartidos();
      if (onUpdate) onUpdate();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al programar partido');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarResultado = async (values) => {
    setLoading(true);
    try {
      await partidoService.registrarResultado(partidoSeleccionado.id, values);
      message.success('Resultado registrado exitosamente');
      setModalResultadoVisible(false);
      cargarPartidos();
      if (onUpdate) onUpdate();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al registrar resultado');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoTag = (estado) => {
    const configs = {
      pendiente: { color: 'default', icon: <ClockCircleOutlined />, text: 'Pendiente' },
      programado: { color: 'blue', icon: <CalendarOutlined />, text: 'Programado' },
      en_juego: { color: 'orange', icon: <PlayCircleOutlined />, text: 'En Juego' },
      finalizado: { color: 'green', icon: <CheckCircleOutlined />, text: 'Finalizado' },
      cancelado: { color: 'red', icon: <StopOutlined />, text: 'Cancelado' }
    };
    
    const config = configs[estado] || configs.pendiente;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getRondasUnicas = () => {
    const rondas = [...new Set(partidos.map(p => p.ronda).filter(r => r))];
    return rondas.sort();
  };

  const partidosPorRonda = getRondasUnicas().reduce((acc, ronda) => {
    acc[ronda] = partidos.filter(p => p.ronda === ronda);
    return acc;
  }, {});

  const estadisticas = {
    total: partidos.length,
    pendientes: partidos.filter(p => p.estado === 'pendiente').length,
    programados: partidos.filter(p => p.estado === 'programado').length,
    finalizados: partidos.filter(p => p.estado === 'finalizado').length
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'ordenLlave',
      key: 'ordenLlave',
      width: 60,
      render: (orden) => <Badge count={orden || '-'} style={{ backgroundColor: '#108ee9' }} />
    },
    {
      title: 'Equipo A',
      key: 'equipoA',
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: '#1890ff' }} />
          <strong>{record.equipoA?.nombre || 'Por definir'}</strong>
        </Space>
      )
    },
    {
      title: 'Resultado',
      key: 'resultado',
      align: 'center',
      width: 120,
      render: (_, record) => {
        if (record.golesA !== null && record.golesB !== null) {
          return (
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>
              {record.golesA} - {record.golesB}
            </div>
          );
        }
        return <Tag>Sin resultado</Tag>;
      }
    },
    {
      title: 'Equipo B',
      key: 'equipoB',
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: '#52c41a' }} />
          <strong>{record.equipoB?.nombre || 'Por definir'}</strong>
        </Space>
      )
    },
    {
      title: 'Ganador',
      key: 'ganador',
      align: 'center',
      width: 100,
      render: (_, record) => {
        if (!record.ganadorId) return <Tag>-</Tag>;
        const esEquipoA = record.ganadorId === record.equipoAId;
        return (
          <Tooltip title={esEquipoA ? record.equipoA?.nombre : record.equipoB?.nombre}>
            <Tag color="gold" icon={<TrophyOutlined />}>
              {esEquipoA ? 'A' : 'B'}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 130,
      render: (estado) => getEstadoTag(estado)
    },
    {
      title: 'Cancha',
      key: 'cancha',
      width: 150,
      render: (_, record) => {
        if (!record.cancha) return <Tag>Sin asignar</Tag>;
        return (
          <Space>
            <EnvironmentOutlined />
            {record.cancha.nombre}
          </Space>
        );
      }
    },
    {
      title: 'Fecha/Hora',
      key: 'fecha',
      width: 180,
      render: (_, record) => {
        if (!record.fecha) return <Tag>Por programar</Tag>;
        return (
          <Space direction="vertical" size={0}>
            <span><CalendarOutlined /> {record.fecha}</span>
            {record.horaInicio && (
              <span><ClockCircleOutlined /> {record.horaInicio} - {record.horaFin}</span>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {['pendiente', 'programado'].includes(record.estado) && (
            <Tooltip title="Programar/Editar">
              <Button
                type="text"
                icon={<CalendarOutlined />}
                onClick={() => abrirModalProgramar(record)}
              />
            </Tooltip>
          )}
          {['programado', 'en_juego'].includes(record.estado) && (
            <Tooltip title="Registrar Resultado">
              <Button
                type="text"
                icon={<TrophyOutlined />}
                onClick={() => abrirModalResultado(record)}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  const disabledDate = (current) => {
    // No permitir fechas pasadas
    return current && current < dayjs().startOf('day');
  };

  return (
    <div>
      {/* Estadísticas */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Partidos"
              value={estadisticas.total}
              prefix={<FireOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pendientes"
              value={estadisticas.pendientes}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Programados"
              value={estadisticas.programados}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Finalizados"
              value={estadisticas.finalizados}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select
            placeholder="Filtrar por estado"
            style={{ width: 200 }}
            allowClear
            onChange={setFiltroEstado}
            value={filtroEstado}
          >
            <Option value="pendiente">Pendiente</Option>
            <Option value="programado">Programado</Option>
            <Option value="en_juego">En Juego</Option>
            <Option value="finalizado">Finalizado</Option>
            <Option value="cancelado">Cancelado</Option>
          </Select>
          
          <Select
            placeholder="Filtrar por ronda"
            style={{ width: 200 }}
            allowClear
            onChange={setFiltroRonda}
            value={filtroRonda}
          >
            {getRondasUnicas().map(ronda => (
              <Option key={ronda} value={ronda}>{ronda}</Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Tabla de Partidos por Ronda */}
      <Tabs
  defaultActiveKey="todos"
  items={[
    {
      key: 'todos',
      label: 'Todos los Partidos',
      children: (
        <Table
          columns={columns}
          dataSource={partidos}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No hay partidos registrados" /> }}
        />
      )
    },
    ...getRondasUnicas().map((ronda) => ({
      key: ronda,
      label: (
        <Space>
          <FireOutlined />
          {ronda}
          <Badge count={partidosPorRonda[ronda].length} />
        </Space>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={partidosPorRonda[ronda]}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={false}
          locale={{ emptyText: <Empty description={`No hay partidos en ${ronda}`} /> }}
        />
      )
    }))
  ]}
/>

      {/* Modal Programar Partido */}
      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>Programar Partido</span>
          </Space>
        }
        open={modalProgramarVisible}
        onCancel={() => setModalProgramarVisible(false)}
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
                  {partidoSeleccionado.equipoA?.nombre || 'Equipo A'} 
                  <span style={{ margin: '0 16px', color: '#1890ff' }}>VS</span>
                  {partidoSeleccionado.equipoB?.nombre || 'Equipo B'}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Tag color="purple">{partidoSeleccionado.ronda}</Tag>
                </div>
              </Space>
            </Card>

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
                        <Tag color={cancha.estado === 'disponible' ? 'green' : 'red'}>
                          {cancha.estado}
                        </Tag>
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
                  format="YYYY-MM-DD"
                  disabledDate={disabledDate}
                  placeholder="Seleccionar fecha"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="horaInicio"
                    label="Hora de Inicio"
                    rules={[{ required: true, message: 'Selecciona hora de inicio' }]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      minuteStep={15}
                      placeholder="Ej: 14:00"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="horaFin"
                    label="Hora de Fin"
                    rules={[{ required: true, message: 'Selecciona hora de fin' }]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      minuteStep={15}
                      placeholder="Ej: 16:00"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </>
        )}
      </Modal>

      {/* Modal Registrar Resultado */}
      <Modal
        title={
          <Space>
            <TrophyOutlined />
            <span>Registrar Resultado</span>
          </Space>
        }
        open={modalResultadoVisible}
        onCancel={() => setModalResultadoVisible(false)}
        onOk={() => formResultado.submit()}
        confirmLoading={loading}
        okText="Registrar"
        cancelText="Cancelar"
        width={500}
      >
        {partidoSeleccionado && (
          <>
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f2f5' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                  {partidoSeleccionado.equipoA?.nombre || 'Equipo A'} 
                  <span style={{ margin: '0 16px', color: '#1890ff' }}>VS</span>
                  {partidoSeleccionado.equipoB?.nombre || 'Equipo B'}
                </div>
                {partidoSeleccionado.fecha && (
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#666' }}>
                    <CalendarOutlined /> {partidoSeleccionado.fecha} • 
                    <ClockCircleOutlined /> {partidoSeleccionado.horaInicio}
                  </div>
                )}
              </Space>
            </Card>

            <Form
              form={formResultado}
              layout="vertical"
              onFinish={handleRegistrarResultado}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="golesA"
                    label={`Goles de ${partidoSeleccionado.equipoA?.nombre || 'Equipo A'}`}
                    rules={[
                      { required: true, message: 'Ingresa los goles' },
                      { type: 'number', min: 0, message: 'Mínimo 0 goles' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="0"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="golesB"
                    label={`Goles de ${partidoSeleccionado.equipoB?.nombre || 'Equipo B'}`}
                    rules={[
                      { required: true, message: 'Ingresa los goles' },
                      { type: 'number', min: 0, message: 'Mínimo 0 goles' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="0"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />
              
              <div style={{ textAlign: 'center', color: '#666', fontSize: 12 }}>
                El ganador se determinará automáticamente según el resultado
              </div>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default PartidoManager;