import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Divider,
  Empty,
  Form,
  Select,
  InputNumber,
  Tooltip,
  Popconfirm,
  message,
  Typography
} from 'antd';
import {
  BarChartOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined
} from '@ant-design/icons';
import * as estadisticaService from '../services/estadisticaCampeonato.services';
import { formatearFecha } from '../utils/formatters';

const { Text } = Typography;
const { Option } = Select;

const EstadisticasPartidoModal = ({
  visible,
  onCancel,
  partido,
  campeonatoId,
  equipos,
  getRondaNombre
}) => {
  const [estadisticas, setEstadisticas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalForm, setModalForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [todosLosJugadores, setTodosLosJugadores] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && partido) {
      cargarEstadisticas();
    }
  }, [visible, partido]);

  const cargarEstadisticas = async () => {
    if (!partido) return;
    setLoading(true);
    try {
      const data = await estadisticaService.listarEstadisticas({ partidoId: partido.id });
      setEstadisticas(data.items || []);
      await cargarJugadoresDisponibles(data.items || []);
    } catch (error) {
      message.error('Error al cargar estadísticas');
      setEstadisticas([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarJugadoresDisponibles = async (estadisticasActuales) => {
    if (!partido || !campeonatoId) return;

    try {
      const [jugadoresA, jugadoresB] = await Promise.all([
        estadisticaService.listarJugadoresPorEquipoYCampeonato(partido.equipoAId, campeonatoId),
        estadisticaService.listarJugadoresPorEquipoYCampeonato(partido.equipoBId, campeonatoId)
      ]);

      const todos = [...(jugadoresA || []), ...(jugadoresB || [])];

      setTodosLosJugadores(todos);

      const jugadoresConEstadisticas = estadisticasActuales.map(e => e.jugadorCampeonatoId);
      const disponibles = todos.filter(
        jugador => !jugadoresConEstadisticas.includes(jugador.id)
      );

      setJugadoresDisponibles(disponibles);
    } catch (error) {
      console.error('Error al cargar jugadores:', error);
      setJugadoresDisponibles([]);
      setTodosLosJugadores([]);
    }
  };

  const handleAbrirForm = (estadistica = null) => {
    if (estadistica) {
      setEditingId(estadistica.id);
      form.setFieldsValue({
        jugadorCampeonatoId: estadistica.jugadorCampeonatoId,
        goles: estadistica.goles,
        asistencias: estadistica.asistencias,
        atajadas: estadistica.atajadas,
        tarjetasAmarillas: estadistica.tarjetasAmarillas,
        tarjetasRojas: estadistica.tarjetasRojas,
        minutosJugados: estadistica.minutosJugados
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setModalForm(true);
  };

  const handleGuardar = async (values) => {
    setLoading(true);
    try {
      if (editingId) {
        await estadisticaService.actualizarEstadistica(editingId, values);
        message.success('Estadística actualizada');
      } else {
        await estadisticaService.crearEstadistica({
          ...values,
          partidoId: partido.id
        });
        message.success('Estadística creada');
      }

      setModalForm(false);
      form.resetFields();
      await cargarEstadisticas();
    } catch (error) {
      message.error(error || 'Error al guardar estadística');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await estadisticaService.eliminarEstadistica(id);
      message.success('Estadística eliminada');
      await cargarEstadisticas();
    } catch (error) {
      message.error('Error al eliminar estadística');
    }
  };

  const columns = [
    {
      title: 'Jugador',
      dataIndex: 'jugadorCampeonatoId',
      key: 'jugador',
      render: (id) => {
        const jugador = todosLosJugadores.find(j => j.id === id);
        if (!jugador) return `ID ${id}`;
        return (
          <Space direction="vertical" size={0}>
            <Space>
              <UserOutlined />
              <span>
                #{jugador.numeroCamiseta} {jugador.usuario?.nombre} {jugador.usuario?.apellido ?? ''}
              </span>
              <Tag size="small">{jugador.posicion}</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: '12px', marginLeft: 20 }}>
              {jugador.equipo?.nombre}
            </Text>
          </Space>
        );
      }
    },
    // ⬇️ Estadísticas sin Tag: solo números
    {
      title: '⚽',
      dataIndex: 'goles',
      width: 60,
      align: 'center',
      render: (g) => g ?? 0
    },
    {
      title: '🎯',
      dataIndex: 'asistencias',
      width: 60,
      align: 'center',
      render: (a) => a ?? 0
    },
    {
      title: '🧤',
      dataIndex: 'atajadas',
      width: 60,
      align: 'center',
      render: (a) => a ?? 0
    },
    {
      title: '🟨',
      dataIndex: 'tarjetasAmarillas',
      width: 60,
      align: 'center',
      render: (t) => t ?? 0
    },
    {
      title: '🟥',
      dataIndex: 'tarjetasRojas',
      width: 60,
      align: 'center',
      render: (t) => t ?? 0
    },
    {
      title: '⏱️',
      dataIndex: 'minutosJugados',
      width: 70,
      align: 'center',
      render: (m) => (m != null ? `${m}'` : "0'")
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleAbrirForm(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar estadística?"
            onConfirm={() => handleEliminar(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
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
        </Space>
      )
    }
  ];

  if (!partido) return null;

  const equipoA = equipos?.find(e => e.id === partido.equipoAId);
  const equipoB = equipos?.find(e => e.id === partido.equipoBId);

  return (
    <>
      <Modal
        title={
          <Space>
            <BarChartOutlined />
            <span>Estadísticas del Partido</span>
          </Space>
        }
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={900}
      >
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
          <Row gutter={16} align="middle">
            <Col span={10} style={{ textAlign: 'center' }}>
              <Text strong style={{ fontSize: 16 }}>
                {equipoA?.nombre}
              </Text>
            </Col>
            <Col span={4} style={{ textAlign: 'center' }}>
              <Text strong style={{ fontSize: 20 }}>
                {partido.golesA} - {partido.golesB}
              </Text>
            </Col>
            <Col span={10} style={{ textAlign: 'center' }}>
              <Text strong style={{ fontSize: 16 }}>
                {equipoB?.nombre}
              </Text>
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ textAlign: 'center' }}>
            <Tag color="purple">
              {getRondaNombre ? getRondaNombre(partido.ronda) : partido.ronda}
            </Tag>
            {partido.fecha && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {formatearFecha(partido.fecha)}
              </Text>
            )}
          </div>
        </Card>

        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAbrirForm()}
            disabled={jugadoresDisponibles.length === 0}
          >
            Agregar Estadística
          </Button>
        </div>

        <Table
          dataSource={estadisticas}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No hay estadísticas registradas"
              >
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => handleAbrirForm()}
                  disabled={jugadoresDisponibles.length === 0}
                >
                  Agregar primera estadística
                </Button>
              </Empty>
            )
          }}
        />
      </Modal>

      <Modal
        title={
          <Space>
            {editingId ? <EditOutlined /> : <PlusOutlined />}
            <span>{editingId ? 'Editar Estadística' : 'Nueva Estadística'}</span>
          </Space>
        }
        open={modalForm}
        onCancel={() => {
          setModalForm(false);
          setEditingId(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGuardar}
          initialValues={{
            goles: 0,
            asistencias: 0,
            atajadas: 0,
            tarjetasAmarillas: 0,
            tarjetasRojas: 0,
            minutosJugados: 90
          }}
        >
          <Form.Item
            name="jugadorCampeonatoId"
            label="Jugador"
            rules={[{ required: true, message: 'Selecciona un jugador' }]}
          >
            <Select
              placeholder="Seleccionar jugador"
              showSearch
              disabled={editingId}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {(editingId ? todosLosJugadores : jugadoresDisponibles).map(jugador => (
                <Option key={jugador.id} value={jugador.id}>
                  {`#${jugador.numeroCamiseta} ${jugador.usuario?.nombre} ${
                    jugador.usuario?.apellido ? jugador.usuario?.apellido : ''
                  } - ${jugador.equipo?.nombre} (${jugador.posicion})`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left">Estadísticas</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="goles" label="⚽ Goles">
                <InputNumber style={{ width: '100%' }} min={0} max={20} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="asistencias" label="🎯 Asistencias">
                <InputNumber style={{ width: '100%' }} min={0} max={20} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="atajadas" label="🧤 Atajadas">
                <InputNumber style={{ width: '100%' }} min={0} max={50} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tarjetasAmarillas" label="🟨 T. Amarillas">
                <InputNumber style={{ width: '100%' }} min={0} max={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tarjetasRojas" label="🟥 T. Rojas">
                <InputNumber style={{ width: '100%' }} min={0} max={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="minutosJugados" label="⏱️ Minutos">
                <InputNumber style={{ width: '100%' }} min={0} max={120} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button
                onClick={() => {
                  setModalForm(false);
                  setEditingId(null);
                  form.resetFields();
                }}
              >
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingId ? 'Guardar Cambios' : 'Crear Estadística'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EstadisticasPartidoModal;
