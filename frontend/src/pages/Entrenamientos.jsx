import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Empty, Tooltip,
  Modal, Popconfirm, Input, Pagination, ConfigProvider,
  InputNumber, Form, Typography, Divider, Select, Spin, App, Dropdown
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  SearchOutlined, FileTextOutlined, ClockCircleOutlined,
  OrderedListOutlined, ArrowLeftOutlined, CopyOutlined,
  BarChartOutlined, SortAscendingOutlined, LinkOutlined, DownloadOutlined,
  FileExcelOutlined, FilePdfOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  exportarEntrenamientosExcel,
  exportarEntrenamientosPDF,
  obtenerEntrenamientos,
  obtenerEntrenamientosPorSesion,
  crearEntrenamiento,
  actualizarEntrenamiento,
  eliminarEntrenamiento,
  duplicarEntrenamiento,
  obtenerEstadisticas,
  asignarEntrenamientosASesion,
} from '../services/entrenamientoSesion.services.js';
import { obtenerSesionPorId, obtenerSesiones } from '../services/sesion.services.js';
import locale from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import MainLayout from '../components/MainLayout.jsx';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
import ModalEstadisticas from '../components/ModalEstadisticas.jsx';
import ModalAsignarSesion from '../components/ModalAsignarSesion.jsx';
import ModalReordenar from '../components/ModalReordenar.jsx';

const { TextArea } = Input;
const { Text } = Typography;
dayjs.locale('es');

