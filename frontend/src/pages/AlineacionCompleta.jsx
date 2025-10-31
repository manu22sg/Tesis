import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Tag, Button, Space, message, Empty, Tooltip,
  Modal, Form, Select, InputNumber, Input, Spin, Popconfirm,
  Tabs, Row, Col, Statistic, ConfigProvider, Typography, Alert
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, TeamOutlined,
  UserAddOutlined, FieldTimeOutlined, TableOutlined,
  AimOutlined, TrophyOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import {
  crearAlineacion,
  obtenerAlineacionPorSesion,
  agregarJugadorAlineacion,
  actualizarJugadorAlineacion,
  quitarJugadorAlineacion,
  eliminarAlineacion,
  actualizarPosicionesJugadores
} from '../services/alineacion.services.js';
import { obtenerJugadores } from '../services/jugador.services.js';
import { obtenerSesionPorId } from '../services/sesion.services.js';
import MainLayout from '../components/MainLayout.jsx';
import CampoAlineacion from '../components/CampoAlineacion.jsx';

const { TextArea } = Input;
const { Text } = Typography;

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

export default function AlineacionCompleta() {
  const { sesionId } = useParams();
  const navigate = useNavigate();

  // 🔍 Debug inicial
  
  const [loading, setLoading] = useState(false);
  const [alineacion, setAlineacion] = useState(null);
  const [sesionInfo, setSesionInfo] = useState(null);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [jugadorEditando, setJugadorEditando] = useState(null);
  const [vistaActual, setVistaActual] = useState('campo');
  const [form] = Form.useForm();
  const [formEdit] = Form.useForm();

  // Primero carga la sesión
useEffect(() => {
  if (sesionId) {
    cargarSesion();
  }
}, [sesionId]);

// Cuando ya tenga la sesión cargada, recién carga los jugadores y la alineación
useEffect(() => {
  if (sesionInfo) {
    cargarJugadores();
    cargarAlineacion();
  }
}, [sesionInfo]);

  const cargarSesion = async () => {
    try {
      const sesion = await obtenerSesionPorId(parseInt(sesionId, 10));
      setSesionInfo(sesion);
    } catch (error) {
      console.error('Error cargando sesión:', error);
      message.error('Error al cargar información de la sesión');
    }
  };

  const cargarAlineacion = async () => {
  setLoading(true);
  try {
    const response = await obtenerAlineacionPorSesion(parseInt(sesionId, 10));
    if (response?.data) {
      setAlineacion(response.data);
    } else {
      setAlineacion(null);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      setAlineacion(null);
    } else {
      message.error('Error al cargar alineación');
      console.error('Error al cargar alineación:', error);
    }
  } finally {
    setLoading(false);
  }
};


 const cargarJugadores = async () => {
  try {
    // Espera a que exista el grupo de la sesión
    const grupoId = sesionInfo?.grupo?.id;
    if (!grupoId) {
      setJugadoresDisponibles([]);
      return;
    }

    const data = await obtenerJugadores({ limite: 100, grupoId });
    setJugadoresDisponibles(data.jugadores || []);
  } catch (error) {
    message.error('Error al cargar jugadores del grupo');
    console.error('Error al cargar jugadores:', error);
  }
};


  const handleCrearAlineacion = async () => {
    setLoading(true);
    try {
      await crearAlineacion({
        sesionId: parseInt(sesionId, 10),
        generadaAuto: false,
        jugadores: []
      });
      
      message.success('Alineación creada exitosamente');
      cargarAlineacion();
    } catch (error) {
      console.error('Error al crear alineación:', error);
      message.error(error.response?.data?.message || 'Error al crear la alineación');
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

  // Estadísticas
  const calcularEstadisticas = () => {
    if (!alineacion?.jugadores) return { total: 0, posiciones: {} };
    
    const stats = {
      total: alineacion.jugadores.length,
      posiciones: {}
    };

    alineacion.jugadores.forEach(j => {
      const pos = j.posicion || 'Sin posición';
      stats.posiciones[pos] = (stats.posiciones[pos] || 0) + 1;
    });

    return stats;
  };

  const stats = calcularEstadisticas();

  const columns = [
    {
      title: '#',
      dataIndex: 'orden',
      key: 'orden',
      width: 60,
      sorter: (a, b) => (a.orden || 999) - (b.orden || 999),
      render: (orden) => orden ? <Tag color="blue">#{orden}</Tag> : <Text type="secondary">—</Text>
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
      render: (posicion) => <Tag color="green">{posicion}</Tag>
    },
    {
      title: 'Comentario',
      dataIndex: 'comentario',
      key: 'comentario',
      render: (comentario) => comentario || <Text type="secondary">—</Text>
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button 
              type="link" 
              size="small"
              icon={<EditOutlined />} 
              onClick={() => abrirModalEditar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Quitar este jugador?"
            onConfirm={() => handleQuitarJugador(record.jugadorId)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Quitar">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading && !alineacion) {
    return (
      <MainLayout>
        <ConfigProvider locale={locale}>
          <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Card>
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Cargando alineación...</p>
              </div>
            </Card>
          </div>
        </ConfigProvider>
      </MainLayout>
    );
  }

  if (!alineacion) {
    return (
      <MainLayout>
        <ConfigProvider locale={locale}>
          <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/sesiones')}
              style={{ marginBottom: 16 }}
            >
              Volver a Sesiones
            </Button>

            {sesionInfo && (
              <Alert
                message={`Sesión: ${sesionInfo.fecha} - ${sesionInfo.horaInicio} a ${sesionInfo.horaFin}`}
                description={`Grupo: ${sesionInfo.grupo?.nombre || 'Sin grupo'} | Cancha: ${sesionInfo.cancha?.nombre || 'Sin cancha'}`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                imageStyle={{ height: 100 }}
                description={
                  <div>
                    <h3>No hay alineación creada para esta sesión</h3>
                  </div>
                }
              >
                <Button 
                  type="primary" 
                  size="large"
                  icon={<PlusOutlined />} 
                  onClick={handleCrearAlineacion}
                >
                  Crear Alineación
                </Button>
              </Empty>
            </Card>
          </div>
        </ConfigProvider>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/sesiones')}
            style={{ marginBottom: 16 }}
          >
            Volver a Sesiones
          </Button>

          {sesionInfo && (
            <Alert
              message={`Sesión: ${sesionInfo.fecha} - ${sesionInfo.horaInicio} a ${sesionInfo.horaFin}`}
              description={`Grupo: ${sesionInfo.grupo?.nombre || 'Sin grupo'} | Cancha: ${sesionInfo.cancha?.nombre || 'Sin cancha'}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Header con estadísticas */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Total Jugadores"
                  value={stats.total}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Posiciones"
                  value={Object.keys(stats.posiciones).length}
                  prefix={<AimOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Card>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#999' }}>Estado</div>
                    {alineacion.generadaAuto ? (
                      <Tag color="purple" icon={<TrophyOutlined />}>
                        Auto-generada
                      </Tag>
                    ) : (
                      <Tag color="blue">Manual</Tag>
                    )}
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Contenido principal */}
          <Card
            title={
              <Space>
                <FieldTimeOutlined />
                <span>Alineación</span>
              </Space>
            }
            extra={
              <Space wrap>
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
                  description="Esta acción eliminará todos los jugadores"
                  onConfirm={handleEliminarAlineacion}
                  okText="Sí, eliminar"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Eliminar
                  </Button>
                </Popconfirm>
              </Space>
            }
          >
            {alineacion.jugadores && alineacion.jugadores.length > 0 ? (
              <Tabs 
                activeKey={vistaActual} 
                onChange={setVistaActual}
                items={[
                  {
                    key: 'campo',
                    label: (
                      <span>
                        <AimOutlined />
                        Vista Campo
                      </span>
                    ),
                    children: (
  <CampoAlineacion 
    jugadores={alineacion.jugadores}
    onActualizarPosiciones={async (jugadoresActualizados) => {
      try {
        const response = await actualizarPosicionesJugadores(alineacion.id, jugadoresActualizados);
        message.success('✅ Posiciones guardadas correctamente');
        setAlineacion(response.data); // refresca el estado con la versión del backend
      } catch (error) {
        console.error('Error al guardar posiciones:', error);
        message.error(error.response?.data?.message || '❌ Error al guardar posiciones');
      }
    }}
  />
),
                  },
                  {
                    key: 'tabla',
                    label: (
                      <span>
                        <TableOutlined />
                        Vista Tabla
                      </span>
                    ),
                    children: (
                      <Table
                        columns={columns}
                        dataSource={alineacion.jugadores}
                        rowKey={(record) => `${record.alineacionId}-${record.jugadorId}`}
                        pagination={false}
                        loading={loading}
                        scroll={{ x: 800 }}
                      />
                    )
                  }
                ]}
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
            title={
              <Space>
                <UserAddOutlined />
                Agregar Jugador a la Alineación
              </Space>
            }
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
  optionFilterProp="label"
  filterOption={(input, option) =>
    option?.label?.toLowerCase().includes(input.toLowerCase())
  }
  options={jugadoresFiltrados.map(j => ({
    label: `${j.usuario?.nombre || ''} ${j.usuario?.apellido || ''} - ${j.usuario?.rut || 'Sin RUT'}`,
    value: j.id,
  }))}
/>
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
                label="Número / Orden"
                tooltip="Número de dorsal o posición en el orden (opcional)"
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
                  placeholder="Ej: Capitán, Suplente, Titular, etc."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => {
                    setModalVisible(false);
                    form.resetFields();
                  }}>
                    Cancelar
                  </Button>
                  <Button type="primary" htmlType="submit">
                    Agregar Jugador
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal Editar Jugador */}
          <Modal
            title={
              <Space>
                <EditOutlined />
                Editar Jugador en Alineación
              </Space>
            }
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
                label="Número / Orden"
              >
                <InputNumber 
                  min={1} 
                  style={{ width: '100%' }} 
                  placeholder="Número de orden"
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
                  showCount
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => {
                    setModalEditVisible(false);
                    setJugadorEditando(null);
                    formEdit.resetFields();
                  }}>
                    Cancelar
                  </Button>
                  <Button type="primary" htmlType="submit">
                    Guardar Cambios
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}