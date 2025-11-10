import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Input, DatePicker, Space, Tag,
  message, Popconfirm, Card, Select, Tooltip, Avatar, Empty,
  Pagination, ConfigProvider, Input as AntInput
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  MedicineBoxOutlined, CheckCircleOutlined, ClockCircleOutlined,
  SearchOutlined, UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  crearLesion, obtenerLesiones, actualizarLesion,
  eliminarLesion
} from '../services/lesion.services.js';
import { obtenerJugadores } from '../services/jugador.services.js';
import { useAuth } from '../context/AuthContext.jsx';
import MainLayout from '../components/MainLayout.jsx';

dayjs.locale('es');

const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function GestionLesiones() {
  const { usuario } = useAuth();
  const rolUsuario = usuario?.rol;
  const jugadorId = usuario?.jugadorId;

  const [lesiones, setLesiones] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEditando, setModalEditando] = useState(false);
  const [lesionActual, setLesionActual] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroJugadorId, setFiltroJugadorId] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);

  const [form] = Form.useForm();

  const esEstudiante = rolUsuario === 'estudiante';
  const puedeEditar = ['entrenador', 'superadmin'].includes(rolUsuario);

  useEffect(() => {
    if (puedeEditar) cargarJugadores();
    cargarLesiones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, filtroJugadorId, rangoFechas]);

  const cargarJugadores = async () => {
    try {
      const data = await obtenerJugadores({ limite: 100 });
      setJugadores(data.data?.jugadores || data.jugadores || []);
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      message.error('Error al cargar jugadores');
    }
  };

  const cargarLesiones = async () => {
    setLoading(true);
    try {
      const params = {
        pagina: pagination.current,
        limite: pagination.pageSize,
      };

      if (filtroJugadorId) params.jugadorId = filtroJugadorId;
      if (rangoFechas) {
        params.desde = rangoFechas[0].format('YYYY-MM-DD');
        params.hasta = rangoFechas[1].format('YYYY-MM-DD');
      }

      const response = await obtenerLesiones(params);
      setLesiones(response.data?.lesiones || []);
      setPagination(prev => ({
        ...prev,
        total: response.data?.total || 0,
        totalPages: response.data?.totalPaginas,
      }));
    } catch (error) {
      console.error('Error al cargar lesiones:', error);
      message.error(error.message || 'Error al cargar lesiones');
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async (values) => {
    try {
      const payload = {
        ...values,
        fechaInicio: values.fechaInicio.format('YYYY-MM-DD'),
        fechaAltaEstimada: values.fechaAltaEstimada?.format('YYYY-MM-DD') || null,
        fechaAltaReal: values.fechaAltaReal?.format('YYYY-MM-DD') || null,
      };
      if (esEstudiante) payload.jugadorId = jugadorId;

      await crearLesion(payload);
      message.success('Lesión registrada exitosamente');
      setModalVisible(false);
      form.resetFields();
      cargarLesiones();
    } catch (error) {
      console.error(error);
      message.error(error.message || 'Error al crear lesión');
    }
  };

  const handleEditar = async (values) => {
    try {
      const payload = {
        ...values,
        fechaInicio: values.fechaInicio.format('YYYY-MM-DD'),
        fechaAltaEstimada: values.fechaAltaEstimada?.format('YYYY-MM-DD') || null,
        fechaAltaReal: values.fechaAltaReal?.format('YYYY-MM-DD') || null,
      };

      await actualizarLesion(lesionActual.id, payload);
      message.success('Lesión actualizada exitosamente');
      setModalEditando(false);
      setLesionActual(null);
      form.resetFields();
      cargarLesiones();
    } catch (error) {
      console.error(error);
      message.error(error.message || 'Error al actualizar lesión');
    }
  };

  const handleEliminar = async (id) => {
    try {
      await eliminarLesion(id);
      message.success('Lesión eliminada exitosamente');
      cargarLesiones();
    } catch (error) {
      console.error(error);
      message.error(error.message || 'Error al eliminar lesión');
    }
  };

  const abrirModalEditar = (record) => {
    setLesionActual(record);
    form.setFieldsValue({
      diagnostico: record.diagnostico,
      fechaInicio: dayjs(record.fechaInicio),
      fechaAltaEstimada: record.fechaAltaEstimada ? dayjs(record.fechaAltaEstimada) : null,
      fechaAltaReal: record.fechaAltaReal ? dayjs(record.fechaAltaReal) : null,
      jugadorId: record.jugador?.id,
    });
    setModalEditando(true);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroJugadorId(null);
    setRangoFechas(null);
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
  };

  // Opciones memoizadas para Select (evita ReactNode -> toLowerCase error)
  const opcionesJugadores = useMemo(() => {
    return (jugadores || []).map((j) => ({
      value: j.id,
      label: `${j.usuario?.nombre || `Jugador #${j.id}`} - ${j.usuario?.rut || ''}`.trim(),
    }));
  }, [jugadores]);

  // Filtrado local para la tabla (búsqueda rápida)
  const lesionesFiltradas = lesiones.filter(lesion => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    const nombreJugador = lesion.jugador?.usuario?.nombre?.toLowerCase() || '';
    const rutJugador = lesion.jugador?.usuario?.rut?.toLowerCase() || '';
    const diagnostico = lesion.diagnostico?.toLowerCase() || '';
    return (
      nombreJugador.includes(searchLower) ||
      rutJugador.includes(searchLower) ||
      diagnostico.includes(searchLower)
    );
  });

  const columns = [
    {
      title: 'Jugador',
      key: 'jugador',
      render: (_, record) => {
        const nombre = record.jugador?.usuario?.nombre || 'Sin nombre';
        const rut = record.jugador?.usuario?.rut || '';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <div>
              <div style={{ fontWeight: 500 }}>{nombre}</div>
              {rut && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{rut}</div>}
            </div>
          </div>
        );
      },
      width: 200,
    },
    {
      title: 'Diagnóstico',
      dataIndex: 'diagnostico',
      key: 'diagnostico',
      ellipsis: { showTitle: false },
      render: (texto) => (
        <Tooltip title={texto}>
          <span>{texto}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Fecha Inicio',
      dataIndex: 'fechaInicio',
      key: 'fechaInicio',
      render: (fecha) => dayjs(fecha).format('DD/MM/YYYY'),
      align: 'center',
      width: 120,
    },
    {
      title: 'Alta Estimada',
      dataIndex: 'fechaAltaEstimada',
      key: 'fechaAltaEstimada',
      render: (fecha) => (fecha ? dayjs(fecha).format('DD/MM/YYYY') : '—'),
      align: 'center',
      width: 130,
    },
    {
      title: 'Alta Real',
      dataIndex: 'fechaAltaReal',
      key: 'fechaAltaReal',
      render: (fecha) => (fecha ? dayjs(fecha).format('DD/MM/YYYY') : '—'),
      align: 'center',
      width: 130,
    },
    {
      title: 'Estado',
      key: 'estado',
      render: (_, record) =>
        record.fechaAltaReal ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Recuperado
          </Tag>
        ) : (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            Activa
          </Tag>
        ),
      align: 'center',
      width: 120,
    },
    ...(puedeEditar
      ? [
          {
            title: 'Acciones',
            key: 'acciones',
            align: 'center',
            width: 150,
            render: (_, record) => (
              <Space size="small">
                <Tooltip title="Editar">
                  <Button
                    size="middle"
                    icon={<EditOutlined />}
                    onClick={() => abrirModalEditar(record)}
                  />
                </Tooltip>

                <Popconfirm
                  title="¿Eliminar lesión?"
                  description="Esta acción no se puede deshacer"
                  onConfirm={() => handleEliminar(record.id)}
                  okText="Sí, eliminar"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Eliminar">
                    <Button danger size="middle" icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  const hayFiltrosActivos = busqueda || filtroJugadorId || rangoFechas;

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <MedicineBoxOutlined style={{ fontSize: 24 }} />
                <span>Gestión de Lesiones</span>
              </div>
            }
            extra={
              puedeEditar && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalVisible(true)}
                >
                  Nueva Lesión
                </Button>
              )
            }
          >
            {/* Filtros */}
            <div
              style={{
                marginBottom: 16,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              <AntInput
                allowClear
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                prefix={<SearchOutlined />}
                placeholder="Buscar por nombre, RUT o diagnóstico..."
              />

              {!esEstudiante && (
                <Select
                  allowClear
                  showSearch
                  value={filtroJugadorId}
                  onChange={setFiltroJugadorId}
                  placeholder="Filtrar por jugador"
                  options={opcionesJugadores}
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                />
              )}

              <RangePicker
                value={rangoFechas}
                onChange={setRangoFechas}
                format="DD/MM/YYYY"
                placeholder={['Fecha inicio', 'Fecha fin']}
                style={{ width: '100%' }}
              />

              {hayFiltrosActivos && <Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
            </div>

            {/* Tabla */}
            <Table
              columns={columns}
              dataSource={lesionesFiltradas}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={false}
              size="middle"
              locale={{
                emptyText: (
                  <Empty
                    description={
                      hayFiltrosActivos
                        ? 'No se encontraron lesiones con los filtros aplicados'
                        : 'No hay lesiones registradas'
                    }
                  >
                    {!hayFiltrosActivos && puedeEditar && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                      >
                        Registrar primera lesión
                      </Button>
                    )}
                  </Empty>
                ),
              }}
            />

            {lesionesFiltradas.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total) => `Total: ${total} lesiones`}
                  pageSizeOptions={['5', '10', '20', '50']}
                />
              </div>
            )}
          </Card>

          {/* Modal Crear/Editar */}
          <Modal
            title={modalEditando ? 'Editar Lesión' : 'Nueva Lesión'}
            open={modalVisible || modalEditando}
            onCancel={() => {
              setModalVisible(false);
              setModalEditando(false);
              setLesionActual(null);
              form.resetFields();
            }}
            footer={null}
            width={600}
          >
            <Form form={form} layout="vertical" onFinish={modalEditando ? handleEditar : handleCrear}>
              {!modalEditando && !esEstudiante && (
                <Form.Item
                  label="Jugador"
                  name="jugadorId"
                  rules={[{ required: true, message: 'Seleccione un jugador' }]}
                >
                  <Select
                    showSearch
                    placeholder="Seleccione un jugador"
                    options={opcionesJugadores}
                    optionFilterProp="label"
                  />
                </Form.Item>
              )}

              <Form.Item
                label="Diagnóstico"
                name="diagnostico"
                rules={[
                  { required: true, message: 'Ingrese el diagnóstico' },
                  { max: 2000, message: 'Máximo 2000 caracteres' },
                ]}
              >
                <TextArea rows={4} placeholder="Descripción de la lesión" />
              </Form.Item>

              <Form.Item
                label="Fecha de Inicio"
                name="fechaInicio"
                rules={[{ required: true, message: 'Seleccione la fecha de inicio' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item label="Fecha de Alta Estimada" name="fechaAltaEstimada">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item label="Fecha de Alta Real" name="fechaAltaReal">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    {modalEditando ? 'Actualizar' : 'Registrar'}
                  </Button>
                  <Button
                    onClick={() => {
                      setModalVisible(false);
                      setModalEditando(false);
                      setLesionActual(null);
                      form.resetFields();
                    }}
                  >
                    Cancelar
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}
