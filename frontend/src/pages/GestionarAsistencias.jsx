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
  Avatar,
  Modal,
  Select,
  Form,
  Input
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
  UserOutlined,
  UserAddOutlined,
  SearchOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import {
  listarAsistenciasDeSesion,
  actualizarAsistencia,
  eliminarAsistencia,
  exportarAsistenciasExcel,
  exportarAsistenciasPDF,
  registrarAsistenciaManual
} from '../services/asistencia.services.js';
import { obtenerSesionPorId } from '../services/sesion.services.js';
import { obtenerJugadores } from '../services/jugador.services.js';
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
  tarde: { label: 'Tarde', color: 'default', icon: <ClockCircleOutlined /> },
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

  // Estados para registro manual
  const [modalManual, setModalManual] = useState(false);
  const [formManual] = Form.useForm();
  const [loadingManual, setLoadingManual] = useState(false);
  const [jugadores, setJugadores] = useState([]);

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
        page,
        limit: pageSize
      });

      setAsistencias(data.asistencias || []);
      setPagination({
        current: data.page,
        pageSize: data.limit,
        total: data.total,
        totalPages: data.totalPages
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

  // Cargar jugadores cuando se carga la sesión
  useEffect(() => {
    if (sesion?.grupo?.id) {
      cargarJugadoresDelGrupo();
    }
  }, [sesion]);

  const cargarJugadoresDelGrupo = async () => {
    try {
      const data = await obtenerJugadores({
        limit: 100,
        grupoId: sesion.grupo.id
      });
      setJugadores(data.jugadores || []);
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      message.error('Error al cargar jugadores del grupo');
    }
  };

  const abrirModalEditar = (asistencia) => {
    setAsistenciaEdit(asistencia);
    setNuevoEstado(asistencia.estado);
    setEditModal(true);
  };

  const abrirModalManual = () => {
    formManual.resetFields();
    setModalManual(true);
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

  const handleRegistroManual = async (values) => {
    try {
      setLoadingManual(true);
      await registrarAsistenciaManual({
        sesionId: parseInt(sesionId),
        jugadorId: values.jugadorId,
        estado: values.estado || 'presente',
        observacion: values.observacion
      });

      message.success('Asistencia registrada correctamente');
      setModalManual(false);
      cargarAsistencias(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      message.error(error.response?.data?.message || 'Error al registrar la asistencia');
    } finally {
      setLoadingManual(false);
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
            style={{ backgroundColor: '#014898' }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>
  {`${record.jugador?.usuario?.nombre || 'Sin nombre'} ${record.jugador?.usuario?.apellido || ''}`.trim()}

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
  {config.icon}
  {config.label}
</span>
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
        <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5'
}}>
  {origen === 'jugador' ? 'Jugador' : 'Entrenador'}
</span>
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
            <EnvironmentOutlined style={{ color: '#006B5B', fontSize: 18 }} />
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
  <EnvironmentOutlined />
  Token con ubicación activa
</span>
                    ) : (
                     <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5'
}}>
  Token sin ubicación
</span>
                    )}
                    {sesion.grupo && (
                      <Text type="secondary">
                        <TeamOutlined /> {sesion.grupo.nombre}
                      </Text>
                    )}
                  </Space>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Button onClick={() => navigate('/sesiones')}>
                    Volver a Sesiones
                  </Button>
                  
                  <Space size="small">
                    <Button type="primary" onClick={handleExportExcel}>
                      Exportar Excel
                    </Button>
                    <Button type="primary" onClick={handleExportPDF}>
                      Exportar PDF
                    </Button>
                  </Space>
                </div>
              </div>

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
              <Space>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={abrirModalManual}
                >
                  Registrar Manualmente
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => cargarAsistencias(pagination.current, pagination.pageSize)}
                >
                  Actualizar
                </Button>
              </Space>
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

          {/* Modal de Editar Asistencia */}
          <EditarAsistenciaModal
            open={editModal}
            asistencia={asistenciaEdit}
            nuevoEstado={nuevoEstado}
            onEstadoChange={setNuevoEstado}
            loading={loadingEdit}
            onClose={() => setEditModal(false)}
            onConfirm={handleActualizar}
          />

          {/* Modal de Registro Manual */}
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserAddOutlined />
                <span>Registrar Asistencia Manualmente</span>
              </div>
            }
            open={modalManual}
            onCancel={() => setModalManual(false)}
            footer={[
              <Button key="cancel" onClick={() => setModalManual(false)}>
                Cancelar
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={loadingManual}
                onClick={() => formManual.submit()}
              >
                Registrar
              </Button>,
            ]}
            width={600}
          >
            <Form
              form={formManual}
              layout="vertical"
              onFinish={handleRegistroManual}
              style={{ marginTop: 16 }}
            >
              <Form.Item
                label="Jugador"
                name="jugadorId"
                rules={[{ required: true, message: 'Selecciona un jugador' }]}
              >
                <Select
                  showSearch
                  placeholder="Selecciona un jugador del grupo..."
                  optionFilterProp="label"
                  notFoundContent={
                    jugadores.length === 0 ? (
                      <Empty 
                        description="No hay jugadores en este grupo" 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : null
                  }
                >
                  {jugadores.map((jugador) => (
                    <Select.Option 
                      key={jugador.id} 
                      value={jugador.id}
                      label={`${jugador.usuario?.nombre || 'Sin nombre'} ${jugador.usuario?.apellido || ''} - ${jugador.usuario?.rut || ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            {jugador.usuario?.nombre || 'Sin nombre'} {jugador.usuario?.apellido || ''}
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {jugador.usuario?.rut || 'Sin RUT'} • {jugador.usuario?.email || ''}
                          </div>
                        </div>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Estado"
                name="estado"
                initialValue="presente"
                rules={[{ required: true, message: 'Selecciona un estado' }]}
              >
                <Select>
                  {Object.entries(ESTADOS).map(([key, config]) => (
                    <Select.Option key={key} value={key}>
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
  {config.icon}
  {config.label}
</span>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

            </Form>

            
          </Modal>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}