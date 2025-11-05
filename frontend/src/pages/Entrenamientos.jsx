import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, message, Empty, Tooltip,
  Modal, Popconfirm, Input, Pagination, ConfigProvider,
  InputNumber, Form, Typography, Divider, Tag, Statistic, Row, Col, Select, Spin
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  SearchOutlined, FileTextOutlined, ClockCircleOutlined,
  OrderedListOutlined, ArrowLeftOutlined, CopyOutlined,
  BarChartOutlined, SortAscendingOutlined, LinkOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  obtenerEntrenamientos,
  obtenerEntrenamientosPorSesion,
  crearEntrenamiento,
  actualizarEntrenamiento,
  eliminarEntrenamiento,
  duplicarEntrenamiento,
  reordenarEntrenamientos,
  obtenerEstadisticas,
  asignarEntrenamientosASesion,
} from '../services/entrenamientoSesion.services.js';
import { obtenerSesionPorId, obtenerSesiones } from '../services/sesion.services.js'; // ← si no tienes obtenerSesiones, el modal hace fallback a InputNumber
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import locale from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import MainLayout from '../components/MainLayout.jsx';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
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

// Fila arrastrable con dnd-kit + antd
function SortableRow({ id, children, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    touchAction: 'none',
    ...(isDragging ? { background: '#e6f7ff', opacity: 0.6 } : {}),
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </tr>
  );
}

