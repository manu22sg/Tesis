import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Alert,
  ConfigProvider,
  Pagination
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ToolOutlined,
  UndoOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import {
  crearCancha,
  obtenerCanchas,
  actualizarCancha,
  eliminarCancha,
  reactivarCancha
} from '../services/cancha.services.js';
import MainLayout from '../components/MainLayout.jsx';

const { TextArea } = Input;
const { Option } = Select;

const GestionCanchas = () => {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [form] = Form.useForm();

  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });

  // 🔄 Cargar canchas desde backend
  const cargarCanchas = useCallback(async (page = 1, limit = 5, estado = undefined) => {
    setLoading(true);
    try {
      const resultado = await obtenerCanchas({ page, limit, estado });
      
      const canchasData = resultado?.canchas || [];
      const paginationData = resultado?.pagination || {};
      
      setCanchas(canchasData);
      setPagination({
        current: page,
        pageSize: limit,
        total: paginationData?.totalItems || canchasData.length || 0
      });
    } catch (error) {
      console.error('❌ Error cargando canchas:', error);
      message.error('No se pudieron obtener las canchas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCanchas(1, 5, undefined); 
  }, [cargarCanchas]);

  // Crear / Editar
  const abrirModalCrear = useCallback(() => {
    setModalMode('crear');
    setCanchaSeleccionada(null);
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  const abrirModalEditar = useCallback((cancha) => {
    setModalMode('editar');
    setCanchaSeleccionada(cancha);
    form.setFieldsValue({
      nombre: cancha.nombre,
      descripcion: cancha.descripcion,
      capacidadMaxima: cancha.capacidadMaxima,
      estado: cancha.estado
    });
    setModalVisible(true);
  }, [form]);

  const cerrarModal = useCallback(() => {
    setModalVisible(false);
    setCanchaSeleccionada(null);
    form.resetFields();
  }, [form]);

  const handleSubmit = async (values) => {
    try {
      if (modalMode === 'crear') {
        await crearCancha(values);
        message.success('Cancha creada exitosamente');
      } else {
        await actualizarCancha(canchaSeleccionada.id, values);
        message.success('Cancha actualizada exitosamente');
      }
      cerrarModal();
      const estadoFiltro = filtroEstado === 'todos' ? undefined : filtroEstado;
      cargarCanchas(pagination.current, pagination.pageSize, estadoFiltro);
    } catch (error) {
      message.error(error);
    }
  };

  // Eliminar / Reactivar
  const handleEliminar = async (id) => {
    try {
      await eliminarCancha(id);
      message.success('Cancha eliminada exitosamente');
      const estadoFiltro = filtroEstado === 'todos' ? undefined : filtroEstado;
      cargarCanchas(pagination.current, pagination.pageSize, estadoFiltro);
    } catch (error) {
      message.error(error);
    }
  };

  const handleReactivar = async (id) => {
    try {
      await reactivarCancha(id);
      message.success('Cancha reactivada exitosamente');
      const estadoFiltro = filtroEstado === 'todos' ? undefined : filtroEstado;
      cargarCanchas(pagination.current, pagination.pageSize, estadoFiltro);
    } catch (error) {
      message.error(error);
    }
  };

  const handlePageChange = useCallback((page, pageSize) => {
    setPagination({ current: page, pageSize, total: pagination.total });
    const estadoFiltro = filtroEstado === 'todos' ? undefined : filtroEstado;
    cargarCanchas(page, pageSize, estadoFiltro);
  }, [filtroEstado, cargarCanchas, pagination.total]);

  const aplicarFiltro = useCallback((estado) => {
    setFiltroEstado(estado);
    const estadoFiltro = estado === 'todos' ? undefined : estado;
    cargarCanchas(1, pagination.pageSize, estadoFiltro);
  }, [cargarCanchas, pagination.pageSize]);

  const renderEstadoTag = useCallback((estado) => {
    const estados = {
      disponible: { color: 'green', icon: <CheckCircleOutlined />, text: 'Disponible' },
      mantenimiento: { color: 'orange', icon: <ToolOutlined />, text: 'Mantenimiento' },
      fuera_servicio: { color: 'red', icon: <CloseCircleOutlined />, text: 'Fuera de Servicio' }
    };
    const config = estados[estado] || estados.disponible;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  }, []);

  const columns = useMemo(() => [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre) => <strong>{nombre}</strong>
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
      render: (descripcion) => descripcion || <span style={{ color: '#999' }}>Sin descripción</span>
    },
    {
      title: 'Capacidad',
      dataIndex: 'capacidadMaxima',
      key: 'capacidadMaxima',
      align: 'center',
      render: (capacidad) => (
        <Badge count={capacidad} showZero color="#1890ff" style={{ fontSize: 14 }} />
      )
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      align: 'center',
      render: (estado) => renderEstadoTag(estado)
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => abrirModalEditar(record)}
            />
          </Tooltip>

          {record.estado === 'fuera_servicio' ? (
            <Popconfirm
              title="¿Reactivar esta cancha?"
              onConfirm={() => handleReactivar(record.id)}
              okText="Sí"
              cancelText="No"
            >
              <Tooltip title="Reactivar">
                <Button
                  type="default"
                  size="small"
                  icon={<UndoOutlined />}
                  style={{ color: '#52c41a', borderColor: '#52c41a' }}
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="¿Eliminar esta cancha?"
              onConfirm={() => handleEliminar(record.id)}
              okText="Sí"
              cancelText="No"
            >
              <Tooltip title="Eliminar">
                <Button danger size="small" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ], [renderEstadoTag, abrirModalEditar]);

  const handleActualizar = useCallback(() => {
    const estadoFiltro = filtroEstado === 'todos' ? undefined : filtroEstado;
    cargarCanchas(pagination.current, pagination.pageSize, estadoFiltro);
  }, [filtroEstado, pagination.current, pagination.pageSize, cargarCanchas]);

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <Card title={<><AppstoreOutlined /> Gestión de Canchas</>} variant="filled">
          {/* Filtros y acciones */}
          <Card style={{ marginBottom: '1rem', backgroundColor: '#fafafa' }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Space>
                  <span>Filtrar por estado:</span>
                  <Select
                    style={{ width: 180 }}
                    value={filtroEstado}  
                    onChange={aplicarFiltro}
                  >
                    <Option value="todos">Todos los estados</Option>
                    <Option value="disponible">Disponible</Option>
                    <Option value="mantenimiento">Mantenimiento</Option>
                    <Option value="fuera_servicio">Fuera de Servicio</Option>
                  </Select>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleActualizar}
                    loading={loading}
                  >
                    Actualizar
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={abrirModalCrear}>
                    Nueva Cancha
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Tabla */}
          <Card>
            <Table
              columns={columns}
              dataSource={canchas}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 900 }}
              size="middle"
            />

            {/* Paginación uniforme */}
            {canchas.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total) => `Total: ${total} canchas`}
                  pageSizeOptions={['5', '10', '20']}
                />
              </div>
            )}
          </Card>

          {/* Modal Crear/Editar */}
          <Modal
            title={
              modalMode === 'crear' ? (
                <>
                  <PlusOutlined /> Nueva Cancha
                </>
              ) : (
                <>
                  <EditOutlined /> Editar Cancha
                </>
              )
            }
            open={modalVisible}
            onCancel={cerrarModal}
            footer={null}
            width={600}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ estado: 'disponible', capacidadMaxima: 12 }}
            >
              <Form.Item
                label="Nombre de la Cancha"
                name="nombre"
                rules={[{ required: true, message: 'El nombre es obligatorio' }]}
              >
                <Input placeholder="Ej: Cancha de Fútbol Principal" />
              </Form.Item>

              <Form.Item label="Descripción" name="descripcion">
                <TextArea rows={3} placeholder="Descripción de la cancha (opcional)" />
              </Form.Item>

              <Form.Item
                label="Capacidad Máxima"
                name="capacidadMaxima"
                rules={[{ required: true, message: 'La capacidad es obligatoria' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} max={100} />
              </Form.Item>

              <Form.Item label="Estado" name="estado" rules={[{ required: true }]}>
                <Select>
                  <Option value="disponible">Disponible</Option>
                  <Option value="mantenimiento">Mantenimiento</Option>
                  <Option value="fuera_servicio">Fuera de Servicio</Option>
                </Select>
              </Form.Item>

              {modalMode === 'editar' && (
                <Alert
                  message="Nota importante"
                  description="No podrás pasar a mantenimiento o fuera de servicio si hay reservas activas o sesiones programadas."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form.Item style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={cerrarModal}>Cancelar</Button>
                  <Button type="primary" htmlType="submit">
                    {modalMode === 'crear' ? 'Crear Cancha' : 'Guardar Cambios'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      </ConfigProvider>
    </MainLayout>
  );
};

export default GestionCanchas;