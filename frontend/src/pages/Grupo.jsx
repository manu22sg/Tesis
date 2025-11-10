import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Popconfirm,
  Tag,
  Empty,
  Row,
  Col,
  Pagination,
  ConfigProvider,
  Tooltip
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  obtenerGrupos,
  crearGrupo,
  actualizarGrupo,
  eliminarGrupo
} from '../services/grupo.services.js';
import MainLayout from '../components/MainLayout.jsx';

const { TextArea } = Input;

export default function Grupos() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState('');

  // Paginación
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    cargarGrupos(1, 10, filtroNombre);
  }, []);

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination({ ...pagination, current: 1 });
      cargarGrupos(1, pagination.pageSize, filtroNombre);
    }, 300); // Espera 300ms después de que el usuario deja de escribir

    return () => clearTimeout(timer);
  }, [filtroNombre]);

  const cargarGrupos = async (page = 1, limit = 10, nombre = '') => {
    try {
      setLoading(true);
      const resultado = await obtenerGrupos({ page, limit, nombre });
      
     
      
      // Manejar diferentes formatos de respuesta
      const gruposData = resultado?.grupos || resultado?.data?.grupos || resultado?.data || [];
      const paginationData = resultado?.pagination || resultado?.data?.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: Array.isArray(gruposData) ? gruposData.length : 0,
        itemsPerPage: limit
      };
      
    
      
      setGrupos(Array.isArray(gruposData) ? gruposData : []);
      setPagination({
        current: paginationData.currentPage || page,
        pageSize: paginationData.itemsPerPage || limit,
        total: paginationData.totalItems || 0
      });
      
    } catch (error) {
      message.error('Error al cargar los grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoGrupo = () => {
    setEditando(false);
    setGrupoEditando(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditarGrupo = (grupo) => {
    setEditando(true);
    setGrupoEditando(grupo);
    form.setFieldsValue({
      nombre: grupo.nombre,
      descripcion: grupo.descripcion
    });
    setModalVisible(true);
  };

  const handleGuardarGrupo = async () => {
    try {
      const valores = await form.validateFields();
      setGuardando(true);

      if (editando && grupoEditando) {
        await actualizarGrupo(grupoEditando.id, valores);
        message.success('Grupo actualizado correctamente');
      } else {
        await crearGrupo(valores);
        message.success('Grupo creado correctamente');
      }

      setModalVisible(false);
      form.resetFields();
      cargarGrupos(pagination.current, pagination.pageSize, filtroNombre);
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      console.error('Error guardando grupo:', error);
      message.error(
        error.response?.data?.message || 
        `Error al ${editando ? 'actualizar' : 'crear'} el grupo`
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarGrupo = async (id) => {
    try {
      await eliminarGrupo(id);
      message.success('Grupo eliminado correctamente');
      cargarGrupos(pagination.current, pagination.pageSize, filtroNombre);
    } catch (error) {
      console.error('Error eliminando grupo:', error);
      message.error(
        error.response?.data?.message || 
        'Error al eliminar el grupo'
      );
    }
  };

  const handleVerMiembros = (grupoId) => {
    navigate(`/grupos/${grupoId}/miembros`);
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
    cargarGrupos(page, pageSize, filtroNombre);
  };

  const handleLimpiarFiltro = () => {
    setFiltroNombre('');
  };

  const columns = [
    
    {
      title: 'Nombre del Grupo',
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
      title: 'Miembros',
      key: 'miembros',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <UserOutlined style={{ color: '#52c41a' }} />
          <strong style={{ fontSize: 16 }}>{record.jugadorGrupos?.length || 0}</strong>
        </div>
      ),
      width: 120,
      align: 'center',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver Miembros" placement="top">
            <Button
              type="primary"
              size="middle"
              icon={<EyeOutlined />}
              onClick={() => handleVerMiembros(record.id)}
            />
          </Tooltip>
          <Tooltip title="Editar" placement="top">
            <Button
              size="middle"
              icon={<EditOutlined />}
              onClick={() => handleEditarGrupo(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar grupo?"
            description="Los jugadores no se eliminarán"
            onConfirm={() => handleEliminarGrupo(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar" placement="top">
              <Button 
                danger 
                size="middle" 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      align: 'center',
    },
  ];

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <Card 
          title={<><TeamOutlined /> Gestión de Grupos</>} 
          variant="filled"
        >
          {/* Filtros y Acciones */}
          <Card style={{ marginBottom: '1rem', backgroundColor: '#fafafa' }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Input
                  placeholder="Buscar por nombre de grupo..."
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                  prefix={<SearchOutlined />}
                  allowClear
                  style={{ maxWidth: '400px' }}
                />
              </Col>
              <Col>
                <Space>
                  {filtroNombre && (
                    <Button onClick={handleLimpiarFiltro}>
                      Limpiar Filtro
                    </Button>
                  )}
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => cargarGrupos(pagination.current, pagination.pageSize, filtroNombre)}
                    loading={loading}
                  >
                    Actualizar
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleNuevoGrupo}
                  >
                    Nuevo Grupo
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Tabla */}
          <Card>
            <Table
              columns={columns}
              dataSource={grupos}
              rowKey="id"
              loading={loading}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty description="No hay grupos creados">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleNuevoGrupo}
                    >
                      Crear Grupo
                    </Button>
                  </Empty>
                ),
              }}
            />

            {/* Paginación externa */}
            {pagination.total > 0 && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total) => `Total: ${total} grupos`}
                  pageSizeOptions={['5', '10', '20', '50']}
                />
              </div>
            )}
          </Card>

          {/* Modal Crear/Editar */}
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TeamOutlined />
                <span>{editando ? 'Editar Grupo' : 'Nuevo Grupo'}</span>
              </div>
            }
            open={modalVisible}
            onCancel={() => {
              setModalVisible(false);
              form.resetFields();
            }}
            footer={[
              <Button
                key="cancel"
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancelar
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={guardando}
                onClick={handleGuardarGrupo}
              >
                {editando ? 'Actualizar' : 'Crear'}
              </Button>,
            ]}
            width={600}
          >
            <Form
              form={form}
              layout="vertical"
              style={{ marginTop: 16 }}
            >
              <Form.Item
                label="Nombre del Grupo"
                name="nombre"
                rules={[
                  { required: true, message: 'El nombre es requerido' },
                  { max: 50, message: 'Máximo 50 caracteres' }
                ]}
              >
                <Input
                  placeholder="Ej: Equipo A, Sub-20, Varones, etc."
                  size="large"
                  prefix={<TeamOutlined />}
                />
              </Form.Item>

              <Form.Item
                label="Descripción"
                name="descripcion"
                rules={[
                  { max: 255, message: 'Máximo 255 caracteres' }
                ]}
              >
                <TextArea
                  placeholder="Descripción opcional del grupo"
                  rows={4}
                  showCount
                  maxLength={255}
                />
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      </ConfigProvider>
    </MainLayout>
  );
}