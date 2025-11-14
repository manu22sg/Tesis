import { useState, useEffect, useRef } from 'react';
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
  Empty,
  Row,
  Col,
  Pagination,
  ConfigProvider,
  Tooltip,
  Dropdown
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
  SearchOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  obtenerGrupos,
  crearGrupo,
  actualizarGrupo,
  eliminarGrupo,
  exportarGruposExcel,
  exportarGruposPDF
} from '../services/grupo.services.js';
import MainLayout from '../components/MainLayout.jsx';

const { TextArea } = Input;

export default function Grupos() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Filtro de búsqueda
  const [filtroNombre, setFiltroNombre] = useState('');
  const [qDebounced, setQDebounced] = useState('');

  // Paginación (consistente con backend)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Evitar carreras de requests
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(filtroNombre.trim()), 500);
    return () => clearTimeout(t);
  }, [filtroNombre]);

  // Cargar grupos (envía params compatibles con distintos backends)
  const cargarGrupos = async (page = 1, limit = pagination.pageSize, nombre = qDebounced) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    try {
      // Compatibilidad: algunos servicios usan page/limit/nombre; otros pagina/limite/q
      const params = {
        page,
        limit,
        nombre: nombre || undefined,
        pagina: page,
        limite: limit,
        q: nombre || undefined,
      };

      const resultado = await obtenerGrupos(params);
      if (reqId !== requestIdRef.current) return; // ignora respuestas viejas

      // Formatos de respuesta soportados
      const gruposData = resultado?.grupos
        || resultado?.data?.grupos
        || resultado?.data
        || [];

      const paginationData = resultado?.pagination
        || resultado?.data?.pagination
        || {
          currentPage: resultado?.pagina ?? page,
          itemsPerPage: resultado?.limite ?? limit,
          totalItems: resultado?.total ?? (Array.isArray(gruposData) ? gruposData.length : 0),
          totalPages: resultado?.totalPaginas ?? 1,
        };

      setGrupos(Array.isArray(gruposData) ? gruposData : []);
      setPagination({
        current: paginationData.currentPage || page,
        pageSize: paginationData.itemsPerPage || limit,
        total: paginationData.totalItems || 0,
      });
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error al cargar grupos:', error);
      message.error(error?.response?.data?.message || 'Error al cargar los grupos');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // Efecto único: primera carga + cambios de búsqueda (debounced) + cambio de pageSize
  useEffect(() => {
    // siempre reinicia a página 1 cuando cambia búsqueda o pageSize
    cargarGrupos(1, pagination.pageSize, qDebounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, pagination.pageSize]);

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
      cargarGrupos(pagination.current, pagination.pageSize, qDebounced);
    } catch (error) {
      if (error?.errorFields) return; // validación del form
      console.error('Error guardando grupo:', error);
      message.error(
        error?.response?.data?.message ||
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
      // si eliminas el último de la página, intenta retroceder de página
      const nextPage = grupos.length === 1 && pagination.current > 1
        ? pagination.current - 1
        : pagination.current;
      setPagination(prev => ({ ...prev, current: nextPage }));
      cargarGrupos(nextPage, pagination.pageSize, qDebounced);
    } catch (error) {
      console.error('Error eliminando grupo:', error);
      message.error(
        error?.response?.data?.message ||
        'Error al eliminar el grupo'
      );
    }
  };

  const handleVerMiembros = (grupoId) => {
    navigate(`/grupos/${grupoId}/miembros`);
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
    cargarGrupos(page, pageSize, qDebounced);
  };

  const handleLimpiarFiltro = () => {
    setFiltroNombre('');
  };

  // Funciones de exportación
  const handleExportarExcel = async () => {
    setExportando(true);
    try {
      const filtros = {
        nombre: qDebounced || undefined,
        q: qDebounced || undefined,
      };
      await exportarGruposExcel(filtros);
      message.success('Grupos exportados a Excel correctamente');
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      message.error(typeof error === 'string' ? error : 'Error al exportar grupos a Excel');
    } finally {
      setExportando(false);
    }
  };

  const handleExportarPDF = async () => {
    setExportando(true);
    try {
      const filtros = {
        nombre: qDebounced || undefined,
        q: qDebounced || undefined,
      };
      await exportarGruposPDF(filtros);
      message.success('Grupos exportados a PDF correctamente');
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      message.error(typeof error === 'string' ? error : 'Error al exportar grupos a PDF');
    } finally {
      setExportando(false);
    }
  };

  // Menú dropdown para exportación
  const menuExportar = {
    items: [
      {
        key: 'excel',
        label: 'Exportar a Excel',
        icon: <FileExcelOutlined />,
        onClick: handleExportarExcel,
      },
      {
        key: 'pdf',
        label: 'Exportar a PDF',
        icon: <FilePdfOutlined />,
        onClick: handleExportarPDF,
      },
    ],
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
      render: (descripcion) =>
        descripcion ? (
          <Tooltip title={descripcion}>
            <span>{descripcion}</span>
          </Tooltip>
        ) : (
          <span style={{ color: '#999' }}>Sin descripción</span>
        ),
    },
    {
      title: 'Miembros',
      key: 'miembros',
      render: (_, record) => {
        const count = Array.isArray(record.jugadorGrupos) ? record.jugadorGrupos.length : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <UserOutlined style={{ color: '#52c41a' }} />
            <strong style={{ fontSize: 16 }}>{count}</strong>
          </div>
        );
      },
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
              <Button danger size="middle" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      align: 'center',
    },
  ];

  const hayFiltrosActivos = !!qDebounced;

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <Card title={<><TeamOutlined />{' '}Gestión de Grupos</>} variant="filled">
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
                  style={{ maxWidth: 400 }}
                />
              </Col>
              <Col>
                <Space>
                  {qDebounced && (
                    <Button onClick={handleLimpiarFiltro}>
                      Limpiar Filtro
                    </Button>
                  )}
                  <Dropdown menu={menuExportar} trigger={['click']}>
                    <Button
                      icon={<DownloadOutlined />}
                      loading={exportando}
                    >
                      Exportar
                    </Button>
                  </Dropdown>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => cargarGrupos(pagination.current, pagination.pageSize, qDebounced)}
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
                  <Empty
                    description={
                      hayFiltrosActivos
                        ? 'No se encontraron grupos con el filtro aplicado'
                        : 'No hay grupos creados'
                    }
                  >
                    {!hayFiltrosActivos && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleNuevoGrupo}
                      >
                        Crear Grupo
                      </Button>
                    )}
                  </Empty>
                ),
              }}
            />

            {/* Paginación externa (a la izquierda) */}
            {pagination.total > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
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
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
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