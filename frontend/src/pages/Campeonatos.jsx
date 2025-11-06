import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Tag,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Badge,
  Empty,
  Drawer,
  Descriptions,
  ConfigProvider,
  Pagination
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  FireOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { campeonatoService } from '../services/campeonato.services.js';
import { obtenerCanchas } from '../services/cancha.services.js';
import { useAuth } from '../context/AuthContext.jsx';
import EquipoManager from '../components/EquipoManager.jsx';
import PartidoManager from '../components/PartidoManager.jsx';
import MainLayout from '../components/MainLayout.jsx';
import { Tabs } from 'antd';

const { Option } = Select;

export default function Campeonatos() {
  const { usuario } = useAuth();
  const [campeonatos, setCampeonatos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [campeonatoDetalle, setCampeonatoDetalle] = useState(null);
  const [form] = Form.useForm();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const cargarCampeonatos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await campeonatoService.listar();
      setCampeonatos(data);
      setPagination({
        current: 1,
        pageSize: 10,
        total: data.length || 0
      });
    } catch (error) {
      message.error('Error al cargar campeonatos');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarCanchas = useCallback(async () => {
    try {
      const resultado = await obtenerCanchas({ page: 1, limit: 100 });
      const lista = resultado?.canchas || resultado || [];
      setCanchas(lista);
    } catch (error) {
      console.error('Error al cargar canchas:', error);
    }
  }, []);

  useEffect(() => {
    cargarCampeonatos();
    cargarCanchas();
  }, [cargarCampeonatos, cargarCanchas]);

  const abrirModal = (registro = null) => {
    if (registro) {
      setEditingId(registro.id);
      form.setFieldsValue({
        nombre: registro.nombre,
        formato: registro.formato,
        genero: registro.genero,
        anio: registro.anio,
        semestre: registro.semestre,
        estado: registro.estado
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({
        anio: new Date().getFullYear(),
        semestre: Math.ceil((new Date().getMonth() + 1) / 6)
      });
    }
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingId) {
        await campeonatoService.actualizar(editingId, values);
        message.success('Campeonato actualizado exitosamente');
      } else {
        const payload = {
          ...values,
          entrenadorId: usuario?.id || usuario?.usuarioId
        };
        await campeonatoService.crear(payload);
        message.success('Campeonato creado exitosamente');
      }
      cerrarModal();
      cargarCampeonatos();
    } catch {
      message.error('Error al guardar campeonato');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await campeonatoService.eliminar(id);
      message.success('Campeonato eliminado');
      cargarCampeonatos();
    } catch {
      message.error('Error al eliminar');
    }
  };

  const verDetalle = async (id) => {
    setLoading(true);
    try {
      const data = await campeonatoService.obtener(id);
      setCampeonatoDetalle(data);
      setDrawerVisible(true);
    } catch {
      message.error('Error al cargar detalle');
    } finally {
      setLoading(false);
    }
  };

  const sortearPrimeraRonda = async (id) => {
    setLoading(true);
    try {
      await campeonatoService.sortearPrimeraRonda(id);
      message.success('Primera ronda sorteada');
      cargarCampeonatos();
    } catch {
      message.error('Error al sortear ronda');
    } finally {
      setLoading(false);
    }
  };

  const generarSiguienteRonda = async (id) => {
    Modal.confirm({
      title: 'Generar Siguiente Ronda',
      content: <Input placeholder="Número de ronda anterior" type="number" id="rondaAnteriorInput" />,
      onOk: async () => {
        const input = document.getElementById('rondaAnteriorInput');
        const ronda = input?.value;
        if (!ronda) return message.error('Debes ingresar un número de ronda');
        try {
          await campeonatoService.generarSiguienteRonda(id, parseInt(ronda));
          message.success('Siguiente ronda generada');
          cargarCampeonatos();
        } catch {
          message.error('Error al generar ronda');
        }
      }
    });
  };

  const getEstadoColor = (estado) => {
    const colors = {
      creado: 'blue',
      en_juego: 'green',
      finalizado: 'default',
      cancelado: 'red'
    };
    return colors[estado] || 'default';
  };

  const columns = useMemo(() => [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre) => <strong>{nombre}</strong>
    },
    {
      title: 'Formato',
      dataIndex: 'formato',
      render: (formato) => <Tag color="purple">{formato}</Tag>
    },
    {
      title: 'Género',
      dataIndex: 'genero',
      render: (genero) => (
        <Tag color={genero === 'masculino' ? 'blue' : genero === 'femenino' ? 'pink' : 'orange'}>
          {genero.charAt(0).toUpperCase() + genero.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Año/Semestre',
      render: (_, record) => `${record.anio} - S${record.semestre}`
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (estado) => <Tag color={getEstadoColor(estado)}>{estado}</Tag>
    },
    {
      title: 'Equipos',
      render: (_, record) => (
        <Badge count={record.equipos?.length || 0} showZero color="blue">
          <TeamOutlined />
        </Badge>
      )
    },
    {
      title: 'Partidos',
      render: (_, record) => (
        <Badge count={record.partidos?.length || 0} showZero color="green">
          <CalendarOutlined />
        </Badge>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalle">
            <Button type="text" icon={<EyeOutlined />} onClick={() => verDetalle(record.id)} />
          </Tooltip>
          <Tooltip title="Editar">
            <Button type="text" icon={<EditOutlined />} onClick={() => abrirModal(record)} />
          </Tooltip>
          <Tooltip title="Sortear Primera Ronda">
            <Button
              type="text"
              icon={<ThunderboltOutlined />}
              onClick={() => sortearPrimeraRonda(record.id)}
              disabled={record.estado !== 'creado'}
            />
          </Tooltip>
          <Tooltip title="Generar Siguiente Ronda">
            <Button
              type="text"
              icon={<PlayCircleOutlined />}
              onClick={() => generarSiguienteRonda(record.id)}
              disabled={record.estado !== 'en_juego'}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar campeonato?"
            onConfirm={() => handleEliminar(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Eliminar">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ], []);

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <Card title={<><TrophyOutlined /> Gestión de Campeonatos</>} variant="filled">
          {/* Filtros y acciones */}
          <Card style={{ marginBottom: '1rem', backgroundColor: '#fafafa' }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Space>
                  <span>Filtrar por formato:</span>
                  <Select
                    style={{ width: 150 }}
                    placeholder="Todos"
                    allowClear
                    onChange={(value) => {
                      if (!value) return cargarCampeonatos();
                      const filtrado = campeonatos.filter(c => c.formato === value);
                      setCampeonatos(filtrado);
                    }}
                  >
                    <Option value="5v5">5v5</Option>
                    <Option value="7v7">7v7</Option>
                    <Option value="11v11">11v11</Option>
                  </Select>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={cargarCampeonatos} loading={loading}>
                    Actualizar
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
                    Nuevo Campeonato
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Tabla principal */}
          <Card>
            <Table
              columns={columns}
              dataSource={campeonatos}
              loading={loading}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1000 }}
              size="middle"
              locale={{ emptyText: <Empty description="No hay campeonatos" /> }}
            />

            {campeonatos.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  showSizeChanger
                  showTotal={(total) => `Total: ${total} campeonatos`}
                  pageSizeOptions={['5', '10', '20']}
                  onChange={(page, size) => setPagination({ ...pagination, current: page, pageSize: size })}
                />
              </div>
            )}
          </Card>

          {/* Modal Crear/Editar */}
          <Modal
            title={editingId ? 'Editar Campeonato' : 'Nuevo Campeonato'}
            open={modalVisible}
            onCancel={cerrarModal}
            footer={null}
            width={600}
          >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="nombre"
                label="Nombre del Campeonato"
                rules={[{ required: true, message: 'Campo obligatorio' }]}
              >
                <Input placeholder="Ej: Copa Primavera" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="formato" label="Formato" rules={[{ required: true }]}>
                    <Select>
                      <Option value="5v5">5v5</Option>
                      <Option value="7v7">7v7</Option>
                      <Option value="11v11">11v11</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="genero" label="Género" rules={[{ required: true }]}>
                    <Select>
                      <Option value="masculino">Masculino</Option>
                      <Option value="femenino">Femenino</Option>
                      <Option value="mixto">Mixto</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="anio" label="Año" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={2020} max={2100} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="semestre" label="Semestre" rules={[{ required: true }]}>
                    <Select>
                      <Option value={1}>Semestre 1</Option>
                      <Option value={2}>Semestre 2</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={cerrarModal}>Cancelar</Button>
                  <Button type="primary" htmlType="submit">
                    {editingId ? 'Guardar Cambios' : 'Crear Campeonato'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Drawer Detalle */}
          <Drawer
            title={
              <Space>
                <TrophyOutlined />
                <span>Detalle del Campeonato</span>
              </Space>
            }
            width={1000}
            open={drawerVisible}
            onClose={() => {
              setDrawerVisible(false);
              setCampeonatoDetalle(null);
            }}
          >
            {campeonatoDetalle && (
              <Tabs
                defaultActiveKey="1"
                items={[
                  {
                    key: '1',
                    label: (
                      <span>
                        <InfoCircleOutlined /> Información
                      </span>
                    ),
                    children: (
                      <>
                        <Descriptions bordered column={1} size="small">
                          <Descriptions.Item label="Nombre">{campeonatoDetalle.nombre}</Descriptions.Item>
                          <Descriptions.Item label="Formato">{campeonatoDetalle.formato}</Descriptions.Item>
                          <Descriptions.Item label="Género">{campeonatoDetalle.genero}</Descriptions.Item>
                          <Descriptions.Item label="Año/Semestre">
                            {campeonatoDetalle.anio} - S{campeonatoDetalle.semestre}
                          </Descriptions.Item>
                          <Descriptions.Item label="Estado">
                            <Tag color={getEstadoColor(campeonatoDetalle.estado)}>
                              {campeonatoDetalle.estado}
                            </Tag>
                          </Descriptions.Item>
                        </Descriptions>

                        <Card title="Equipos Participantes" style={{ marginTop: 16 }}>
                          {campeonatoDetalle.equipos?.length > 0 ? (
                            <ul>
                              {campeonatoDetalle.equipos.map((eq) => (
                                <li key={eq.id}>
                                  <TeamOutlined /> {eq.nombre}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <Empty description="No hay equipos registrados" />
                          )}
                        </Card>
                      </>
                    )
                  },
                  {
                    key: '2',
                    label: (
                      <span>
                        <TeamOutlined /> Equipos
                      </span>
                    ),
                    children: (
                      <EquipoManager
                        campeonatoId={campeonatoDetalle.id}
                        campeonatoInfo={campeonatoDetalle}
                        onUpdate={() => verDetalle(campeonatoDetalle.id)}
                      />
                    )
                  },
                  {
                    key: '3',
                    label: (
                      <span>
                        <FireOutlined /> Fixture
                      </span>
                    ),
                    children: (
                      <PartidoManager
                        campeonatoId={campeonatoDetalle.id}
                        canchas={canchas}
                        onUpdate={() => verDetalle(campeonatoDetalle.id)}
                      />
                    )
                  }
                ]}
              />
            )}
          </Drawer>
        </Card>
      </ConfigProvider>
    </MainLayout>
  );
}
