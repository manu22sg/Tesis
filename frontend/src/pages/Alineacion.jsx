import { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Space, 
  message, 
  Popconfirm, 
  Tag, 
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Spin,
  Empty,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  TeamOutlined,
  UserAddOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import {
  crearAlineacion,
  obtenerAlineacionPorSesion,
  agregarJugadorAlineacion,
  actualizarJugadorAlineacion,
  quitarJugadorAlineacion,
  eliminarAlineacion
} from '../services/alineacion.services.js';
import { obtenerJugadores } from '../services/jugador.services.js';

const { TextArea } = Input;

const POSICIONES = [
  'Portero',
  'Defensa Central',
  'Lateral Derecho',
  'Lateral Izquierdo',
  'Mediocentro Defensivo',
  'Mediocentro',
  'Mediocentro Ofensivo',
  'Extremo Derecho',
  'Extremo Izquierdo',
  'Delantero Centro'
];

const Alineacion = ({ sesionId, sesionNombre }) => {
  const [loading, setLoading] = useState(false);
  const [alineacion, setAlineacion] = useState(null);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [jugadorEditando, setJugadorEditando] = useState(null);
  const [form] = Form.useForm();
  const [formEdit] = Form.useForm();

  useEffect(() => {
    if (sesionId) {
      cargarAlineacion();
      cargarJugadores();
    }
  }, [sesionId]);

  const cargarAlineacion = async () => {
    setLoading(true);
    try {
      const response = await obtenerAlineacionPorSesion(sesionId);
      setAlineacion(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setAlineacion(null);
      } else {
        message.error('Error al cargar la alineación');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarJugadores = async () => {
    try {
      const response = await obtenerJugadores();
      setJugadoresDisponibles(response.data || []);
    } catch (error) {
      message.error('Error al cargar jugadores');
      console.error(error);
    }
  };

  const handleCrearAlineacion = async () => {
    setLoading(true);
    try {
      await crearAlineacion({
        sesionId,
        generadaAuto: false,
        jugadores: []
      });
      message.success('Alineación creada exitosamente');
      cargarAlineacion();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al crear la alineación');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarJugador = async (values) => {
    try {
      await agregarJugadorAlineacion({
        alineacionId: alineacion.id,
        ...values
      });
      message.success('Jugador agregado a la alineación');
      setModalVisible(false);
      form.resetFields();
      cargarAlineacion();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al agregar jugador');
      console.error(error);
    }
  };

  const handleActualizarJugador = async (values) => {
    try {
      await actualizarJugadorAlineacion({
        alineacionId: alineacion.id,
        jugadorId: jugadorEditando.jugadorId,
        ...values
      });
      message.success('Jugador actualizado');
      setModalEditVisible(false);
      setJugadorEditando(null);
      formEdit.resetFields();
      cargarAlineacion();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al actualizar jugador');
      console.error(error);
    }
  };

  const handleQuitarJugador = async (jugadorId) => {
    try {
      await quitarJugadorAlineacion(alineacion.id, jugadorId);
      message.success('Jugador removido de la alineación');
      cargarAlineacion();
    } catch (error) {
      message.error('Error al quitar jugador');
      console.error(error);
    }
  };

  const handleEliminarAlineacion = async () => {
    try {
      await eliminarAlineacion(alineacion.id);
      message.success('Alineación eliminada');
      setAlineacion(null);
    } catch (error) {
      message.error('Error al eliminar la alineación');
      console.error(error);
    }
  };

  const abrirModalEditar = (jugador) => {
    setJugadorEditando(jugador);
    formEdit.setFieldsValue({
      posicion: jugador.posicion,
      orden: jugador.orden,
      comentario: jugador.comentario
    });
    setModalEditVisible(true);
  };

  const jugadoresYaEnAlineacion = alineacion?.jugadores?.map(j => j.jugadorId) || [];
  const jugadoresFiltrados = jugadoresDisponibles.filter(
    j => !jugadoresYaEnAlineacion.includes(j.id)
  );

  const columns = [
    {
      title: '#',
      dataIndex: 'orden',
      key: 'orden',
      width: 60,
      sorter: (a, b) => (a.orden || 999) - (b.orden || 999),
      render: (orden) => orden || '-'
    },
    {
      title: 'Jugador',
      key: 'jugador',
      render: (_, record) => (
        <Space>
          <TeamOutlined />
          <span>
            {record.jugador?.usuario?.nombre} {record.jugador?.usuario?.apellido}
          </span>
        </Space>
      )
    },
    {
      title: 'Posición',
      dataIndex: 'posicion',
      key: 'posicion',
      render: (posicion) => <Tag color="blue">{posicion}</Tag>
    },
    {
      title: 'Comentario',
      dataIndex: 'comentario',
      key: 'comentario',
      render: (comentario) => comentario || '-'
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => abrirModalEditar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Quitar este jugador de la alineación?"
            onConfirm={() => handleQuitarJugador(record.jugadorId)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Quitar">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading && !alineacion) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Cargando alineación...</p>
        </div>
      </Card>
    );
  }

  if (!alineacion) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p>No hay alineación creada para esta sesión</p>
              <p style={{ color: '#999', fontSize: 12 }}>
                {sesionNombre && `Sesión: ${sesionNombre}`}
              </p>
            </div>
          }
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCrearAlineacion}
          >
            Crear Alineación
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <FieldTimeOutlined />
            <span>Alineación de la Sesión</span>
            {alineacion.generadaAuto && <Tag color="purple">Auto-generada</Tag>}
          </Space>
        }
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<UserAddOutlined />}
              onClick={() => setModalVisible(true)}
              disabled={jugadoresFiltrados.length === 0}
            >
              Agregar Jugador
            </Button>
            <Popconfirm
              title="¿Eliminar toda la alineación?"
              description="Esta acción no se puede deshacer"
              onConfirm={handleEliminarAlineacion}
              okText="Sí, eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />}>
                Eliminar Alineación
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        {alineacion.jugadores && alineacion.jugadores.length > 0 ? (
          <Table
            columns={columns}
            dataSource={alineacion.jugadores}
            rowKey={(record) => `${record.alineacionId}-${record.jugadorId}`}
            pagination={false}
            loading={loading}
          />
        ) : (
          <Empty description="No hay jugadores en la alineación">
            <Button 
              type="primary" 
              icon={<UserAddOutlined />}
              onClick={() => setModalVisible(true)}
            >
              Agregar Primer Jugador
            </Button>
          </Empty>
        )}
      </Card>

      {/* Modal Agregar Jugador */}
      <Modal
        title="Agregar Jugador a la Alineación"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAgregarJugador}
        >
          <Form.Item
            name="jugadorId"
            label="Jugador"
            rules={[{ required: true, message: 'Selecciona un jugador' }]}
          >
            <Select
              placeholder="Selecciona un jugador"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {jugadoresFiltrados.map(j => (
                <Select.Option key={j.id} value={j.id}>
                  {j.usuario?.nombre} {j.usuario?.apellido}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="posicion"
            label="Posición"
            rules={[{ required: true, message: 'Selecciona una posición' }]}
          >
            <Select placeholder="Selecciona una posición">
              {POSICIONES.map(pos => (
                <Select.Option key={pos} value={pos}>
                  {pos}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="orden"
            label="Orden"
            tooltip="Número de orden en la alineación (opcional)"
          >
            <InputNumber 
              min={1} 
              style={{ width: '100%' }} 
              placeholder="Ej: 1, 2, 3..."
            />
          </Form.Item>

          <Form.Item
            name="comentario"
            label="Comentario"
          >
            <TextArea 
              rows={3} 
              placeholder="Ej: Capitán, Suplente, etc."
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                Agregar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Editar Jugador */}
      <Modal
        title="Editar Jugador en Alineación"
        open={modalEditVisible}
        onCancel={() => {
          setModalEditVisible(false);
          setJugadorEditando(null);
          formEdit.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={formEdit}
          layout="vertical"
          onFinish={handleActualizarJugador}
        >
          <Form.Item
            name="posicion"
            label="Posición"
          >
            <Select placeholder="Selecciona una posición">
              {POSICIONES.map(pos => (
                <Select.Option key={pos} value={pos}>
                  {pos}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="orden"
            label="Orden"
          >
            <InputNumber 
              min={1} 
              style={{ width: '100%' }} 
              placeholder="Orden en la alineación"
            />
          </Form.Item>

          <Form.Item
            name="comentario"
            label="Comentario"
          >
            <TextArea 
              rows={3} 
              placeholder="Comentario adicional"
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setModalEditVisible(false);
                setJugadorEditando(null);
                formEdit.resetFields();
              }}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                Actualizar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Alineacion;