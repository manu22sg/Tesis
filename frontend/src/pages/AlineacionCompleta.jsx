import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Tag, Button, Space, Empty, Tooltip,
  Modal, Form, Select, InputNumber, Input, Spin, Popconfirm,
  Tabs, ConfigProvider, Typography, Alert, Avatar, Dropdown,App
} from 'antd';
import locale from 'antd/locale/es_ES';
import {ThunderboltOutlined ,
  UserOutlined,  PlusOutlined, DeleteOutlined, EditOutlined, TeamOutlined,
  UserAddOutlined, FieldTimeOutlined, TableOutlined,
  AimOutlined, ArrowLeftOutlined, DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import {
  crearAlineacion,
  obtenerAlineacionPorSesion,
  agregarJugadorAlineacion,
  actualizarJugadorAlineacion,
  quitarJugadorAlineacion,
  eliminarAlineacion,
  actualizarPosicionesJugadores,
  exportarAlineacionExcel,
  exportarAlineacionPDF

} from '../services/alineacion.services.js';
import { obtenerJugadores } from '../services/jugador.services.js';
import { obtenerSesionPorId } from '../services/sesion.services.js';
import MainLayout from '../components/MainLayout.jsx';
import CampoAlineacion from '../components/CampoAlineacion.jsx';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
import ModalAlineacionInteligente from '../components/ModalAlineacionInteligente.jsx';

const { TextArea } = Input;
const { Text } = Typography;

const POSICIONES = [
  'Portero',
  'Defensa Central',
  'Defensa Central Derecho',
  'Defensa Central Izquierdo',
  'Lateral Derecho',
  'Lateral Izquierdo',
  'Mediocentro Defensivo',
  'Mediocentro',
  'Mediocentro Ofensivo',
  'Extremo Derecho',
  'Extremo Izquierdo',
  'Delantero Centro'
];

export default function AlineacionCompleta() {
  const { sesionId } = useParams();
  const navigate = useNavigate();
  const [modalInteligenteVisible, setModalInteligenteVisible] = useState(false);
const { message } = App.useApp(); 

  const [loading, setLoading] = useState(false);
  const [alineacion, setAlineacion] = useState(null);
  const [sesionInfo, setSesionInfo] = useState(null);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [jugadorEditando, setJugadorEditando] = useState(null);
  const [vistaActual, setVistaActual] = useState('campo');
  const [form] = Form.useForm();
  const [formEdit] = Form.useForm();
  const [formularioCompleto, setFormularioCompleto] = useState(false);

  useEffect(() => {
    if (sesionId) {
      cargarSesion();
      cargarAlineacion();
    }
  }, [sesionId]);

  // Cargar jugadores después de tener la info de la sesión
  useEffect(() => {
    if (sesionInfo) {
      cargarJugadores();
    }
  }, [sesionInfo]);

  const cargarSesion = async () => {
    try {
      const sesion = await obtenerSesionPorId(parseInt(sesionId, 10));
      setSesionInfo(sesion);
    } catch (error) {
      console.error('Error cargando sesión:', error);
      message.error('Error al cargar información de la sesión');
    }
  };

  const cargarAlineacion = async () => {
    setLoading(true);
    try {
      const response = await obtenerAlineacionPorSesion(parseInt(sesionId, 10));
      setAlineacion(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setAlineacion(null);
      } else {
        message.error('Error al cargar la alineación');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarJugadores = async () => {
    try {
      if (sesionInfo?.grupo?.id) {
        const data = await obtenerJugadores({
          limit: 100,
          grupoId: sesionInfo.grupo.id
        });
        setJugadoresDisponibles(data.jugadores || []);
      } else {
        const data = await obtenerJugadores({ limit: 100 });
        setJugadoresDisponibles(data.jugadores || []);
      }
    } catch (error) {
      message.error('Error al cargar jugadores');
      console.error(error);
    }
  };

  const handleCrearAlineacion = async () => {
    setLoading(true);
    try {
      await crearAlineacion({
        sesionId: parseInt(sesionId, 10),
        generadaAuto: false,
        jugadores: []
      });
      cargarAlineacion();
    } catch (error) {
      console.error('Error al crear alineación:', error);
      message.error(error.response?.data?.message || 'Error al crear la alineación');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarJugador = async (values, continuar = false) => {
    try {
      await agregarJugadorAlineacion({
        alineacionId: alineacion.id,
        ...values
      });

      await cargarAlineacion();

      if (continuar) {
        form.resetFields();
        setFormularioCompleto(false);
      } else {
        setModalVisible(false);
        form.resetFields();
        setFormularioCompleto(false);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al agregar jugador');
      console.error(error);
    }
  };

  const handleActualizarJugador = async (values) => {
    try {
      await actualizarJugadorAlineacion({
        alineacionId: alineacion.id,
        jugadorId: jugadorEditando.jugadorId,
        ...values
      });
      message.success('Jugador actualizado');
      setModalEditVisible(false);
      setJugadorEditando(null);
      formEdit.resetFields();
      cargarAlineacion();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al actualizar jugador');
      console.error(error);
    }
  };

  const handleQuitarJugador = async (jugadorId) => {
    try {
      await quitarJugadorAlineacion(alineacion.id, jugadorId);

      setAlineacion(prev => ({
        ...prev,
        jugadores: prev.jugadores.filter(j => j.jugadorId !== jugadorId)
      }));

      cargarAlineacion();
    } catch (error) {
      console.error('Error al quitar jugador:', error);
      message.error(error.response?.data?.message || 'Error al quitar jugador');
    }
  };

  const handleEliminarAlineacion = async () => {
    try {
      await eliminarAlineacion(alineacion.id);
      setAlineacion(null);
    } catch (error) {
      message.error('Error al eliminar la alineación');
      console.error(error);
    }
  };

  const abrirModalEditar = (jugador) => {
    setJugadorEditando(jugador);
    formEdit.setFieldsValue({
      posicion: jugador.posicion,
      orden: jugador.orden,
      comentario: jugador.comentario
    });
    setModalEditVisible(true);
  };

  // Validar que el formulario esté completo
  const validarFormularioCompleto = () => {
    const valores = form.getFieldsValue();
    const completo = valores.jugadorId && valores.posicion;
    setFormularioCompleto(completo);
  };
  const handleExportExcel = async () => {
  try {
    const result = await exportarAlineacionExcel(sesionId);

    if (result.modo === "web" && result.blob) {
      descargarArchivo(result.blob, result.nombre);
      message.success("Excel descargado correctamente");
    } else if (result.modo === "mobile" && result.base64) {
      console.log("BASE64 recibido:", result.base64);
      message.success("Archivo generado (mobile)");
    }

  } catch (error) {
    console.error("Error al exportar Excel:", error);
    message.error(error.message || "Error al exportar Excel");
  }
};

const handleExportPDF = async () => {
  try {
    const result = await exportarAlineacionPDF(sesionId);

    if (result.modo === "web" && result.blob) {
      descargarArchivo(result.blob, result.nombre);
      message.success("PDF descargado correctamente");
    } else if (result.modo === "mobile" && result.base64) {
      console.log("BASE64 recibido:", result.base64);
      message.success("Archivo generado (mobile)");
    }

  } catch (error) {
    console.error("Error al exportar PDF:", error);
    message.error(error.message || "Error al exportar PDF");
  }
};

function descargarArchivo(blob, nombre) {
  if (typeof window === 'undefined' || !window.URL?.createObjectURL) {
    console.error('createObjectURL no disponible');
    return;
  }

  try {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar archivo:', error);
  }
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



  const jugadoresYaEnAlineacion = alineacion?.jugadores?.map(j => j.jugadorId) || [];
  const jugadoresFiltrados = jugadoresDisponibles.filter(
    j => !jugadoresYaEnAlineacion.includes(j.id)
  );

  // Opciones de Select de jugadores (label/value) para evitar errores de filtrado
  const opcionesJugadores = useMemo(() => {
    return jugadoresFiltrados.map(j => ({
      value: j.id,
      label: `${j.usuario?.nombre ||  `Jugador #${j.id}`} ${j.usuario?.apellido || ''} - ${j.usuario?.rut || ''}`.trim()
    }));
  }, [jugadoresFiltrados]);

  const columns = [
    {
      title: 'Dorsal',
      dataIndex: 'orden',
      key: 'orden',
      width: 60,
      sorter: (a, b) => (a.orden || 999) - (b.orden || 999),
      render: (orden) => orden ? <span>#{orden}</span> : <Text type="secondary">—</Text>
    },
    {
      title: 'Jugador',
      key: 'jugador',
      render: (_, record) => (
        <Space>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar 
          size={40} 
          icon={<UserOutlined />} 
          style={{ backgroundColor: '#014898' }}
        />
        </div>
          <span>
  {`${record.jugador?.usuario?.nombre || 'Sin nombre'} ${record.jugador?.usuario?.apellido || ''} - ${record.jugador?.usuario?.rut || 'Sin RUT'}`.trim()}
          </span>
        </Space>
      )
    },
    {
      title: 'Posición',
      dataIndex: 'posicion',
      key: 'posicion',
      render: (posicion) => <span>{posicion}</span>
    },
    {
      title: 'Comentario',
      dataIndex: 'comentario',
      key: 'comentario',
      render: (comentario) => comentario || <Text type="secondary">—</Text>
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => abrirModalEditar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Quitar jugador?"
            onConfirm={() => handleQuitarJugador(record.jugadorId)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Quitar">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading && !alineacion) {
    return (
      <MainLayout>
        <ConfigProvider locale={locale}>
          <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Card>
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Cargando alineación...</p>
              </div>
            </Card>
          </div>
        </ConfigProvider>
      </MainLayout>
    );
  }

  // Helper para mostrar cancha o ubicación externa
  const getLugarSesion = (s) => s?.cancha?.nombre || s?.ubicacionExterna || 'Sin ubicación';

  if (!alineacion) {
    return (
      <MainLayout>
        <ConfigProvider locale={locale}>
          <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/sesiones')}
              style={{ marginBottom: 16 }}
            >
              Volver a Sesiones
            </Button>

            {sesionInfo && (
              <Alert
                message={`Sesión: ${formatearFecha(sesionInfo.fecha)} - ${formatearHora(sesionInfo.horaInicio)} - ${formatearHora(sesionInfo.horaFin)}`}
                description={`Grupo: ${sesionInfo.grupo?.nombre || 'Sin grupo'} | Lugar: ${getLugarSesion(sesionInfo)}`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                styles={{ image: { height: 100 } }}
                description={
                  <div>
                    <h3>No hay alineación creada para esta sesión</h3>
                  </div>
                }
              >
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleCrearAlineacion}
                >
                  Crear Alineación
                </Button>
              </Empty>
            </Card>
          </div>
        </ConfigProvider>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/sesiones')}
            style={{ marginBottom: 16 }}
          >
            Volver a Sesiones
          </Button>

          {sesionInfo && (
            <Alert
              message={`Sesión: ${formatearFecha(sesionInfo.fecha)} - ${formatearHora(sesionInfo.horaInicio)} - ${formatearHora(sesionInfo.horaFin)}`}
              description={`Grupo: ${sesionInfo.grupo?.nombre || 'Sin grupo'} | Lugar: ${getLugarSesion(sesionInfo)}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Contenido principal */}
        <Card
  title={
    <Space>
      <FieldTimeOutlined />
      <span>Alineación</span>
    </Space>
  }
  extra={
    <Space wrap>
      {/* Botón Alineación Inteligente con Tooltip */}
      <Tooltip 
        title={!sesionInfo?.grupo?.id ? "Esta sesión no tiene un grupo asignado" : ""}
      >
        <Button
          type="dashed"
          icon={<ThunderboltOutlined />}
          onClick={() => setModalInteligenteVisible(true)}
          disabled={!sesionInfo?.grupo?.id}
        >
          Alineación Inteligente
        </Button>
      </Tooltip>

      {/* Exportar (solo si hay jugadores) */}
      {alineacion?.jugadores?.length > 0 && (
        <Dropdown menu={menuExportar} trigger={['hover']}>
                    <Button icon={<DownloadOutlined />}>
                      Exportar
                    </Button>
                  </Dropdown>
      )}

      {/* Agregar Jugador - DESHABILITADO SIN GRUPO */}
      <Tooltip 
        title={!sesionInfo?.grupo?.id ? "Esta sesión no tiene un grupo asignado" : ""}
      >
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => {
            setModalVisible(true);
            form.resetFields();
            setFormularioCompleto(false);
          }}
          disabled={!sesionInfo?.grupo?.id || opcionesJugadores.length === 0}
        >
          Agregar Jugador
        </Button>
      </Tooltip>

      {/* Eliminar alineación (SOLO si hay jugadores) */}
      {alineacion?.jugadores?.length > 0 && (
        <Popconfirm
          title="¿Eliminar alineación?"
          description="Esta acción eliminará todos los jugadores"
          onConfirm={handleEliminarAlineacion}
          okText="Eliminar"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DeleteOutlined />}>
            Eliminar
          </Button>
        </Popconfirm>
      )}
    </Space>
  }
>
  {alineacion.jugadores && alineacion.jugadores.length > 0 ? (
    <Tabs
      activeKey={vistaActual}
      onChange={setVistaActual}
      items={[
        {
          key: 'campo',
          label: (
            <span>
              <AimOutlined />
              Vista Campo
            </span>
          ),
          children: (
            <CampoAlineacion
              jugadores={alineacion.jugadores}
              onActualizarPosiciones={async (jugadoresActualizados) => {
                try {
                  const response = await actualizarPosicionesJugadores(alineacion.id, jugadoresActualizados);
                  setAlineacion(response.data);
                } catch (error) {
                  console.error('Error al guardar posiciones:', error);
                  message.error(error.response?.data?.message || 'Error al guardar posiciones');
                }
              }}
              onEliminarJugador={async (jugadorId) => {
                await handleQuitarJugador(jugadorId);
              }}
            />
          )
        },
                  {
                    key: 'tabla',
                    label: (
                      <span>
                        <TableOutlined />
                        Vista Tabla
                      </span>
                    ),
                    children: (
                      <Table
                        columns={columns}
                        dataSource={alineacion.jugadores}
                        rowKey={(record) => `${record.alineacionId}-${record.jugadorId}`}
                        pagination={false}
                        loading={loading}
                        scroll={{ x: 800 }}
                      />
                    )
                  }
                ]}
              />
            ) : (
               <Empty description="No hay jugadores en la alineación">
      {/* TAMBIÉN deshabilitar aquí */}
      <Tooltip 
        title={!sesionInfo?.grupo?.id ? "Esta sesión no tiene un grupo asignado" : ""}
      >
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => {
            setModalVisible(true);
            form.resetFields();
            setFormularioCompleto(false);
          }}
          disabled={!sesionInfo?.grupo?.id}
        >
          Agregar Primer Jugador
        </Button>
      </Tooltip>
    </Empty>
            )}
          </Card>

          {/* Modal Agregar Jugador */}
          <Modal
            title={
              <Space>
                <UserAddOutlined />
                Agregar Jugador a la Alineación
              </Space>
            }
            open={modalVisible}
            onCancel={() => {
              setModalVisible(false);
              form.resetFields();
              setFormularioCompleto(false);
            }}
            footer={[
              <Button
                key="cancel"
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setFormularioCompleto(false);
                }}
              >
                Cancelar
              </Button>,
              <Button
                key="add-continue"
                type="default"
                icon={<PlusOutlined />}
                onClick={() => form.submit()}
                disabled={!formularioCompleto}
              >
                Agregar y Continuar
              </Button>,
              <Button
                key="add-close"
                type="primary"
                onClick={() => {
                  form.validateFields().then(values => {
                    handleAgregarJugador(values, false);
                  });
                }}
                disabled={!formularioCompleto}
              >
                Agregar y Cerrar
              </Button>
            ]}
            width={500}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => handleAgregarJugador(values, true)}
              onValuesChange={validarFormularioCompleto}
            >
              <Form.Item
                name="jugadorId"
                label="Jugador"
                rules={[{ required: true, message: 'Selecciona un jugador' }]}
              >
                <Select
                  placeholder="Selecciona un jugador"
                  showSearch
                  options={opcionesJugadores}
                  optionFilterProp="label"
                />
              </Form.Item>

              <Form.Item
                name="posicion"
                label="Posición"
                rules={[{ required: true, message: 'Selecciona una posición' }]}
              >
                <Select placeholder="Selecciona una posición">
                  {POSICIONES.map(pos => (
                    <Select.Option key={pos} value={pos}>
                      {pos}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="orden"
                label="Número / Orden"
                tooltip="Número de dorsal o posición en el orden (opcional)"
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="Ej: 1, 2, 3..."
                />
              </Form.Item>

              <Form.Item
                name="comentario"
                label="Comentario"
              >
                <TextArea
                  rows={3}
                  placeholder="Ej: Capitán, Suplente, Titular, etc."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal Editar Jugador */}
          <Modal
            title={
              <Space>
                <EditOutlined />
                Editar Jugador en Alineación
              </Space>
            }
            open={modalEditVisible}
            onCancel={() => {
              setModalEditVisible(false);
              setJugadorEditando(null);
              formEdit.resetFields();
            }}
            footer={null}
            width={500}
          >
            <Form
              form={formEdit}
              layout="vertical"
              onFinish={handleActualizarJugador}
            >
              <Form.Item
                name="posicion"
                label="Posición"
              >
                <Select placeholder="Selecciona una posición">
                  {POSICIONES.map(pos => (
                    <Select.Option key={pos} value={pos}>
                      {pos}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="orden"
                label="Número / Orden"
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="Número de orden"
                />
              </Form.Item>

              <Form.Item
                name="comentario"
                label="Comentario"
              >
                <TextArea
                  rows={3}
                  placeholder="Comentario adicional"
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => {
                    setModalEditVisible(false);
                    setJugadorEditando(null);
                    formEdit.resetFields();
                  }}>
                    Cancelar
                  </Button>
                  <Button type="primary" htmlType="submit">
                    Guardar Cambios
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
          <ModalAlineacionInteligente
  visible={modalInteligenteVisible}
  onCancel={() => setModalInteligenteVisible(false)}
  onSuccess={() => {
    cargarAlineacion(); 
  }}
  sesionId={sesionId}
  grupoId={sesionInfo?.grupo?.id}
  tieneJugadores={alineacion?.jugadores?.length > 0}
  
/>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}
