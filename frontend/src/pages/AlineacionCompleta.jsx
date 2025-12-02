import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Space, Empty, Tooltip,
  Modal, Form, Select, InputNumber, Input, Spin, Popconfirm,
  Tabs, ConfigProvider, Typography, Alert, Avatar, Dropdown, App, Row, Col
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  ThunderboltOutlined, UserOutlined, PlusOutlined, DeleteOutlined, EditOutlined,
  UserAddOutlined, FieldTimeOutlined, TableOutlined, AimOutlined, ArrowLeftOutlined,
  DownloadOutlined, FileExcelOutlined, FilePdfOutlined, TeamOutlined
} from '@ant-design/icons';
import InfoAlineacionInteligente from '../components/InfoAlineacionInteligente.jsx';

import {
  crearAlineacion, obtenerAlineacionPorSesion, agregarJugadorAlineacion,
  actualizarJugadorAlineacion, quitarJugadorAlineacion, eliminarAlineacion,
  actualizarPosicionesJugadores, exportarAlineacionExcel, exportarAlineacionPDF
} from '../services/alineacion.services.js';
import { obtenerJugadores } from '../services/jugador.services.js';
import { obtenerSesionPorId } from '../services/sesion.services.js';
import MainLayout from '../components/MainLayout.jsx';
import CampoAlineacion from '../components/CampoAlineacion.jsx';
import PanelSuplentes from '../components/PanelSuplentes.jsx';
import EstadisticasAlineacion from '../components/EstadisticasAlineacion.jsx';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
import ModalAlineacionInteligente from '../components/ModalAlineacionInteligente.jsx';

const { TextArea } = Input;
const { Text } = Typography;

const POSICIONES = [
  'Portero', 'Defensa Central', 'Defensa Central Derecho', 'Defensa Central Izquierdo',
  'Lateral Derecho', 'Lateral Izquierdo', 'Mediocentro Defensivo', 'Mediocentro',
  'Mediocentro Ofensivo', 'Extremo Derecho', 'Extremo Izquierdo', 'Delantero Centro'
];

const MAX_JUGADORES_ALINEACION = 26; // 11 titulares + 15 suplentes
const MAX_TITULARES = 11;
const MAX_SUPLENTES = 15;


