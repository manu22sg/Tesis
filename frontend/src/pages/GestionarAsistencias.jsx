import { useState, useEffect, useRef } from 'react';
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
  Input,
  Dropdown,Radio
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
  ClockCircleOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined
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
  const [sesion, setSesion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSesion, setLoadingSesion] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
const [nuevoMaterial, setNuevoMaterial] = useState('null');

  const [editModal, setEditModal] = useState(false);
  const [asistenciaEdit, setAsistenciaEdit] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Estados para registro manual
  const [modalManual, setModalManual] = useState(false);
  const [formManual] = Form.useForm();
  const [loadingManual, setLoadingManual] = useState(false);
  const [jugadores, setJugadores] = useState([]);
  const [busquedaJugador, setBusquedaJugador] = useState('');
  const [loadingBusquedaJugador, setLoadingBusquedaJugador] = useState(false);
  
  const searchTimeout = useRef(null);

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

  // Cargar jugadores iniciales cuando se carga la sesión
  useEffect(() => {
    if (sesion?.grupo?.id) {
      cargarJugadoresIniciales();
    }
  }, [sesion]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const cargarJugadoresIniciales = async () => {
    try {
      setLoadingBusquedaJugador(true);
      const data = await obtenerJugadores({
        limit: 50,
        grupoId: sesion.grupo.id
      });
      setJugadores(data.jugadores || []);
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      message.error('Error al cargar jugadores del grupo');
      setJugadores([]);
    } finally {
      setLoadingBusquedaJugador(false);
    }
  };

  // 🔥 Handler de búsqueda con debounce
  const handleBuscarJugadores = (value) => {
    setBusquedaJugador(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Si está vacío O tiene menos de 2 caracteres, cargar iniciales
    if (!value || value.trim().length < 2) {
      setJugadores([]);
      setLoadingBusquedaJugador(false);
      // Cargar jugadores iniciales cuando borra la búsqueda
      if (!value || value.trim().length === 0) {
        cargarJugadoresIniciales();
      }
      return;
    }

    // 🔥 Limpiar jugadores inmediatamente al empezar a buscar
    setJugadores([]);
    setLoadingBusquedaJugador(true);

    // Buscar con debounce (solo si tiene 2+ caracteres)
    searchTimeout.current = setTimeout(() => {
      buscarJugadores(value.trim());
    }, 500);
  };

  const buscarJugadores = async (q) => {
    setLoadingBusquedaJugador(true);
    try {
      const data = await obtenerJugadores({
        q,
        limit: 100,
        grupoId: sesion.grupo.id
      });
      setJugadores(data.jugadores || []);
    } catch (error) {
      console.error('Error buscando jugadores:', error);
      message.error('Error al buscar jugadores');
      setJugadores([]);
    } finally {
      setLoadingBusquedaJugador(false);
    }
  };

 const abrirModalEditar = (asistencia) => {
  setAsistenciaEdit(asistencia);
  setNuevoEstado(asistencia.estado);
  
  if (asistencia.entregoMaterial === true) setNuevoMaterial("true");
  else if (asistencia.entregoMaterial === false) setNuevoMaterial("false");
  else setNuevoMaterial("null");

  setEditModal(true);
};

  const abrirModalManual = () => {
    formManual.resetFields();
    setBusquedaJugador('');
    cargarJugadoresIniciales();
    setModalManual(true);
  };

  const handleActualizar = async ({ estado, entregoMaterial }) => {
  try {
    setLoadingEdit(true);

    await actualizarAsistencia(asistenciaEdit.id, {
      estado,
      entregoMaterial,
      origen: "entrenador"
    });

    message.success("Asistencia actualizada correctamente");
    setEditModal(false);
    cargarAsistencias(pagination.current, pagination.pageSize);
  } catch (e) {
    message.error("Error al actualizar asistencia");
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
      observacion: values.observacion || null,
      entregoMaterial:
        values.entregoMaterial === "null"
          ? null
          : values.entregoMaterial === "true"
    });

    message.success("Asistencia registrada correctamente");
    setModalManual(false);
    cargarAsistencias(pagination.current, pagination.pageSize);
  } catch (error) {
    console.error("Error registrando asistencia:", error);
    message.error(error.response?.data?.message || "Error al registrar la asistencia");
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
    const result = await exportarAsistenciasExcel({
      sesionId: parseInt(sesionId)
    });

    if (result.modo === "web") {
      descargarArchivo(result.blob, result.nombre || `asistencias_sesion_${sesionId}.xlsx`);
      message.success("Excel descargado correctamente");
    } else {
      // MOBILE → BASE64
      console.log("BASE64 recibido:", result.base64);
      message.success("Archivo generado (mobile)");
      // Aquí podrías abrirlo con Sharing.shareAsync de Expo, si quieres
    }

  } catch (error) {
    console.error("Error completo:", error);
    message.error(error.message || "Error al exportar Excel");
  }
};
const handleExportPDF = async () => {
  try {
    const result = await exportarAsistenciasPDF({
      sesionId: parseInt(sesionId)
    });

    if (result.modo === "web") {
      descargarArchivo(result.blob, result.nombre || `asistencias_sesion_${sesionId}.pdf`);
      message.success("PDF descargado correctamente");
    } else {
      // MOBILE → BASE64
      console.log("BASE64 recibido:", result.base64);
      message.success("Archivo generado (mobile)");
    }

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

  const menuExportar = {
    items: [
      {
        key: 'excel',
        label: 'Exportar a Excel',
        icon: <FileExcelOutlined />,
        onClick: handleExportExcel,
      },
      {
        key: 'pdf',
        label: 'Exportar a PDF',
        icon: <FilePdfOutlined />,
        onClick: handleExportPDF,
      },
    ],
  };

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
  title: 'Material',
  dataIndex: 'entregoMaterial',
  key: 'entregoMaterial',
  align: 'center',
  width: 120,
  render: (value) => {
    if (value === true) {
      return (
        <Tag color="green" style={{ fontSize: 13, padding: '4px 8px' }}>
          Sí
        </Tag>
      );
    }
    if (value === false) {
      return (
        <Tag color="red" style={{ fontSize: 13, padding: '4px 8px' }}>
          No
        </Tag>
      );
    }
    return (
      <Tag color="default" style={{ fontSize: 13, padding: '4px 8px' }}>
        —
      </Tag>
    );
  }
},
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => {
        const config = ESTADOS[estado] || ESTADOS.presente;
        const colorMap = {
          presente: '#00ADD6',
          ausente: '#E41B1A',
          justificado: '#F9B214',
          tarde: '#014898'
        };
        const color = colorMap[estado] || '#014898';
        
        return (
          <span style={{
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: '13px',
            fontWeight: 500,
            border: `1px solid ${color}`,
            color: color,
            backgroundColor: `${color}10`
          }}>
            {config.icon} {config.label}
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
          padding: '4px 12px',
          borderRadius: 6,
          fontSize: '13px',
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
            <EnvironmentOutlined style={{ color: '#00ADD6', fontSize: 18 }} />
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
                        padding: '4px 12px',
                        borderRadius: 6,
                        fontSize: '13px',
                        fontWeight: 500,
                        border: '1px solid #00ADD6',
                        color: '#00ADD6',
                        backgroundColor: '#00ADD610',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <EnvironmentOutlined />
                        Token con ubicación
                      </span>
                    ) : (
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        fontSize: '13px',
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
                  <Dropdown menu={menuExportar} trigger={['hover']}>
                    <Button icon={<DownloadOutlined />}>
                      Exportar
                    </Button>
                  </Dropdown>
                  <Button onClick={() => navigate('/sesiones')}>
                    Volver a Sesiones
                  </Button>
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
  setNuevoEstado={setNuevoEstado}
  nuevoMaterial={nuevoMaterial}
  setNuevoMaterial={setNuevoMaterial}
  loading={loadingEdit}
  onClose={() => setEditModal(false)}
  onConfirm={handleActualizar}
/>

          {/* Modal de Registro Manual */}
          <Modal
            title={
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#262626'
              }}>
                <UserAddOutlined style={{ color: '#014898' }} />
                <span>Registrar Asistencia Manualmente</span>
              </div>
            }
            open={modalManual}
            onCancel={() => setModalManual(false)}
            footer={[
              <Button 
                key="cancel" 
                onClick={() => setModalManual(false)}
                size="large"
                style={{ 
                  borderRadius: 8,
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 24
                }}
              >
                Cancelar
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={loadingManual}
                onClick={() => formManual.submit()}
                size="large"
                style={{ 
                  backgroundColor: '#014898',
                  borderColor: '#014898',
                  borderRadius: 8,
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 24
                }}
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
              style={{ marginTop: 24 }}
            >
              <Form.Item
  label={<span style={{ fontSize: 14, fontWeight: 500 }}>¿Entregó Material?</span>}
  name="entregoMaterial"
  initialValue="null"
>
  <Radio.Group style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <Radio value="true">Sí</Radio>
    <Radio value="false">No</Radio>
    <Radio value="null">No aplica</Radio>
  </Radio.Group>
</Form.Item>
              <Form.Item
                label={<span style={{ fontSize: 14, fontWeight: 500 }}>Jugador</span>}
                name="jugadorId"
                rules={[{ required: true, message: 'Selecciona un jugador' }]}
              >
                <Select
                  showSearch
                  placeholder="Buscar jugador por nombre o RUT..."
                  filterOption={false}
                  searchValue={busquedaJugador}
                  onSearch={handleBuscarJugadores}
                  size="medium"
                  style={{ borderRadius: 8 }}
                  notFoundContent={
                    loadingBusquedaJugador ? (
                      <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <Spin size="small" />
                      </div>
                    ) : busquedaJugador.trim().length > 0 && busquedaJugador.trim().length < 2 ? (
                      <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                        Escribe al menos 2 caracteres
                      </div>
                    ) : busquedaJugador.trim().length >= 2 && jugadores.length === 0 ? (
                      <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                        No se encontraron jugadores
                      </div>
                    ) : jugadores.length === 0 ? (
                      <Empty 
                        description="No hay jugadores en este grupo" 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : null
                  }
                >
                  {jugadores.map((jugador) => {
                    const nombreCompleto = `${jugador.usuario?.nombre || 'Sin nombre'} ${jugador.usuario?.apellido || ''}`.trim();
                    const rut = jugador.usuario?.rut || 'Sin RUT';
                    
                    return (
                      <Select.Option 
                        key={jugador.id} 
                        value={jugador.id}
                      >
                        {`${nombreCompleto} - ${rut}`}
                      </Select.Option>
                    );
                  })}
                </Select>
              </Form.Item>

              <Form.Item
                label={<span style={{ fontSize: 14, fontWeight: 500 }}>Estado</span>}
                name="estado"
                initialValue="presente"
                rules={[{ required: true, message: 'Selecciona un estado' }]}
              >
                <Select size="large" style={{ borderRadius: 8 }}>
                  {Object.entries(ESTADOS).map(([key, config]) => (
                    <Select.Option key={key} value={key}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        padding: '4px 0'
                      }}>
                        <span style={{ 
                          fontSize: 16,
                          color: key === 'presente' ? '#00ADD6' :
                                 key === 'ausente' ? '#E41B1A' :
                                 key === 'justificado' ? '#F9B214' :
                                 key === 'tarde' ? '#014898' :
                                 '#014898'
                        }}>
                          {config.icon}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>
                          {config.label}
                        </span>
                      </div>
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