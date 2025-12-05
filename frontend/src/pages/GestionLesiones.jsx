import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Table, Button, Modal, Form, Input, DatePicker, Space, Tag,
  App, Popconfirm, Card, Select, Tooltip, Avatar, Empty,
  Pagination, ConfigProvider, Input as AntInput, Dropdown, Spin
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  FileExcelOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined,
  MedicineBoxOutlined, CheckCircleOutlined, ClockCircleOutlined,
  SearchOutlined, UserOutlined, DownloadOutlined, FilePdfOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  crearLesion, obtenerLesiones, actualizarLesion,
  eliminarLesion, exportarLesionesExcel,
  exportarLesionesPDF
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
  const [exportando, setExportando] = useState(false);
  const { message } = App.useApp();

  const [lesiones, setLesiones] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalEditando, setModalEditando] = useState(false);
  const [lesionActual, setLesionActual] = useState(null);

  // Estados de paginación separados
  const [paginaActual, setPaginaActual] = useState(1);
  const [tamañoPagina, setTamañoPagina] = useState(10);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // Filtros (server-side)
  const [busqueda, setBusqueda] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [filtroJugadorId, setFiltroJugadorId] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);

  // Estados para búsqueda de jugadores en modal
  const [busquedaJugador, setBusquedaJugador] = useState('');
  const [jugadoresModal, setJugadoresModal] = useState([]);
  const [loadingJugadoresModal, setLoadingJugadoresModal] = useState(false);
  const searchTimeout = useRef(null);

  const [form] = Form.useForm();

  const esEstudiante = rolUsuario === 'estudiante';
  const puedeEditar = ['entrenador', 'superadmin'].includes(rolUsuario);

  // Control de carreras de requests
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { 
      mountedRef.current = false;
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Debounce de búsqueda (500 ms)
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(busqueda.trim()), 500);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    if (puedeEditar) cargarJugadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeEditar]);

  const cargarJugadores = async () => {
    try {
      const data = await obtenerJugadores({ limite: 100 });
      setJugadores(data.data?.jugadores || data.jugadores || []);
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      message.error('Error al cargar jugadores');
    }
  };

  const cargarLesiones = async (
    page = 1,
    pageSize = 10,
    q = qDebounced,
    jugador = filtroJugadorId,
    rango = rangoFechas
  ) => {
    // Prevenir llamadas duplicadas
    if (loadingRef.current) return;

    const reqId = ++requestIdRef.current;
    loadingRef.current = true;
    setLoading(true);

    try {
      const params = {
        page: page,
        limit: pageSize,
      };

      if (q) params.q = q;
      if (jugador) params.jugadorId = jugador;
      if (rango) {
        params.desde = rango[0].format('YYYY-MM-DD');
        params.hasta = rango[1].format('YYYY-MM-DD');
      }

      const response = await obtenerLesiones(params);

      if (reqId !== requestIdRef.current) return;

      const lista = response.data?.lesiones || [];
      setLesiones(lista);
      setPaginaActual(response.data?.pagina ?? page);
      setTotalRegistros(response.data?.total ?? 0);

    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error al cargar lesiones:', error);
      message.error(error.message || 'Error al cargar lesiones');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  };

  // Efecto para carga inicial y cambios de filtros
  useEffect(() => {
    setPaginaActual(1);
    cargarLesiones(1, tamañoPagina, qDebounced, filtroJugadorId, rangoFechas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, filtroJugadorId, rangoFechas]);

  // Handler de cambio de página
  const handlePageChange = (page, pageSize) => {
    if (pageSize !== tamañoPagina) {
      setTamañoPagina(pageSize);
      setPaginaActual(1);
      cargarLesiones(1, pageSize, qDebounced, filtroJugadorId, rangoFechas);
    } else {
      setPaginaActual(page);
      cargarLesiones(page, pageSize, qDebounced, filtroJugadorId, rangoFechas);
    }
  };

  // Búsqueda de jugadores en modal
  const handleBuscarJugadoresModal = (value) => {
    setBusquedaJugador(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!value || value.trim().length < 2) {
      setJugadoresModal([]);
      setLoadingJugadoresModal(false);
      return;
    }

    setLoadingJugadoresModal(true);

    searchTimeout.current = setTimeout(() => {
      buscarJugadoresModal(value.trim());
    }, 500);
  };

  const buscarJugadoresModal = async (q) => {
    setLoadingJugadoresModal(true);
    try {
      const data = await obtenerJugadores({ q, limit: 100 });
      setJugadoresModal(Array.isArray(data.jugadores) ? data.jugadores : 
                        Array.isArray(data.data?.jugadores) ? data.data.jugadores : []);
    } catch (error) {
      console.error('Error buscando jugadores:', error);
      message.error('Error al buscar los jugadores');
      setJugadoresModal([]);
    } finally {
      setLoadingJugadoresModal(false);
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
      message.success('Lesión registrada');
      setModalVisible(false);
      form.resetFields();
      setBusquedaJugador('');
      setJugadoresModal([]);
      cargarLesiones(paginaActual, tamañoPagina);
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
      cargarLesiones(paginaActual, tamañoPagina);
    } catch (error) {
      console.error(error);
      message.error(error.message || 'Error al actualizar lesión');
    }
  };

  const handleEliminar = async (id) => {
    try {
      await eliminarLesion(id);
      message.success('Lesión eliminada exitosamente');
      cargarLesiones(paginaActual, tamañoPagina);
    } catch (error) {
      console.error(error);
      message.error(error.message || 'Error al eliminar lesión');
    }
  };

  const handleExportarExcel = async () => {
    try {
      setExportando(true);
      const params = {};
      if (qDebounced) params.q = qDebounced;
      if (filtroJugadorId) params.jugadorId = filtroJugadorId;
      if (rangoFechas) {
        params.desde = rangoFechas[0].format('YYYY-MM-DD');
        params.hasta = rangoFechas[1].format('YYYY-MM-DD');
      }

      const result = await exportarLesionesExcel(params);

      if (result.modo === "web" && result.blob) {
        descargarArchivo(result.blob, result.nombre);
        message.success("Excel descargado correctamente");
      } else if (result.modo === "mobile" && result.base64) {
        console.log("BASE64 recibido:", result.base64);
        message.success("Archivo generado (mobile)");
      }

    } catch (error) {
      console.error('Error:', error);
      message.error(error.message || 'Error al exportar a Excel');
    } finally {
      setExportando(false);
    }
  };

  const handleExportarPDF = async () => {
    try {
      setExportando(true);
      const params = {};
      if (qDebounced) params.q = qDebounced;
      if (filtroJugadorId) params.jugadorId = filtroJugadorId;
      if (rangoFechas) {
        params.desde = rangoFechas[0].format('YYYY-MM-DD');
        params.hasta = rangoFechas[1].format('YYYY-MM-DD');
      }

      const result = await exportarLesionesPDF(params);

      if (result.modo === "web" && result.blob) {
        descargarArchivo(result.blob, result.nombre);
        message.success("PDF descargado correctamente");
      } else if (result.modo === "mobile" && result.base64) {
        console.log("BASE64 recibido:", result.base64);
        message.success("Archivo generado (mobile)");
      }

    } catch (error) {
      console.error('Error:', error);
      message.error(error.message || 'Error al exportar a PDF');
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

  const abrirModalCrear = () => {
    form.resetFields();
    setBusquedaJugador('');
    setJugadoresModal([]);
    setModalVisible(true);
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

  const cerrarModal = () => {
    setModalVisible(false);
    setModalEditando(false);
    setLesionActual(null);
    form.resetFields();
    setBusquedaJugador('');
    setJugadoresModal([]);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroJugadorId(null);
    setRangoFechas(null);
  };

  const opcionesJugadores = useMemo(() => {
    return (jugadores || []).map((j) => {
      const nombre = j.usuario?.nombre || `Jugador #${j.id}`;
      const apellido = j.usuario?.apellido || '';
      const rut = j.usuario?.rut || '';

      return {
        value: j.id,
        label: `${nombre} ${apellido} - ${rut}`.trim(),
      };
    });
  }, [jugadores]);

  const columns = [
    {
      title: 'Jugador',
      key: 'jugador',
      render: (_, record) => {
        const nombre = `${record.jugador?.usuario?.nombre || 'Sin nombre'} ${record.jugador?.usuario?.apellido || ''}`.trim();
        const rut = record.jugador?.usuario?.rut || '';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#014898' }} />
            <div>
              <div style={{ fontWeight: 500 }}>{nombre}</div>
              {rut && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{rut}</div>}
            </div>
          </div>
        );
      },
      width: 220,
    },
    {
      title: 'Diagnóstico',
      dataIndex: 'diagnostico',
      key: 'diagnostico',
      ellipsis: { showTitle: false },
      render: (texto) => (
        <Tooltip title={texto}>
          <span>{texto || '—'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Fecha Inicio',
      dataIndex: 'fechaInicio',
      key: 'fechaInicio',
      render: (fecha) => (fecha ? dayjs(fecha).format('DD/MM/YYYY') : '—'),
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
            <CheckCircleOutlined />
            Recuperado
          </span>
        ) : (
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
            <ClockCircleOutlined />
            Activa
          </span>
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

  const hayFiltrosActivos = !!(qDebounced || filtroJugadorId || rangoFechas);

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
                <Space>
                  {hayFiltrosActivos && <Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
                  <Dropdown menu={menuExportar} trigger={['hover']}>
                    <Button
                      icon={<DownloadOutlined />}
                      loading={exportando}
                    >
                      Exportar
                    </Button>
                  </Dropdown>

                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={abrirModalCrear}
                  >
                    Nueva Lesión
                  </Button>
                </Space>
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

              <RangePicker
                value={rangoFechas}
                onChange={setRangoFechas}
                format="DD/MM/YYYY"
                placeholder={['Fecha inicio', 'Fecha fin']}
                style={{ width: '100%' }}
              />
            </div>

            {/* Tabla */}
            <Table
              columns={columns}
              dataSource={lesiones}
              rowKey="id"
              loading={loading}
              pagination={false}
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
                        onClick={abrirModalCrear}
                      >
                        Registrar primera lesión
                      </Button>
                    )}
                  </Empty>
                ),
              }}
            />

            {/* Paginación */}
            {lesiones.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
                <Pagination
                  current={paginaActual}
                  pageSize={tamañoPagina}
                  total={totalRegistros}
                  onChange={handlePageChange}
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
            onCancel={cerrarModal}
            footer={null}
            width={600}
            destroyOnClose
          >
            <Form 
              form={form} 
              layout="vertical" 
              onFinish={modalEditando ? handleEditar : handleCrear}
              style={{ marginTop: 16 }}
            >
              {!modalEditando && !esEstudiante && (
                <Form.Item
                  label="Jugador"
                  name="jugadorId"
                  rules={[{ required: true, message: 'Seleccione un jugador' }]}
                >
                  <Select
                    showSearch
                    placeholder="Buscar jugador por nombre o RUT..."
                    filterOption={false}
                    searchValue={busquedaJugador}
                    onSearch={handleBuscarJugadoresModal}
                    loading={loadingJugadoresModal}
                    notFoundContent={
                      loadingJugadoresModal ? (
                        <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <Spin size="small" />
                          <span style={{ marginLeft: 8 }}>Buscando...</span>
                        </div>
                      ) : busquedaJugador.trim().length > 0 && busquedaJugador.trim().length < 2 ? (
                        <div style={{ padding: '8px 12px', color: '#8c8c8c', textAlign: 'center' }}>
                          Escriba al menos 2 caracteres
                        </div>
                      ) : busquedaJugador.trim().length >= 2 && jugadoresModal.length === 0 ? (
                        <div style={{ padding: '8px 12px', color: '#8c8c8c', textAlign: 'center' }}>
                          No se encontraron jugadores
                        </div>
                      ) : jugadoresModal.length === 0 ? (
                        <div style={{ padding: '8px 12px', color: '#8c8c8c', textAlign: 'center' }}>
                          Escriba para buscar...
                        </div>
                      ) : null
                    }
                  >
                    {jugadoresModal.map((j) => (
                      <Select.Option key={j.id} value={j.id}>
                        {`${j.usuario?.nombre || 'Sin nombre'} ${j.usuario?.apellido || ''} — ${j.usuario?.rut || 'Sin RUT'}`}
                      </Select.Option>
                    ))}
                  </Select>
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

              <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={cerrarModal}>
                    Cancelar
                  </Button>
                  <Button type="primary" htmlType="submit">
                    {modalEditando ? 'Actualizar' : 'Registrar'}
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