export default function AlineacionCompleta() {
  const { sesionId } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [modalInteligenteVisible, setModalInteligenteVisible] = useState(false);

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
    // Validar que el dorsal esté presente
    if (!values.orden) {
      message.error('El dorsal es obligatorio');
      return;
    }
    const dorsalRepetido = alineacion.jugadores?.some(j => j.orden === values.orden);
    if (dorsalRepetido) {
      message.error(`El dorsal #${values.orden} ya está en uso. Por favor elige otro número.`);
      return;
    }


    // Validar límites
    const totalJugadores = alineacion.jugadores?.length || 0;
    if (totalJugadores >= MAX_JUGADORES_ALINEACION) {
      message.error(`No se pueden agregar más de ${MAX_JUGADORES_ALINEACION} jugadores a la alineación`);
      return;
    }

    // Validar límite de titulares (dorsal 1-11)
    if (values.orden >= 1 && values.orden <= 11) {
      const titularesActuales = alineacion.titulares?.length || 0;
      if (titularesActuales >= MAX_TITULARES) {
        message.error(`Ya hay ${MAX_TITULARES} titulares. Usa dorsal 12 o mayor para suplentes`);
        return;
      }
    }

    // Validar límite de suplentes (dorsal 12+)
    if (values.orden > 11) {
      const suplentesActuales = alineacion.suplentes?.length || 0;
      if (suplentesActuales >= MAX_SUPLENTES) {
        message.error(`Ya hay ${MAX_SUPLENTES} suplentes. No se pueden agregar más`);
        return;
      }
    }

    await agregarJugadorAlineacion({
      alineacionId: alineacion.id,
      ...values
    });

    message.success('Jugador agregado correctamente');
    await cargarAlineacion();

    if (continuar) {
      form.resetFields();
      // Calcular el siguiente dorsal y establecerlo como requerido
      const siguienteDorsal = calcularSiguienteDorsal();
      form.setFieldsValue({
        orden: siguienteDorsal
      });
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
      message.success("Jugador eliminado")
      cargarAlineacion();
    } catch (error) {
      console.error('Error al quitar jugador:', error);
      message.error(error.response?.data?.message || 'Error al quitar jugador');
    }
  };

  const handleEliminarAlineacion = async () => {
    try {
      await eliminarAlineacion(alineacion.id);
      message.success('Alineación eliminada');
      setAlineacion(null);
    } catch (error) {
      message.error('Error al eliminar la alineación');
      console.error(error);
    }
  };

  const handlePromoverATitular = async (jugador) => {
    try {
      // Asignar un orden 1-11 disponible y posición en cancha
      const ordenesUsados = new Set(
        alineacion.titulares?.map(t => t.orden).filter(Boolean) || []
      );
      let nuevoOrden = 1;
      while (ordenesUsados.has(nuevoOrden) && nuevoOrden <= 11) {
        nuevoOrden++;
      }

      if (nuevoOrden > 11) {
        message.warning('Ya hay 11 titulares. Debes remover uno primero.');
        return;
      }

      // Posiciones por defecto según la posición del jugador
      const posicionesDefecto = {
        'portero': { x: 50, y: 90 },
        'defensa central': { x: 50, y: 75 },
        'defensa central derecho': { x: 60, y: 75 },
        'defensa central izquierdo': { x: 40, y: 75 },
        'lateral derecho': { x: 80, y: 75 },
        'lateral izquierdo': { x: 20, y: 75 },
        'mediocentro defensivo': { x: 50, y: 60 },
        'mediocentro': { x: 50, y: 45 },
        'mediocentro ofensivo': { x: 50, y: 30 },
        'extremo derecho': { x: 80, y: 30 },
        'extremo izquierdo': { x: 20, y: 30 },
        'delantero centro': { x: 50, y: 15 }
      };

      const posKey = jugador.posicion?.toLowerCase() || 'mediocentro';
      const posDefecto = posicionesDefecto[posKey] || { x: 50, y: 50 };

      await actualizarJugadorAlineacion({
        alineacionId: alineacion.id,
        jugadorId: jugador.jugadorId,
        orden: nuevoOrden,
        posicionX: posDefecto.x,
        posicionY: posDefecto.y
      });

      message.success(`${jugador.jugador?.usuario?.nombre} promovido a titular`);
      cargarAlineacion();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al promover jugador');
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

  const opcionesJugadores = useMemo(() => {
    return jugadoresFiltrados.map(j => ({
      value: j.id,
      label: `${j.usuario?.nombre || `Jugador #${j.id}`} ${j.usuario?.apellido || ''} - ${j.usuario?.rut || ''}`.trim()
    }));
  }, [jugadoresFiltrados]);

  const columns = [
    {
      title: 'Dorsal',
      dataIndex: 'orden',
      key: 'orden',
      width: 80,
      sorter: (a, b) => (a.orden || 999) - (b.orden || 999),
      render: (orden, record) => {
        const color = record.tipo === 'titular' ? 'green' : 
                      record.tipo === 'suplente' ? 'gold' : 'default';
        return orden ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: color === 'green' ? '#52c41a' : 
                             color === 'gold' ? '#faad14' : '#d9d9d9',
              display: 'inline-block'
            }} />
            #{orden}
          </span>
        ) : <Text type="secondary">—</Text>;
      }
    },
    {
      title: 'Jugador',
      key: 'jugador',
      render: (_, record) => (
        <Space>
          <Avatar 
            size={40} 
            icon={<UserOutlined />} 
            style={{ 
              backgroundColor: record.tipo === 'titular' ? '#52c41a' : 
                              record.tipo === 'suplente' ? '#faad14' : '#8c8c8c'
            }}
          />
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
      title: 'Tipo',
      key: 'tipo',
      width: 100,
      render: (_, record) => {
        const config = {
          titular: { color: 'green', text: 'Titular' },
          suplente: { color: 'gold', text: 'Suplente' },
        };
        const tipo = config[record.tipo] || config.sin_definir;
        return <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid #B9BBBB',
          backgroundColor: '#f5f5f5'
        }}>{tipo.text}</span>;
      }
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
  const calcularSiguienteDorsal = () => {
  if (!alineacion?.jugadores || alineacion.jugadores.length === 0) {
    return 1;
  }
  
  // Obtener todos los dorsales existentes
  const dorsalesUsados = alineacion.jugadores
    .map(j => j.orden)
    .filter(orden => orden != null)
    .sort((a, b) => a - b);
  
  // Si no hay dorsales, empezar en 1
  if (dorsalesUsados.length === 0) {
    return 1;
  }
  
  // Buscar el primer número disponible desde 1
  let siguienteDorsal = 1;
  for (const dorsal of dorsalesUsados) {
    if (dorsal === siguienteDorsal) {
      siguienteDorsal++;
    } else if (dorsal > siguienteDorsal) {
      break;
    }
  }
  
  return siguienteDorsal;
};