export default function Entrenamientos() {
  const navigate = useNavigate();
  const { sesionId } = useParams();

  const [entrenamientos, setEntrenamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form] = Form.useForm();
  const [loadingModal, setLoadingModal] = useState(false);

  const [sesionInfo, setSesionInfo] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [estadisticasVisible, setEstadisticasVisible] = useState(false);

  const [modoReordenar, setModoReordenar] = useState(false);
  const [entrenamientosTemp, setEntrenamientosTemp] = useState([]);

  const [query, setQuery] = useState('');
  const debouncedQ = useDebounced(query, 400);

  // Asignación de globales
  const [modalAsignarVisible, setModalAsignarVisible] = useState(false);
  const [entrenamientoAsignar, setEntrenamientoAsignar] = useState(null);
  const [sesionesDisponibles, setSesionesDisponibles] = useState([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  const [sesionSeleccionadaManual, setSesionSeleccionadaManual] = useState(null);
  const [loadingAsignar, setLoadingAsignar] = useState(false);

  // Sensor sin distancia mínima (mejor con antd table)
  const sensors = useSensors(useSensor(PointerSensor));

  const cargarEntrenamientos = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      if (sesionId) {
        const data = await obtenerEntrenamientosPorSesion(parseInt(sesionId));
        setEntrenamientos(data);
        setEntrenamientosTemp(data);
        setPagination({ current: 1, pageSize: data.length, total: data.length });
      } else {
        const filtros = { q: debouncedQ, page, limit: pageSize };
        const { entrenamientos: data, pagination: p } = await obtenerEntrenamientos(filtros);
        setEntrenamientos(data);
        setPagination({
          current: p.currentPage,
          pageSize: p.itemsPerPage,
          total: p.totalItems,
        });
      }
    } catch (error) {
      console.error('Error cargando entrenamientos:', error);
      message.error('Error al cargar los entrenamientos');
    } finally {
      setLoading(false);
    }
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

  // Cargar sesiones una sola vez (para Selects) – opcional
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


  useEffect(() => {
    cargarEntrenamientos(1, pagination.pageSize);
    cargarInfoSesion();
    if (!sesionId) {
      // En vista general me sirve tener las sesiones cargadas para crear/asignar
      cargarSesionesDisponibles();
    }
  }, [debouncedQ, sesionId]);

  const abrirModalCrear = () => {
    setEditando(null);
    form.resetFields();
    if (sesionId) form.setFieldsValue({ sesionId: parseInt(sesionId) });
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
      // En vista general, sesionId es opcional
      const payload = sesionId ? { ...values, sesionId: parseInt(sesionId) } : values;
      if (payload.sesionId === undefined) delete payload.sesionId;

      if (editando) {
        await actualizarEntrenamiento(editando.id, payload);
        message.success('Entrenamiento actualizado correctamente');
      } else {
        await crearEntrenamiento(payload);
        message.success('Entrenamiento creado correctamente');
      }
      setModalVisible(false);
      form.resetFields();
      cargarEntrenamientos(pagination.current, pagination.pageSize);
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
      cargarEntrenamientos(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error eliminando entrenamiento:', error);
      message.error(error.response?.data?.message || 'Error al eliminar el entrenamiento');
    }
  };

  const handleDuplicar = async (id) => {
    try {
      await duplicarEntrenamiento(id, sesionId ? parseInt(sesionId) : null);
      message.success('Entrenamiento duplicado correctamente');
      cargarEntrenamientos(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error duplicando entrenamiento:', error);
      message.error(error.response?.data?.message || 'Error al duplicar el entrenamiento');
    }
  };

  const abrirModalAsignar = async (entrenamiento) => {
    setEntrenamientoAsignar(entrenamiento);
    setSesionSeleccionada(null);
    setSesionSeleccionadaManual(null);
    setModalAsignarVisible(true);
  };

  const handleAsignar = async () => {
    try {
      setLoadingAsignar(true);
      const destino =
        sesionSeleccionada ??
        (sesionSeleccionadaManual ? parseInt(sesionSeleccionadaManual) : null);

      if (!destino) {
        message.warning('Selecciona o ingresa un ID de sesión');
        setLoadingAsignar(false);
        return;
      }

      await asignarEntrenamientosASesion(destino, [entrenamientoAsignar.id]);
      message.success('Entrenamiento asignado correctamente');
      setModalAsignarVisible(false);
      setEntrenamientoAsignar(null);
      setSesionSeleccionada(null);
      setSesionSeleccionadaManual(null);
      cargarEntrenamientos(pagination.current, pagination.pageSize);
    } catch (e) {
      console.error(e);
      message.error('No se pudo asignar el entrenamiento');
    } finally {
      setLoadingAsignar(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setEntrenamientosTemp((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const guardarReordenamiento = async () => {
    try {
      setLoading(true);
      const nuevosOrdenes = entrenamientosTemp.map((e, index) => ({
        id: e.id,
        orden: index + 1,
      }));
      await reordenarEntrenamientos(parseInt(sesionId), nuevosOrdenes);
      message.success('Entrenamientos reordenados correctamente');
      setModoReordenar(false);
      cargarEntrenamientos(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error reordenando:', error);
      message.error('Error al reordenar los entrenamientos');
      setEntrenamientosTemp(entrenamientos);
    } finally {
      setLoading(false);
    }
  };

  const cancelarReordenamiento = () => {
    setModoReordenar(false);
    setEntrenamientosTemp(entrenamientos);
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
          <Tag color="blue" icon={<OrderedListOutlined />}>
            {orden || '—'}
          </Tag>
          {!record.sesionId && (
            <Tag color="gold">Global</Tag>
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
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <Text strong>{titulo}</Text>
        </div>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (desc) => (
        <Text type="secondary" ellipsis={{ tooltip: desc }}>
          {desc || '—'}
        </Text>
      ),
    },
    {
      title: 'Duración',
      dataIndex: 'duracionMin',
      key: 'duracionMin',
      render: (duracion) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#52c41a' }} />
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

  const dataSource = modoReordenar ? entrenamientosTemp : entrenamientos;

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

            {modoReordenar && (
              <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
                <Space>
                  <Text strong>Modo Reordenar:</Text>
                  <Text>Arrastra las filas para cambiar el orden</Text>
                  <Button type="primary" size="small" onClick={guardarReordenamiento}>
                    Guardar Orden
                  </Button>
                  <Button size="small" onClick={cancelarReordenamiento}>
                    Cancelar
                  </Button>
                </Space>
              </div>
            )}

            {modoReordenar && sesionId ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={entrenamientosTemp.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: 'block' }}>
                    <Table
                      columns={columns.filter(col => !col.hidden)}
                      dataSource={dataSource}
                      rowKey="id"
                      loading={loading}
                      pagination={false}
                      components={{ body: { row: SortableRow } }}
                      onRow={(record) => ({ id: record.id })}
                    />
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <Table
                columns={columns.filter(col => !col.hidden)}
                dataSource={dataSource}
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
            )}

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
                orden: sesionId ? 1 : null, // en global no forzamos orden
                ...(sesionId && { sesionId: parseInt(sesionId) })
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
                      tooltip="Puedes dejarlo vacío para crear un entrenamiento global"
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
                      tooltip="Puedes dejarlo vacío para crear un entrenamiento global"
                    >
                      <InputNumber style={{ width: '100%' }} min={1} placeholder="ID de la sesión (opcional)" />
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
              >
                <TextArea rows={4} placeholder="Describe el entrenamiento..." />
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

                {sesionId && (
                  <Form.Item
                    name="orden"
                    label="Orden"
                    rules={[
                      { type: 'number', min: 1, message: 'Mínimo 1' },
                      { type: 'number', max: 99, message: 'Máximo 99' },
                    ]}
                  >
                    <InputNumber style={{ width: 150 }} min={1} max={99} placeholder="1" />
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
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChartOutlined />
                <span>Estadísticas de Entrenamientos</span>
              </div>
            }
            open={estadisticasVisible}
            onCancel={() => setEstadisticasVisible(false)}
            footer={[
              <Button key="close" onClick={() => setEstadisticasVisible(false)}>
                Cerrar
              </Button>
            ]}
            width={600}
          >
            {estadisticas ? (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Total Entrenamientos"
                    value={estadisticas.totalEntrenamientos}
                    prefix={<FileTextOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Con Duración Definida"
                    value={estadisticas.entrenamientosConDuracion}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Duración Total"
                    value={estadisticas.duracionTotalMinutos}
                    suffix="min"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Duración Promedio"
                    value={estadisticas.duracionPromedioMinutos}
                    suffix="min"
                    precision={1}
                  />
                </Col>
              </Row>
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">Cargando estadísticas...</Text>
              </div>
            )}
          </Modal>

          {/* Modal Asignar entrenamiento global a sesión */}
         <Modal
  title={
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <LinkOutlined />
      <span>Asignar entrenamiento a sesión</span>
    </div>
  }
  open={modalAsignarVisible}
  onCancel={() => {
    setModalAsignarVisible(false);
    setEntrenamientoAsignar(null);
    setSesionSeleccionada(null);
  }}
  footer={[
    <Button key="cancel" onClick={() => setModalAsignarVisible(false)}>
      Cancelar
    </Button>,
    <Button
      key="ok"
      type="primary"
      loading={loadingAsignar}
      onClick={handleAsignar}
      disabled={!sesionSeleccionada}
    >
      Asignar
    </Button>,
  ]}
  width={600}
>
  {entrenamientoAsignar && (
    <>
      <p>
        <Text strong>Entrenamiento:</Text> {entrenamientoAsignar.titulo}
      </p>
      <p style={{ marginBottom: 12 }}>
        <Text type="secondary">
          Selecciona la sesión activa a la que deseas asignarlo:
        </Text>
      </p>

      <Select
        showSearch
        style={{ width: '100%' }}
        placeholder="Selecciona una sesión activa"
        allowClear
        value={sesionSeleccionada}
        onChange={setSesionSeleccionada}
        loading={loadingSesiones}
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={sesionesDisponibles.map((s) => ({
          value: s.id,
          label: `${formatearFecha(s.fecha)} - ${formatearHora(s.horaInicio)} - ${formatearHora(s.horaFin)}`,
        }))}
      />

      {!loadingSesiones && sesionesDisponibles.length === 0 && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            No se encontraron sesiones activas para asignar.
          </Text>
        </div>
      )}
    </>
  )}
</Modal>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}
