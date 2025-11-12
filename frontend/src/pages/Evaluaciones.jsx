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
  Tooltip,
  Typography,
  Avatar
} from 'antd';
import locale from 'antd/locale/es_ES';
import { 
  UserOutlined,
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

  // Paginación controlada
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [sesionFiltro, setSesionFiltro] = useState(undefined);
  const { Text } = Typography;

  const esEstudiante = usuario?.rol === 'estudiante';

  // 🔹 Cargar sesiones para filtro
  const cargarSesiones = async () => {
    setLoadingSesiones(true);
    try {
      const resultado = await obtenerSesiones({ limit: 50, page: 1 });
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

  // 🔹 Debounce búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => setQDebounced(busqueda.trim()), 400);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  // 🔹 Cargar evaluaciones
  const cargarEvaluaciones = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (qDebounced) params.q = qDebounced;
      if (sesionFiltro) params.sesionId = sesionFiltro;

      const resultado = await obtenerEvaluaciones(params);
      const evaluacionesData = resultado?.evaluaciones || [];
      const paginationData = resultado?.pagination || {};

      setEvaluaciones(evaluacionesData);
      setPagination({
        current: page,
        pageSize,
        total: paginationData?.totalItems || evaluacionesData.length || 0
      });
    } catch (err) {
      console.error('Error cargando evaluaciones:', err);
      message.error('Error al cargar evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Efecto principal que carga evaluaciones al cambiar filtros o paginación
  useEffect(() => {
    cargarEvaluaciones(pagination.current, pagination.pageSize);
  }, [qDebounced, sesionFiltro, pagination.current, pagination.pageSize]);

  // 🔹 Eliminar evaluación
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

  // 🔹 Cambiar página
  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
  };

  // 🔹 Limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda('');
    setQDebounced('');
    setSesionFiltro(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns = [
    {
      title: 'Jugador',
      key: 'jugador',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.jugador?.usuario?.nombre || 'Sin nombre'}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.jugador?.usuario?.rut || 'Sin RUT'}
            </Text>
          </div>
        </div>
      ),
      width: 220,
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
      width: 200
    },
    { title: 'Técnica', dataIndex: 'tecnica', key: 'tecnica', align: 'center', width: 90, render: val => <>{val ?? '—'}</> },
    { title: 'Táctica', dataIndex: 'tactica', key: 'tactica', align: 'center', width: 90, render: val => <>{val ?? '—'}</> },
    { title: 'Actitudinal', dataIndex: 'actitudinal', key: 'actitudinal', align: 'center', width: 110, render: val => <>{val ?? '—'}</> },
    { title: 'Física', dataIndex: 'fisica', key: 'fisica', align: 'center', width: 90, render: val => <>{val ?? '—'}</> },
    {
      title: 'Fecha Registro',
      dataIndex: 'fechaRegistro',
      key: 'fechaRegistro',
      width: 120,
      render: (fecha) => fecha ? formatearFecha(fecha) : '—'
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
                  size="middle"
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
                okText="Eliminar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Eliminar">
                  <Button danger size="middle" icon={<DeleteOutlined />} />
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
        <Card title={<><StarOutlined /> Evaluaciones de Jugadores</>} variant="outlined">
          
          {/* 🔹 Filtros y acciones */}
          <Card style={{ marginBottom: '1rem', backgroundColor: '#fafafa' }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="Buscar por nombre o RUT del jugador"
                  allowClear
                  value={busqueda}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBusqueda(val);
                    if (val === '') setQDebounced('');
                  }}
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
                  {(qDebounced || sesionFiltro) && (
                    <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
                  )}
                  
                  {!esEstudiante && (
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={() => {
                        setEditing(null);
                        setModalOpen(true);
                      }}
                    >
                      Nueva evaluación
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 🔹 Tabla */}
          <Card>
            <Table
              dataSource={evaluaciones}
              columns={columns}
              loading={loading}
              pagination={false}
              rowKey="id"
              scroll={{ x: 1000 }}
            />

            {/* 🔹 Paginación externa */}
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

          {/* 🔹 Modal Crear/Editar */}
          <Modal
            open={modalOpen}
            onCancel={() => { 
              setModalOpen(false); 
              setEditing(null); 
            }}
            footer={null}
            destroyOnClose
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