function useDebounced(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// Función auxiliar para renderizar texto con enlaces clickeables
const renderizarTextoConEnlaces = (texto) => {
  if (!texto) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = texto.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1890ff', textDecoration: 'underline' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function Entrenamientos() {
  const [exportando, setExportando] = useState(false);
  const navigate = useNavigate();
  const { sesionId } = useParams();
  const { message } = App.useApp();
  
  const [entrenamientos, setEntrenamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ Inicializar paginación desde sessionStorage
  const [pagination, setPagination] = useState(() => {
    if (!sesionId) {
      const saved = sessionStorage.getItem('entrenamientos_pagination');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return { current: 1, pageSize: 10, total: 0 };
        }
      }
    }
    return { current: 1, pageSize: 10, total: 0 };
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form] = Form.useForm();
  const [loadingModal, setLoadingModal] = useState(false);

  const [sesionInfo, setSesionInfo] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [estadisticasVisible, setEstadisticasVisible] = useState(false);

  const [modoReordenar, setModoReordenar] = useState(false);

  const [query, setQuery] = useState('');
  const debouncedQ = useDebounced(query, 400);

  // Asignación de globales
  const [modalAsignarVisible, setModalAsignarVisible] = useState(false);
  const [entrenamientoAsignar, setEntrenamientoAsignar] = useState(null);
  const [sesionesDisponibles, setSesionesDisponibles] = useState([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);

  const cargarEntrenamientos = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      if (sesionId) {
        // ✅ Vista de sesión: mostrar todos sin afectar paginación guardada
        const data = await obtenerEntrenamientosPorSesion(parseInt(sesionId));
        setEntrenamientos(data);
        // ✅ NO actualizar pagination aquí para no sobrescribir el guardado
      } else {
        // ✅ Vista general: usar paginación normal
        const filtros = { q: debouncedQ, page, limit: pageSize };
        const { entrenamientos: data, pagination: p } = await obtenerEntrenamientos(filtros);
        setEntrenamientos(data);
        
        const newPagination = {
          current: p.currentPage,
          pageSize: p.itemsPerPage,
          total: p.totalItems,
        };
        
        setPagination(newPagination);
        
        // ✅ Guardar en sessionStorage solo para vista general
        sessionStorage.setItem('entrenamientos_pagination', JSON.stringify(newPagination));
      }
    } catch (error) {
      console.error('Error cargando entrenamientos:', error);
      message.error('Error al cargar los entrenamientos');
    } finally {
      setLoading(false);
    }
  };

  const handleExportarExcel = async () => {
    setExportando(true);
    try {
      const filtros = {
        q: query || undefined,
        sesionId: sesionId || undefined,
      };
      
      const result = await exportarEntrenamientosExcel(filtros);

      if (result.modo === "web" && result.blob) {
        descargarArchivo(result.blob, result.nombre);
        message.success("Excel descargado correctamente");
      } else if (result.modo === "mobile" && result.base64) {
        console.log("BASE64 recibido:", result.base64);
        message.success("Archivo generado (mobile)");
      }
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      message.error(error.message || 'Error al exportar entrenamientos a Excel');
    } finally {
      setExportando(false);
    }
  };

  const handleExportarPDF = async () => {
    setExportando(true);
    try {
      const filtros = {
        q: query || undefined,
        sesionId: sesionId || undefined,
      };
      
      const result = await exportarEntrenamientosPDF(filtros);

      if (result.modo === "web" && result.blob) {
        descargarArchivo(result.blob, result.nombre);
        message.success("PDF descargado correctamente");
      } else if (result.modo === "mobile" && result.base64) {
        console.log("BASE64 recibido:", result.base64);
        message.success("Archivo generado (mobile)");
      }
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      message.error(error.message || 'Error al exportar entrenamientos a PDF');
    } finally {
      setExportando(false);
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

  const cargarInfoSesion = async () => {
    if (sesionId) {
      try {
        const sesion = await obtenerSesionPorId(parseInt(sesionId));
        setSesionInfo(sesion);
      } catch (error) {
        console.error('Error cargando info de sesión:', error);
      }
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const stats = await obtenerEstadisticas(sesionId ? parseInt(sesionId) : null);
      setEstadisticas(stats);
      setEstadisticasVisible(true);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      message.error('Error al cargar estadísticas');
    }
  };

  const cargarSesionesDisponibles = async () => {
    setLoadingSesiones(true);
    try {
      const resultado = await obtenerSesiones({ limit: 50, page: 1 });
      setSesionesDisponibles(resultado?.sesiones || []);
    } catch (err) {
      console.error('Error cargando sesiones:', err);
      message.error('Error al cargar sesiones activas');
    } finally {
      setLoadingSesiones(false);
    }
  };

  const calcularSiguienteOrden = () => {
    if (!sesionId || entrenamientos.length === 0) return 1;
    
    const ordenesExistentes = entrenamientos
      .filter(e => e.orden !== null)
      .map(e => e.orden);
    
    if (ordenesExistentes.length === 0) return 1;
    
    const maxOrden = Math.max(...ordenesExistentes);
    return maxOrden + 1;
  };

  useEffect(() => {
    if (sesionId) {
      // ✅ En vista de sesión: cargar todos (sin página/límite)
      cargarEntrenamientos();
    } else {
      // ✅ En vista general: usar página y tamaño guardados
      const savedPage = pagination.current || 1;
      const savedPageSize = pagination.pageSize || 10;
      cargarEntrenamientos(savedPage, savedPageSize);
    }
    
    cargarInfoSesion();
    if (!sesionId) {
      cargarSesionesDisponibles();
    }
  }, [debouncedQ, sesionId]);

  const abrirModalCrear = () => {
    setEditando(null);
    form.resetFields();
    
    const siguienteOrden = calcularSiguienteOrden();
    
    if (sesionId) {
      form.setFieldsValue({ 
        sesionId: parseInt(sesionId),
        orden: siguienteOrden
      });
    }
    
    setModalVisible(true);
  };

  const abrirModalEditar = (entrenamiento) => {
    setEditando(entrenamiento);
    form.setFieldsValue({
      ...entrenamiento,
      sesionId: entrenamiento.sesionId || undefined,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      setLoadingModal(true);
      
      let payload = { ...values };
      
      if (sesionId) {
        payload.sesionId = parseInt(sesionId);
      } else {
        payload.sesionId = values.sesionId !== undefined ? values.sesionId : null;
        
        if (payload.sesionId === null) {
          payload.orden = null;
        }
      }

      if (editando) {
        await actualizarEntrenamiento(editando.id, payload);
        message.success('Entrenamiento actualizado correctamente');
      } else {
        await crearEntrenamiento(payload);
        message.success('Entrenamiento creado correctamente');
      }
      
      setModalVisible(false);
      form.resetFields();
      
      // ✅ Recargar con los parámetros correctos según el contexto
      if (sesionId) {
        cargarEntrenamientos();
      } else {
        cargarEntrenamientos(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      console.error('Error guardando entrenamiento:', error);
      message.error(error.response?.data?.message || 'Error al guardar el entrenamiento');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await eliminarEntrenamiento(id);
      message.success('Entrenamiento eliminado correctamente');
      
      // ✅ Recargar con parámetros correctos
      if (sesionId) {
        cargarEntrenamientos();
      } else {
        cargarEntrenamientos(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      console.error('Error eliminando entrenamiento:', error);
      message.error(error.response?.data?.message || 'Error al eliminar el entrenamiento');
    }
  };

  const handleDuplicar = async (id) => {
    try {
      await duplicarEntrenamiento(id, sesionId ? parseInt(sesionId) : null);
      
      const mensaje = sesionId 
        ? 'Entrenamiento duplicado en esta sesión'
        : 'Entrenamiento duplicado como global. Puede asignarlo usando el botón de asignar.';
      
      message.success(mensaje);
      
      // ✅ Recargar con parámetros correctos
      if (sesionId) {
        cargarEntrenamientos();
      } else {
        cargarEntrenamientos(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      console.error('Error duplicando entrenamiento:', error);
      message.error(error.response?.data?.message || 'Error al duplicar el entrenamiento');
    }
  };

  const abrirModalAsignar = async (entrenamiento) => {
    setEntrenamientoAsignar(entrenamiento);
    setModalAsignarVisible(true);
  };

  const handleAsignar = async (sesionIdDestino) => {
    await asignarEntrenamientosASesion(sesionIdDestino, [entrenamientoAsignar.id]);
    message.success('Entrenamiento asignado correctamente');
    setModalAsignarVisible(false);
    setEntrenamientoAsignar(null);
    cargarEntrenamientos(pagination.current, pagination.pageSize);
  };

  const handlePageChange = (page, pageSize) => {
    cargarEntrenamientos(page, pageSize);
  };

  const columns = [
    {
      title: 'Orden',
      dataIndex: 'orden',
      key: 'orden',
      render: (orden, record) => (
        <Space direction="vertical" size={0}>
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
            <OrderedListOutlined />
            {orden || '—'}
          </span>
          {!record.sesionId && (
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #B9BBBB',
              backgroundColor: '#f5f5f5'
            }}>
              Global
            </span>
          )}
        </Space>
      ),
      width: 110,
      align: 'center',
    },
    {
      title: 'Título',
      dataIndex: 'titulo',
      key: 'titulo',
      render: (titulo) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileTextOutlined/>
          <Text strong>{titulo}</Text>
        </div>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (desc) => {
        if (!desc) return <Text type="secondary">—</Text>;
        
        return (
          <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Text type="secondary">
              {renderizarTextoConEnlaces(desc)}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Duración',
      dataIndex: 'duracionMin',
      key: 'duracionMin',
      render: (duracion) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#006B5B' }} />
          <span>{duracion ? `${duracion} min` : '—'}</span>
        </div>
      ),
      width: 120,
      align: 'center',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          {!sesionId && !record.sesionId && (
            <Tooltip title="Asignar a sesión">
              <Button
                type="link"
                icon={<LinkOutlined />}
                onClick={() => abrirModalAsignar(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="Duplicar">
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={() => handleDuplicar(record.id)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => abrirModalEditar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar este entrenamiento?"
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
      width: 180,
      align: 'center',
      hidden: modoReordenar,
    },
  ];

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileTextOutlined style={{ fontSize: 24 }} />
                <span>
                  {sesionId
                    ? `Entrenamientos - ${formatearFecha(sesionInfo?.fecha)}`
                    : 'Entrenamientos'}
                </span>
              </div>
            }
            extra={
              <Space wrap>
                {sesionId && (
                  <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sesiones')}>
                    Volver
                  </Button>
                )}
                <Dropdown menu={menuExportar} trigger={['hover']}>
                  <Button icon={<DownloadOutlined />} loading={exportando}>
                    Exportar
                  </Button>
                </Dropdown>
                <Button icon={<BarChartOutlined />} onClick={cargarEstadisticas}>
                  Estadísticas
                </Button>
                {sesionId && !modoReordenar && (
                  <Button icon={<SortAscendingOutlined />} onClick={() => setModoReordenar(true)}>
                    Reordenar
                  </Button>
                )}
                {!modoReordenar && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={abrirModalCrear}>
                    Nuevo
                  </Button>
                )}
              </Space>
            }
          >
            {sesionInfo && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <Text strong>Sesión: </Text>
                <Text>{formatearFecha(sesionInfo.fecha)} | </Text>
                <Text>{formatearHora(sesionInfo.horaInicio)} - {formatearHora(sesionInfo.horaFin)} | </Text>
                <Text>{sesionInfo.cancha?.nombre} | </Text>
                <Text>{sesionInfo.grupo?.nombre}</Text>
              </div>
            )}

            {!sesionId && !modoReordenar && (
              <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Input
                  allowClear
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  prefix={<SearchOutlined />}
                  placeholder="Buscar por título o descripción..."
                  style={{ width: 300 }}
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => cargarEntrenamientos(pagination.current, pagination.pageSize)}
                >
                  Actualizar
                </Button>
              </div>
            )}

            <Table
              columns={columns.filter(col => !col.hidden)}
              dataSource={entrenamientos}
              rowKey="id"
              loading={loading}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty
                    description={query ? 'No se encontraron entrenamientos' : 'No hay entrenamientos registrados'}
                  >
                    <Button type="primary" icon={<PlusOutlined />} onClick={abrirModalCrear}>
                      Crear primer entrenamiento
                    </Button>
                  </Empty>
                ),
              }}
            />

            {entrenamientos.length > 0 && !sesionId && !modoReordenar && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total) => `Total: ${total} entrenamientos`}
                  pageSizeOptions={['5', '10', '20', '50']}
                />
              </div>
            )}
          </Card>

          {/* Modal Crear/Editar */}
          <Modal
            title={editando ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'}
            open={modalVisible}
            onCancel={() => {
              setModalVisible(false);
              form.resetFields();
              setEditando(null);
            }}
            footer={null}
            width={600}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                duracionMin: 30,
                orden: null,
              }}
            >
              {!sesionId && (
                <>
                  {loadingSesiones ? (
                    <Spin style={{ marginBottom: 12 }} />
                  ) : sesionesDisponibles.length > 0 ? (
                    <Form.Item
                      name="sesionId"
                      label="Asignar a sesión (opcional)"
                      tooltip="Puede dejarlo vacío para crear un entrenamiento global"
                    >
                      <Select
                        allowClear
                        placeholder="Sin sesión (global)"
                        options={sesionesDisponibles.map((s) => ({
                          value: s.id,
                          label: `${formatearFecha(s.fecha)} - ${formatearHora(s.horaInicio)} - ${formatearHora(s.horaFin)} - ${s.grupo?.nombre || 'Sin grupo'}`
                        }))}
                      />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      name="sesionId"
                      label="Asignar a sesión (opcional)"
                      tooltip="Puede dejarlo vacío para crear un entrenamiento global"
                    >
                      <InputNumber style={{ width: '100%' }} min={1} />
                    </Form.Item>
                  )}
                </>
              )}

              {sesionId && (
                <Form.Item name="sesionId" hidden>
                  <InputNumber />
                </Form.Item>
              )}

              <Form.Item
                name="titulo"
                label="Título"
                rules={[
                  { required: true, message: 'El título es obligatorio' },
                  { min: 3, message: 'Mínimo 3 caracteres' },
                  { max: 100, message: 'Máximo 100 caracteres' },
                ]}
              >
                <Input placeholder="Ej: Calentamiento general" />
              </Form.Item>

              <Form.Item
                name="descripcion"
                label="Descripción"
                rules={[{ max: 1000, message: 'Máximo 1000 caracteres' }]}
                tooltip="Puede incluir enlaces (https://...) que serán clickeables"
              >
                <TextArea rows={4} placeholder="Describa el entrenamiento... (puede incluir enlaces)" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  name="duracionMin"
                  label="Duración (minutos)"
                  rules={[
                    { type: 'number', min: 1, message: 'Mínimo 1 minuto' },
                    { type: 'number', max: 300, message: 'Máximo 300 minutos' },
                  ]}
                >
                  <InputNumber style={{ width: 150 }} min={1} max={300} placeholder="30" />
                </Form.Item>

                {(sesionId || (editando && editando.sesionId)) && (
                  <Form.Item
                    name="orden"
                    label="Orden"
                    tooltip="Se asigna automáticamente el siguiente disponible"
                    rules={[
                      { type: 'number', min: 1, message: 'Mínimo 1' },
                      { type: 'number', max: 99, message: 'Máximo 99' },
                    ]}
                  >
                    <InputNumber style={{ width: 150 }} min={1} max={99} />
                  </Form.Item>
                )}
              </Space>

              <Divider />

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loadingModal}>
                    {editando ? 'Actualizar' : 'Crear'}
                  </Button>
                  <Button
                    onClick={() => {
                      setModalVisible(false);
                      form.resetFields();
                      setEditando(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal Estadísticas */}
          <ModalEstadisticas
            visible={estadisticasVisible}
            onClose={() => setEstadisticasVisible(false)}
            estadisticas={estadisticas}
          />

          {/* Modal Asignar Sesión */}
          <ModalAsignarSesion
            visible={modalAsignarVisible}
            onClose={() => {
              setModalAsignarVisible(false);
              setEntrenamientoAsignar(null);
            }}
            entrenamiento={entrenamientoAsignar}
            sesionesDisponibles={sesionesDisponibles}
            loadingSesiones={loadingSesiones}
            onAsignar={handleAsignar}
          />

          {/* Modal Reordenar */}
          {sesionId && (
            <ModalReordenar
              visible={modoReordenar}
              onClose={() => setModoReordenar(false)}
              entrenamientos={entrenamientos}
              sesionId={sesionId}
              onSuccess={() => cargarEntrenamientos()}
            />
          )}
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}