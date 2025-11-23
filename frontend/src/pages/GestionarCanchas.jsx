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
  Tag,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Badge,
  Alert,
  ConfigProvider,
  Pagination,
  Empty,App
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
  AppstoreOutlined,
  SearchOutlined,
  ClearOutlined
} from '@ant-design/icons';
import {
  crearCancha,
  obtenerCanchas,
  actualizarCancha,
  eliminarCancha,
  reactivarCancha,
  exportarCanchasExcel,
  exportarCanchasPDF

} from '../services/cancha.services.js';
import MainLayout from '../components/MainLayout.jsx';

const { TextArea } = Input;
const { Option } = Select;

export default function GestionCanchas() {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [qDebounced, setQDebounced] = useState('');

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });

  //  Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(busqueda.trim()), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  //  Cargar canchas desde backend
  const cargarCanchas = useCallback(async (page = 1, limit = 5, estado = undefined, q = '') => {
    setLoading(true);
    try {
      const { canchas, pagination } = await obtenerCanchas({
        page,
        limit,
        estado,
        q
      });

      setCanchas(canchas);
      setPagination({
        current: pagination.currentPage || page,
        pageSize: pagination.itemsPerPage || limit,
        total: pagination.totalItems || canchas.length
      });
    } catch (error) {
      console.error('Error cargando canchas:', error);
      message.error(error.message || 'Error al cargar canchas');
    } finally {
      setLoading(false);
    }
  }, []);

  //  Re-cargar al cambiar filtros o paginación
  useEffect(() => {
    const estado = filtroEstado === 'todos' ? undefined : filtroEstado;
    cargarCanchas(pagination.current, pagination.pageSize, estado, qDebounced);
  }, [filtroEstado, qDebounced, pagination.current, pagination.pageSize, cargarCanchas]);

  //  Modal crear/editar
  const abrirModalCrear = () => {
    setModalMode('crear');
    setCanchaSeleccionada(null);
    form.resetFields();
    setModalVisible(true);
  };

  const abrirModalEditar = (cancha) => {
    setModalMode('editar');
    setCanchaSeleccionada(cancha);
    form.setFieldsValue({
      nombre: cancha.nombre,
      descripcion: cancha.descripcion,
      capacidadMaxima: cancha.capacidadMaxima,
      estado: cancha.estado
    });
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setCanchaSeleccionada(null);
    form.resetFields();
  };

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
      const estado = filtroEstado === 'todos' ? undefined : filtroEstado;
      cargarCanchas(pagination.current, pagination.pageSize, estado, qDebounced);
    } catch (error) {
      message.error(error || 'Error al guardar la cancha');
    }
  };

  //  Eliminar / Reactivar
  const handleEliminar = async (id) => {
    try {
      await eliminarCancha(id);
      message.success('Cancha eliminada exitosamente');
      const estado = filtroEstado === 'todos' ? undefined : filtroEstado;
      cargarCanchas(pagination.current, pagination.pageSize, estado, qDebounced);
    } catch (error) {
      message.error(error?.message || 'Error al eliminar cancha');
    }
  };

  const handleReactivar = async (id) => {
    try {
      await reactivarCancha(id);
      message.success('Cancha reactivada exitosamente');
      const estado = filtroEstado === 'todos' ? undefined : filtroEstado;
      cargarCanchas(pagination.current, pagination.pageSize, estado, qDebounced);
    } catch (error) {
      message.error(error?.message || 'Error al reactivar cancha');
    }
  };

  //  Paginación / filtros
  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
  };
  const handleExportExcel = async () => {
  try {
    const params = {};
    if (filtroEstado !== 'todos') params.estado = filtroEstado;
    if (qDebounced) params.q = qDebounced;

    const blob = await exportarCanchasExcel(params);
    descargarArchivo(blob, `canchas_${Date.now()}.xlsx`);
    message.success("Excel descargado correctamente");
  } catch (error) {
    console.error("Error al exportar Excel:", error);
    message.error(error.message || "Error al exportar Excel");
  }
};

const handleExportPDF = async () => {
  try {
    const params = {};
    if (filtroEstado !== 'todos') params.estado = filtroEstado;
    if (qDebounced) params.q = qDebounced;

    const blob = await exportarCanchasPDF(params);
    descargarArchivo(blob, `canchas_${Date.now()}.pdf`);
    message.success("PDF descargado correctamente");
  } catch (error) {
    console.error("Error al exportar PDF:", error);
    message.error(error.message || "Error al exportar PDF");
  }
};

