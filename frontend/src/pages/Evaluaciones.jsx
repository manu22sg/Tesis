import { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  message, 
  Modal, 
  Popconfirm, 
  Card, 
  Pagination, 
  Input,
  Select,
  Row,
  Col,
  ConfigProvider,
  Tooltip
} from 'antd';
import locale from 'antd/locale/es_ES';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  StarOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
import { obtenerEvaluaciones, eliminarEvaluacion } from '../services/evaluacion.services.js';
import { obtenerSesiones } from '../services/sesion.services.js';
import EvaluacionForm from '../components/EvaluacionForm.jsx';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout.jsx';

export default function Evaluaciones() {
  const { usuario } = useAuth();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // Paginación estandarizada
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [sesionFiltro, setSesionFiltro] = useState(undefined);

  const esEstudiante = usuario?.rol === 'estudiante';

  // Función para formatear fecha a DD/MM/YYYY
 
  const cargarSesiones = async () => {
    setLoadingSesiones(true);
    try {
      
      const resultado = await obtenerSesiones({ 
        limit: 50, 
        page: 1 
      });
      
      setSesiones(resultado?.sesiones || []);
    } catch (err) {
      console.error('Error cargando sesiones:', err);
      message.error('Error al cargar sesiones para el filtro');
    } finally {
      setLoadingSesiones(false);
    }
  };

  useEffect(() => {
    cargarSesiones();
  }, []);

  const cargarEvaluaciones = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { 
        page, 
        limit: pageSize 
      };
      
      if (busqueda) params.q = busqueda;
      if (sesionFiltro) params.sesionId = sesionFiltro;

      const resultado = await obtenerEvaluaciones(params);
      
      const evaluacionesData = resultado?.evaluaciones || [];
      const paginationData = resultado?.pagination || {};
      
      setEvaluaciones(evaluacionesData);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: paginationData?.totalItems || evaluacionesData.length || 0
      });
    } catch (err) {
      console.error('Error cargando evaluaciones:', err);
      message.error('Error al cargar evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    cargarEvaluaciones(1, pagination.pageSize); 
  }, [busqueda, sesionFiltro]);

  const handleDelete = async (id) => {
    try {
      await eliminarEvaluacion(id);
      message.success('Evaluación eliminada');
      cargarEvaluaciones(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error eliminando evaluación:', error);
      message.error('Error al eliminar evaluación');
    }
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
    cargarEvaluaciones(page, pageSize);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setSesionFiltro(undefined);
  };

  const columns = [
    {
      title: 'Jugador',
      dataIndex: ['jugador', 'usuario', 'nombre'],
      key: 'jugador',
      width: 180,
      ellipsis: true,
      render: (nombre) => nombre || '—'
    },
    {
      title: 'Sesión',
      render: (_, record) => {
        if (!record.sesion) return '—';
        const fechaFormateada = formatearFecha(record.sesion.fecha);
        const horaFormateada = formatearHora(record.sesion.horaInicio);
        const horaFin = formatearHora(record.sesion.horaFin);
        return `${fechaFormateada} - ${horaFormateada} - ${horaFin}`;
      },
      width: 180
    },
    { 
      title: 'Técnica', 
      dataIndex: 'tecnica', 
      key: 'tecnica', 
      align: 'center',
      width: 90,
      render: (val) => <strong style={{ color: '#1890ff' }}>{val ?? '—'}</strong>
    },
    { 
      title: 'Táctica', 
      dataIndex: 'tactica', 
      key: 'tactica', 
      align: 'center',
      width: 90,
      render: (val) => <strong style={{ color: '#52c41a' }}>{val ?? '—'}</strong>
    },
    { 
      title: 'Actitudinal', 
      dataIndex: 'actitudinal', 
      key: 'actitudinal', 
      align: 'center',
      width: 110,
      render: (val) => <strong style={{ color: '#faad14' }}>{val ?? '—'}</strong>
    },
    { 
      title: 'Física', 
      dataIndex: 'fisica', 
      key: 'fisica', 
      align: 'center',
      width: 90,
      render: (val) => <strong style={{ color: '#f5222d' }}>{val ?? '—'}</strong>
    },
    { 
      title: 'Fecha Registro', 
      dataIndex: 'fechaRegistro', 
      key: 'fechaRegistro',
      width: 120,
      render: (fecha) => {
        if (!fecha) return '—';
        return formatearFecha(fecha);
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {!esEstudiante && (
            <>
              <Tooltip title="Editar">
                <Button 
                  type="primary"
                  size="medium"
                  icon={<EditOutlined />} 
                  onClick={() => { 
                    setEditing(record); 
                    setModalOpen(true); 
                  }}
                />
              </Tooltip>
              <Popconfirm
                title="¿Eliminar evaluación?"
                onConfirm={() => handleDelete(record.id)}
                okText="Aceptar"
                cancelText="Cancelar"
                  okButtonProps={{ danger: true }}

              >
                <Tooltip title="Eliminar">
                  <Button 
                    danger 
                    size="medium"
                    icon={<DeleteOutlined />} 
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <Card
          title={<><StarOutlined /> Evaluaciones de Jugadores</>}
          variant="outlined"
        >
          {/* Filtros y acciones */}
          <Card 
            style={{ 
              marginBottom: '1rem', 
              backgroundColor: '#fafafa' 
            }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="Buscar por nombre de jugador"
                  allowClear
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  prefix={<SearchOutlined />}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Filtrar por sesión"
                  allowClear
                  showSearch
                  value={sesionFiltro}
                  onChange={setSesionFiltro}
                  loading={loadingSesiones}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={sesiones.map(s => {
                    const fechaFormateada = formatearFecha(s.fecha);
                    const horaInicio = formatearHora(s.horaInicio);
                    const horaFin = s.horaFin ? formatearHora(s.horaFin) : 'Sin hora final';
                    return {
                      value: s.id,
                      label: `${fechaFormateada} - ${horaInicio} - ${horaFin}`
                    };
                  })}
                />
              </Col>
              <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                <Space wrap>
                  {(busqueda || sesionFiltro) && (
                    <Button onClick={limpiarFiltros}>
                      Limpiar filtros
                    </Button>
                  )}
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => cargarEvaluaciones(pagination.current, pagination.pageSize)}
                    loading={loading}
                  >
                    Actualizar
                  </Button>
                  {!esEstudiante && (
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={() => {
                        setEditing(null);
                        setModalOpen(true);
                      }}
                    >
                      Nueva
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Tabla */}
          <Card>
            <Table
              dataSource={evaluaciones}
              columns={columns}
              loading={loading}
              pagination={false}
              rowKey="id"
              scroll={{ x: 1000 }}
            />

            {/* Paginación uniforme */}
            {evaluaciones.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total) => `Total: ${total} evaluaciones`}
                  pageSizeOptions={['5', '10', '20', '50']}
                />
              </div>
            )}
          </Card>

          {/* Modal Crear/Editar */}
          <Modal
            open={modalOpen}
            onCancel={() => { 
              setModalOpen(false); 
              setEditing(null); 
            }}
            footer={null}
            destroyOnHidden
            title={editing ? <><EditOutlined /> Editar Evaluación</> : <><PlusOutlined /> Nueva Evaluación</>}
            width={600}
          >
            <EvaluacionForm
              initialValues={editing}
              onSuccess={() => { 
                setModalOpen(false); 
                setEditing(null);
                cargarEvaluaciones(pagination.current, pagination.pageSize); 
              }}
            />
          </Modal>
        </Card>
      </ConfigProvider>
    </MainLayout>
  );
}