const puedeAgregarJugador = () => {
  if (!alineacion) return true;
  const totalJugadores = alineacion.jugadores?.length || 0;
  return totalJugadores < MAX_JUGADORES_ALINEACION;
};

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
                description="No hay alineación creada para esta sesión"
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
            <InfoAlineacionInteligente alineacion={alineacion} />

          {/* Estadísticas */}
          {alineacion?.estadisticas && (
            <EstadisticasAlineacion 
              estadisticas={alineacion.estadisticas}
              jugadores={alineacion.jugadores}
            />
          )}

          <Card
            title={
              <Space>
                <FieldTimeOutlined />
                <span>Alineación</span>
              </Space>
            }
            extra={
              <Space wrap>
                <Tooltip title={!sesionInfo?.grupo?.id ? "Esta sesión no tiene un grupo asignado" : ""}>
                  <Button
                    type="dashed"
                    icon={<ThunderboltOutlined />}
                    onClick={() => setModalInteligenteVisible(true)}
                    disabled={!sesionInfo?.grupo?.id}
                  >
                    Alineación Sugerida
                  </Button>
                </Tooltip>

                {alineacion?.jugadores?.length > 0 && (
                  <Dropdown menu={menuExportar} trigger={['hover']}>
                    <Button icon={<DownloadOutlined />}>Exportar</Button>
                  </Dropdown>
                )}

                <Tooltip 
  title={
    !sesionInfo?.grupo?.id 
      ? "Esta sesión no tiene un grupo asignado" 
      : !puedeAgregarJugador() 
        ? `Límite alcanzado (${MAX_JUGADORES_ALINEACION} jugadores máximo)`
        : ""
  }
>
  <Button
    type="primary"
    icon={<UserAddOutlined />}
    onClick={() => {
      setModalVisible(true);
      form.resetFields();
      form.setFieldsValue({
        orden: calcularSiguienteDorsal()
      });
      setFormularioCompleto(false);
    }}
    disabled={
      !sesionInfo?.grupo?.id || 
      opcionesJugadores.length === 0 || 
      !puedeAgregarJugador()
    }
  >
    Agregar Jugador {alineacion && `(${alineacion.jugadores?.length || 0}/${MAX_JUGADORES_ALINEACION})`}
  </Button>
</Tooltip>

                {alineacion?.jugadores?.length > 0 && (
                  <Popconfirm
                    title="¿Eliminar alineación?"
                    description="Esta acción eliminará todos los jugadores"
                    onConfirm={handleEliminarAlineacion}
                    okText="Eliminar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger icon={<DeleteOutlined />}>Eliminar</Button>
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
                    label: (<span><AimOutlined /> Vista Campo</span>),
                    children: (
                      <Row gutter={16}>
                        <Col xs={24} lg={17}>
                          <CampoAlineacion
                            titulares={alineacion.titulares || []}
                            onActualizarPosiciones={async (jugadoresActualizados) => {
                              try {
                                const response = await actualizarPosicionesJugadores(
                                  alineacion.id, 
                                  jugadoresActualizados
                                );
                                setAlineacion(response.data);
                              } catch (error) {
                                console.error('Error al guardar posiciones:', error);
                                message.error(error.response?.data?.message || 'Error al guardar posiciones');
                              }
                            }}
                            onEliminarJugador={handleQuitarJugador}
                          />
                        </Col>
                        <Col xs={24} lg={7}>
                          <PanelSuplentes
                            suplentes={alineacion.suplentes || []}
                            sinDefinir={alineacion.sinDefinir || []}
                            onEliminarJugador={handleQuitarJugador}
                            onPromoverATitular={handlePromoverATitular}
                          />
                        </Col>
                      </Row>
                    )
                  },
                  {
                    key: 'tabla',
                    label: (<span><TableOutlined /> Vista Tabla</span>),
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
                <Tooltip title={!sesionInfo?.grupo?.id ? "Esta sesión no tiene un grupo asignado" : ""}>
                  <Button
  type="primary"
  icon={<UserAddOutlined />}
  onClick={() => {
    setModalVisible(true);
    form.resetFields();
    // Establecer dorsal 1 para el primer jugador
    form.setFieldsValue({
      orden: calcularSiguienteDorsal()
    });
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
            title={<Space><UserAddOutlined />Agregar Jugador a la Alineación</Space>}
            open={modalVisible}
            onCancel={() => {
              setModalVisible(false);
              form.resetFields();
              setFormularioCompleto(false);
            }}
            footer={[
              <Button key="cancel" onClick={() => {
                setModalVisible(false);
                form.resetFields();
                setFormularioCompleto(false);
              }}>
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
                    <Select.Option key={pos} value={pos}>{pos}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
  name="orden"
  label="Dorsal"
  required  // ← AGREGAR ESTA LÍNEA para mostrar el asterisco rojo
  rules={[
    { required: true, message: 'El dorsal es obligatorio' },
    { type: 'number', min: 1, max: 30, message: 'Dorsal debe estar entre 1 y 30' }
  ]}
  tooltip="Dorsal 1-11 para titulares, 12-26 para suplentes"
  
>
  <InputNumber
    min={1}
    max={30}
    style={{ width: '100%' }}
    placeholder="Ej: 1, 10, 12..."
  />
</Form.Item>
              <Form.Item name="comentario" label="Comentario">
                <TextArea
                  rows={3}
                  placeholder="Ej: Capitán, Buen estado físico, etc."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal Editar Jugador */}
          <Modal
            title={<Space><EditOutlined />Editar Jugador en Alineación</Space>}
            open={modalEditVisible}
            onCancel={() => {
              setModalEditVisible(false);
              setJugadorEditando(null);
              formEdit.resetFields();
            }}
            footer={null}
            width={500}
          >
            <Form form={formEdit} layout="vertical" onFinish={handleActualizarJugador}>
              <Form.Item name="posicion" label="Posición">
                <Select placeholder="Selecciona una posición">
                  {POSICIONES.map(pos => (
                    <Select.Option key={pos} value={pos}>{pos}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
  name="orden"
  label="Dorsal"
  rules={[
    { required: true, message: 'El dorsal es obligatorio' },
    { type: 'number', min: 1, max: 99, message: 'Dorsal debe estar entre 1 y 99' }
  ]}
  tooltip="Dorsal 1-11 para titulares, 12-26 para suplentes"
  extra={
    <div style={{ fontSize: 12, marginTop: 4 }}>
      <div>• Titulares: Dorsal 1-11 (máx. {MAX_TITULARES})</div>
      <div>• Suplentes: Dorsal 12+ (máx. {MAX_SUPLENTES})</div>
      {alineacion && (
        <div style={{ marginTop: 4, color: '#1890ff' }}>
          Actual: {alineacion.titulares?.length || 0} titulares, {alineacion.suplentes?.length || 0} suplentes
        </div>
      )}
    </div>
  }
>
  <InputNumber
    min={1}
    max={99}
    style={{ width: '100%' }}
    placeholder="Ej: 1, 10, 12..."
  />
</Form.Item>

              <Form.Item name="comentario" label="Comentario">
                <TextArea rows={3} placeholder="Comentario adicional" maxLength={500} showCount />
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