function descargarArchivo(blob, nombre) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  window.URL.revokeObjectURL(url);
}


  const aplicarFiltro = (estado) => {
    setFiltroEstado(estado);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setBusqueda('');
    setQDebounced('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

 
  //  Render estado
  const renderEstadoTag = useCallback((estado) => {
  const map = {
    disponible: { icon: <CheckCircleOutlined />, text: 'Disponible' },
    mantenimiento: { icon: <ToolOutlined />, text: 'Mantenimiento' },
    fuera_servicio: { icon: <CloseCircleOutlined />, text: 'Fuera de Servicio' },
  };
  const { icon, text } = map[estado] || map.disponible;
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: '12px',
      fontWeight: 500,
      border: '1px solid #B9BBBB',
      backgroundColor: '#f5f5f5',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      {icon}
      {text}
    </span>
  );
}, []);


  //  Columnas tabla
  const columns = useMemo(() => [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (v) => <strong>{v}</strong>
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
      render: (v) => v || <span style={{ color: '#6F6F6F' }}>Sin descripción</span>
    },
    {
      title: 'Capacidad',
      dataIndex: 'capacidadMaxima',
      key: 'capacidadMaxima',
      align: 'center',
      render: (cap) => <Badge count={cap} showZero color="#014898" />
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
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button
              type="primary"
              size="middle"
              icon={<EditOutlined />}
              onClick={() => abrirModalEditar(r)}
            />
          </Tooltip>
          {r.estado === 'fuera_servicio' ? (
            <Popconfirm
              title="¿Reactivar esta cancha?"
              onConfirm={() => handleReactivar(r.id)}
              okText="Sí"
              cancelText="No"
            >
              <Tooltip title="Reactivar">
                <Button
                  type="default"
                  size="middle"
                  icon={<UndoOutlined />}
                  style={{ color: '#006B5B', borderColor: '#006B5B' }}
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="¿Eliminar esta cancha?"
              onConfirm={() => handleEliminar(r.id)}
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              cancelText="Cancelar"
            >
              <Tooltip title="Eliminar">
                <Button danger size="middle" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ], [renderEstadoTag]);

  const noResults = !loading && canchas.length === 0;

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <Card title={<><AppstoreOutlined /> Gestión de Canchas</>} variant="filled">
          
       <Card style={{ marginBottom: '1rem', backgroundColor: '#f5f5f5' }}>
  <Row gutter={[12, 12]} align="middle" justify="start">

    {/* Buscador */}
    <Col xs={24} md={7}>
      <Input
        placeholder="Buscar por nombre o descripción..."
        prefix={<SearchOutlined />}
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        onPressEnter={() => setQDebounced(busqueda.trim())}
        allowClear
      />
    </Col>

    {/*  Select Estado — más pegado */}
    <Col xs={24} md={4}>
      <Select
        style={{ width: '100%' }}
        value={filtroEstado}
        onChange={aplicarFiltro}
      >
        <Option value="todos">Todos los estados</Option>
        <Option value="disponible">Disponible</Option>
        <Option value="mantenimiento">Mantenimiento</Option>
        <Option value="fuera_servicio">Fuera de Servicio</Option>
      </Select>
    </Col>

    {/* Limpiar — aparece inmediatamente después del select */}
    <Col xs={24} md={3}>
      {(qDebounced || filtroEstado !== 'todos') && (
        <Button block onClick={limpiarFiltros}>
          Limpiar
        </Button>
      )}
    </Col>

    {/*  Exportar Excel */}
    <Col xs={24} md={3}>
      <Button block onClick={handleExportExcel}>
       Exportar Excel
      </Button>
    </Col>

    {/*  Exportar PDF */}
    <Col xs={24} md={3}>
      <Button block onClick={handleExportPDF}>
        Exportar PDF
      </Button>
    </Col>

    {/*  Nueva */}
    <Col xs={24} md={4}>
      <Button
        block
        type="primary"
        icon={<PlusOutlined />}
        onClick={abrirModalCrear}
      >
        Nueva Cancha
      </Button>
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
              size="middle"
              locale={{
                emptyText: noResults ? (
                  <Empty
                    description="Sin resultados para los filtros actuales"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    {(qDebounced || filtroEstado !== 'todos') && (
                      <Button onClick={limpiarFiltros} >
                        Limpiar filtros
                      </Button>
                    )}
                  </Empty>
                ) : undefined
              }}
            />

            {pagination.total > 0 && (
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

          {/*  Modal Crear/Editar */}
          <Modal
            title={modalMode === 'crear' ? (<><PlusOutlined /> Nueva Cancha</>) : (<><EditOutlined /> Editar Cancha</>)}
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
              <Form.Item label="Nombre de la Cancha" name="nombre" rules={[{ required: true, message: 'El nombre es obligatorio' }]}>
                <Input placeholder="Ej: Cancha de Fútbol Principal" />
              </Form.Item>

              <Form.Item label="Descripción" name="descripcion">
                <TextArea rows={3} placeholder="Descripción de la cancha (opcional)" />
              </Form.Item>

              <Form.Item label="Capacidad Máxima" name="capacidadMaxima" rules={[{ required: true, message: 'La capacidad es obligatoria' }]}>
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
}
