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
  Statistic,
  Pagination,
  ConfigProvider
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

  const cargarGrupos = async (page = 1, limit = 10, nombre = '') => {
    console.log('🔄 Frontend - Cargando grupos con:', { page, limit, nombre });
    try {
      setLoading(true);
      const resultado = await obtenerGrupos({ page, limit, nombre });
      
      console.log('📦 Frontend - Resultado completo:', resultado);
      console.log('📦 Frontend - resultado.data:', resultado.data);
      console.log('📦 Frontend - resultado.data.grupos:', resultado.data?.grupos);
      
      // Manejar diferentes formatos de respuesta
      const gruposData = resultado?.grupos || resultado?.data?.grupos || resultado?.data || [];
      const paginationData = resultado?.pagination || resultado?.data?.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: Array.isArray(gruposData) ? gruposData.length : 0,
        itemsPerPage: limit
      };
      
      console.log('✅ Frontend - gruposData extraído:', gruposData);
      console.log('✅ Frontend - gruposData es array?', Array.isArray(gruposData));
      console.log('✅ Frontend - gruposData.length:', gruposData.length);
      console.log('✅ Frontend - paginationData:', paginationData);
      
      setGrupos(Array.isArray(gruposData) ? gruposData : []);
      setPagination({
        current: paginationData.currentPage || page,
        pageSize: paginationData.itemsPerPage || limit,
        total: paginationData.totalItems || 0
      });
      
      console.log('✅ Frontend - Estado actualizado');
    } catch (error) {
      console.error('❌ Frontend - Error cargando grupos:', error);
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

  const handleBuscar = () => {
    setPagination({ ...pagination, current: 1 });
    cargarGrupos(1, pagination.pageSize, filtroNombre);
  };

  const handleLimpiarFiltro = () => {
    setFiltroNombre('');
    setPagination({ ...pagination, current: 1 });
    cargarGrupos(1, pagination.pageSize, '');
  };

  // Calcular estadísticas
  const totalMiembros = grupos.reduce((acc, g) => acc + (g.jugadorGrupos?.length || 0), 0);
  const promedioMiembros = grupos.length > 0 ? (totalMiembros / grupos.length).toFixed(1) : 0;
  const grupoMasGrande = grupos.length > 0 
    ? Math.max(...grupos.map(g => g.jugadorGrupos?.length || 0))
    : 0;

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70
    },
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
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleVerMiembros(record.id)}
          >
            Ver Miembros
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditarGrupo(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar grupo?"
            description="Los jugadores no se eliminarán"
            onConfirm={() => handleEliminarGrupo(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 340,
      align: 'center',
    },
  ];

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
          <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>
            <TeamOutlined /> Gestión de Grupos
          </h1>

          {/* Estadísticas */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total de Grupos"
                  value={grupos.length}
                  prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total de Miembros"
                  value={totalMiembros}
                  prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Promedio por Grupo"
                  value={promedioMiembros}
                  prefix={<TeamOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Grupo Más Grande"
                  value={grupoMasGrande}
                  prefix={<UserOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ color: '#ff4d4f' }}
                  suffix="miembros"
                />
              </Card>
            </Col>
          </Row>

          {/* Filtros y Acciones */}
          <Card style={{ marginBottom: '24px', backgroundColor: '#fafafa' }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Space.Compact style={{ width: '100%', maxWidth: '400px' }}>
                  <Input
                    placeholder="Buscar por nombre de grupo..."
                    value={filtroNombre}
                    onChange={(e) => setFiltroNombre(e.target.value)}
                    onPressEnter={handleBuscar}
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleBuscar}
                    loading={loading}
                  >
                    Buscar
                  </Button>
                </Space.Compact>
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
              scroll={{ x: 900 }}
              locale={{
                emptyText: (
                  <Empty description="No hay grupos creados">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleNuevoGrupo}
                    >
                      Crear Primer Grupo
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
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}