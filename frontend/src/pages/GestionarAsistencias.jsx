import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Empty,
  Tooltip,
  Popconfirm,
  Typography,
  Pagination,
  Spin,
  ConfigProvider,
  Avatar
} from 'antd';
import locale from 'antd/locale/es_ES';
import 'dayjs/locale/es';
import {
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import {
  listarAsistenciasDeSesion,
  actualizarAsistencia,
  eliminarAsistencia,
  exportarAsistenciasExcel,exportarAsistenciasPDF
} from '../services/asistencia.services.js';
import { obtenerSesionPorId } from '../services/sesion.services.js';
import dayjs from 'dayjs';
import MainLayout from '../components/MainLayout.jsx';
import EditarAsistenciaModal from '../components/EditarAsistenciaModal.jsx';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
const { Title, Text } = Typography;

dayjs.locale('es');

const ESTADOS = {
  presente: { label: 'Presente', color: 'success', icon: <CheckCircleOutlined /> },
  ausente: { label: 'Ausente', color: 'error', icon: <CloseCircleOutlined /> },
  justificado: { label: 'Justificado', color: 'warning', icon: <QuestionCircleOutlined /> },
};

export default function GestionarAsistencias() {
  const { sesionId } = useParams();
  const navigate = useNavigate();

  const [asistencias, setAsistencias] = useState([]);
  const [sesion, setSesion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSesion, setLoadingSesion] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [editModal, setEditModal] = useState(false);
  const [asistenciaEdit, setAsistenciaEdit] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Cargar información de la sesión
  useEffect(() => {
    const cargarSesion = async () => {
      try {
        setLoadingSesion(true);
        const data = await obtenerSesionPorId(parseInt(sesionId));
        setSesion(data);
      } catch (error) {
        console.error('Error cargando sesión:', error);
        message.error('Error al cargar la información de la sesión');
      } finally {
        setLoadingSesion(false);
      }
    };

    if (sesionId) {
      cargarSesion();
    }
  }, [sesionId]);

  const cargarAsistencias = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const data = await listarAsistenciasDeSesion(parseInt(sesionId), {
        pagina: page,
        limite: pageSize
      });

      setAsistencias(data.asistencias || []);
      setPagination({
        current: data.pagina,
        pageSize: data.limite,
        total: data.total,
        totalPages: data.totalPaginas
      });
    } catch (error) {
      console.error('Error cargando asistencias:', error);
      message.error('Error al cargar las asistencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sesionId) {
      cargarAsistencias(1, 10);
    }
  }, [sesionId]);

  const abrirModalEditar = (asistencia) => {
    setAsistenciaEdit(asistencia);
    setNuevoEstado(asistencia.estado);
    setEditModal(true);
  };

  const handleActualizar = async () => {
    try {
      setLoadingEdit(true);
      await actualizarAsistencia(asistenciaEdit.id, {
        estado: nuevoEstado,
        origen: 'entrenador'
      });

      message.success('Asistencia actualizada correctamente');
      setEditModal(false);
      cargarAsistencias(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error actualizando asistencia:', error);
      message.error(error.response?.data?.message || 'Error al actualizar la asistencia');
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleEliminar = async (asistenciaId) => {
    try {
      await eliminarAsistencia(asistenciaId);
      message.success('Asistencia eliminada correctamente');
      cargarAsistencias(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error eliminando asistencia:', error);
      message.error(error.response?.data?.message || 'Error al eliminar la asistencia');
    }
  };
const handleExportExcel = async () => {
  try {
    const blob = await exportarAsistenciasExcel({
      sesionId: parseInt(sesionId)
    });
    
    descargarArchivo(blob, `asistencias_sesion_${sesionId}.xlsx`);
    
  } catch (error) {
    console.error("Error completo:", error);
    console.log(error);
    message.error(error.message || "Error al exportar Excel");
  }
};


const handleExportPDF = async () => {
  try {
    const blob = await exportarAsistenciasPDF({
      sesionId: parseInt(sesionId),
    });

    descargarArchivo(blob, `asistencias_sesion_${sesionId}.pdf`);
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



  const handlePageChange = (page, pageSize) => {
    cargarAsistencias(page, pageSize);
  };

  const columns = [
    {
    title: 'Jugador',
    key: 'jugador',
    render: (_, record) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar 
          size={40} 
          icon={<UserOutlined />} 
          style={{ backgroundColor: '#1890ff' }}
        />
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
  },
  {
    title: 'Estado',
    dataIndex: 'estado',
    key: 'estado',
    render: (estado) => {
      const config = ESTADOS[estado] || ESTADOS.presente;
      return (
        <Tag color={config.color} icon={config.icon}>
          {config.label}
        </Tag>
      );
    },
    align: 'center',
    width: 130,
  },
  {
    title: 'Origen',
    dataIndex: 'origen',
    key: 'origen',
    render: (origen) => (
      <Tag color={origen === 'jugador' ? 'blue' : 'purple'}>
        {origen === 'jugador' ? 'Jugador' : 'Entrenador'}
      </Tag>
    ),
    align: 'center',
    width: 120,
  },
  {
    title: 'Ubicación',
    key: 'ubicacion',
    render: (_, record) => (
      record.latitud && record.longitud ? (
        <Tooltip title={`Lat: ${record.latitud}, Lng: ${record.longitud}`}>
          <EnvironmentOutlined style={{ color: '#52c41a', fontSize: 18 }} />
        </Tooltip>
      ) : (
        <Text type="secondary">—</Text>
      )
    ),
    align: 'center',
    width: 100,
  },
  {
    title: 'Fecha Registro',
    dataIndex: 'fechaRegistro', 
    key: 'fechaRegistro',  
    render: (fecha) => {
      if (!fecha) return <Text type="secondary">—</Text>;
      return dayjs(fecha).format('DD/MM/YYYY HH:mm');
    },
    width: 150,
  },
  {
    title: 'Acciones',
    key: 'acciones',
    render: (_, record) => (
      <Space>
        <Tooltip title="Editar estado">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => abrirModalEditar(record)}
          />
        </Tooltip>
        <Popconfirm
          title="¿Eliminar esta asistencia?"
          description="Esta acción no se puede deshacer"
          onConfirm={() => handleEliminar(record.id)}
          okText="Sí, eliminar"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Eliminar">
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      </Space>
    ),
    align: 'center',
    width: 120,
  },
];

  const estadisticas = {
    presente: asistencias.filter(a => a.estado === 'presente').length,
    ausente: asistencias.filter(a => a.estado === 'ausente').length,
    justificado: asistencias.filter(a => a.estado === 'justificado').length,
  };

  if (loadingSesion) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', paddingTop: 120 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          {sesion && (
  <Card style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
      {/* Información de la sesión */}
      <div style={{ flex: 1, minWidth: 300 }}>
        <Title level={4} style={{ marginBottom: 4 }}>
          {sesion.tipoSesion}
        </Title>
        <Space size="large" wrap>
          <Text type="secondary">
            {formatearFecha(sesion.fecha)}
          </Text>
          <Text type="secondary">
            {formatearHora(sesion.horaInicio)} - {formatearHora(sesion.horaFin)}
          </Text>
          <Text type="secondary">
            {sesion.cancha?.nombre || 'Sin cancha'}
          </Text>
          {sesion.latitudToken && sesion.longitudToken ? (
            <Tag color="green" icon={<EnvironmentOutlined />}>
              Token con ubicación activa
            </Tag>
          ) : (
            <Tag color="default">Token sin ubicación</Tag>
          )}
          {sesion.grupo && (
            <Text type="secondary">
              <TeamOutlined /> {sesion.grupo.nombre}
            </Text>
          )}
        </Space>
      </div>

      {/* Botones separados en dos grupos */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Button onClick={() => navigate('/sesiones')}>
          Volver a Sesiones
        </Button>
        
        <Space size="small">
          <Button type="primary" onClick={() => handleExportExcel()}>
            Exportar Excel
          </Button>
          <Button type="primary" onClick={() => handleExportPDF()}>
            Exportar PDF
          </Button>
        </Space>
      </div>
    </div>

    {/* Estadísticas */}
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
      gap: 16, 
      marginTop: 24,
      padding: 16,
      background: '#f5f5f5',
      borderRadius: 8
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>
          {estadisticas.presente}
        </div>
        <Text type="secondary">Presentes</Text>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>
          {estadisticas.ausente}
        </div>
        <Text type="secondary">Ausentes</Text>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>
          {estadisticas.justificado}
        </div>
        <Text type="secondary">Justificados</Text>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>
          {pagination.total}
        </div>
        <Text type="secondary">Total</Text>
      </div>
    </div>
  </Card>
)}

          <Card
            title="Lista de Asistencias"
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={() => cargarAsistencias(pagination.current, pagination.pageSize)}
              >
                Actualizar
              </Button>
              
            }
            
          >
            <Table
              columns={columns}
              dataSource={asistencias}
              rowKey="id"
              loading={loading}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty description="No hay asistencias registradas para esta sesión">
                    <Text type="secondary">
                      Los jugadores deben marcar su asistencia usando el token activo
                    </Text>
                  </Empty>
                ),
              }}
            />

            {asistencias.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total) => `Total: ${total} asistencias`}
                  pageSizeOptions={['5', '10', '20', '50']}
                />
              </div>
            )}
          </Card>

          <EditarAsistenciaModal
            open={editModal}
            asistencia={asistenciaEdit}
            nuevoEstado={nuevoEstado}
            onEstadoChange={setNuevoEstado}
            loading={loadingEdit}
            onClose={() => setEditModal(false)}
            onConfirm={handleActualizar}
          />
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}