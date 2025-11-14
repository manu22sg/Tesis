import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Empty,
  Typography,
  Tag,
  Spin,
  Input,
  Select,
  Row,
  Col,
  Modal,
  Alert,
  Tabs,
  Pagination,
  ConfigProvider,
  Tooltip,
  Popconfirm,
  Avatar
} from 'antd';
import locale from 'antd/locale/es_ES';
import { obtenerCanchas } from '../services/cancha.services.js';

import {
  EnvironmentOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SearchOutlined,
  DeleteOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerGrupoPorId } from '../services/grupo.services.js';
import DetalleSesionModal from '../components/DetalleSesionModal.jsx';
import { obtenerSesionPorId, obtenerSesiones, eliminarSesion } from '../services/sesion.services.js';
import MainLayout from '../components/MainLayout.jsx';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
import JugadorDetalleModal from '../components/JugadorDetalleModal.jsx';
import { obtenerJugadorPorId, removerJugadorDeGrupo, asignarJugadorAGrupo, obtenerJugadores } from '../services/jugador.services.js';

const { Title, Text } = Typography;
const { Option } = Select;

export default function GrupoMiembros() {
  const { id } = useParams();
  const navigate = useNavigate();
  const grupoId = Number(id);

  // Estado base
  const [grupo, setGrupo] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detalles sesión/jugador
  const [detalleModal, setDetalleModal] = useState(false);
  const [sesionDetalle, setSesionDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [canchasOpts, setCanchasOpts] = useState([]);

  const [modalJugadorVisible, setModalJugadorVisible] = useState(false);
  const [jugadorDetalle, setJugadorDetalle] = useState(null);
  const [loadingJugadorDetalle, setLoadingJugadorDetalle] = useState(false);

  // Filtros miembros (cliente)
  const [busqueda, setBusqueda] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCarrera, setFiltroCarrera] = useState('todos');

  // Paginación miembros
  const [paginationMiembros, setPaginationMiembros] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  //Filtros entrenamientos
  const [filtrosEntrenamientos, setFiltrosEntrenamientos] = useState({
  q: '',
  canchaId: null,
});
const [busquedaEntrenamiento, setBusquedaEntrenamiento] = useState('');

  // Modal agregar miembros
  const [modalAgregar, setModalAgregar] = useState(false);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [agregando, setAgregando] = useState(false);

  // Entrenamientos/Sesiones (server-side)
  const [tabActiva, setTabActiva] = useState('miembros');
  const [sesiones, setSesiones] = useState([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const [paginationEntrenamientos, setPaginationEntrenamientos] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Guards para carreras de requests y unmount
  const requestIdGrupoRef = useRef(0);
  const requestIdSesionesRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
  (async () => {
    try {
      const r = await obtenerCanchas({ limit: 200 });
      const lista = r?.canchas || r?.data?.canchas || [];
      setCanchasOpts(lista);
    } catch (e) {
      // no interrumpimos la UI si falla
      console.warn('No se pudieron cargar canchas', e);
    }
  })();
}, []);

  // Debounce búsqueda (miembros)
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(busqueda.trim()), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Carga datos grupo + miembros
  useEffect(() => {
    const cargarDatos = async () => {
      const reqId = ++requestIdGrupoRef.current;
      try {
        setLoading(true);
        const grupoData = await obtenerGrupoPorId(grupoId);
        if (reqId !== requestIdGrupoRef.current) return;

        setGrupo(grupoData);

        const miembrosData = (grupoData.jugadorGrupos || []).map(jg => ({
          id: jg.jugador?.id,
          jugadorGrupoId: jg.id,
          nombre: jg.jugador?.usuario?.nombre || 'Sin nombre',
          rut: jg.jugador?.usuario?.rut || 'Sin RUT',
          email: jg.jugador?.usuario?.email || '—',
          carrera: jg.jugador?.usuario?.carrera?.nombre || '—',
          telefono: jg.jugador?.telefono || '—',
          anioIngreso: jg.jugador?.anioIngreso || '—',
          estado: jg.jugador?.estado || 'activo',
          fechaNacimiento: jg.jugador?.fechaNacimiento,
          fechaAsignacion: jg.fechaAsignacion,
        }));

        setMiembros(miembrosData);
      } catch (error) {
        if (!mountedRef.current) return;
        console.error('Error cargando datos:', error);
        message.error('Error al cargar los datos del grupo');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    if (!Number.isNaN(grupoId)) {
      cargarDatos();
    }
  }, [grupoId]);

  useEffect(() => {
  const delay = setTimeout(() => {
    setFiltrosEntrenamientos(prev => ({ ...prev, q: busquedaEntrenamiento.trim() }));
  }, 500);
  return () => clearTimeout(delay);
}, [busquedaEntrenamiento]);


  // Filtros y paginado de miembros (todo con useMemo)
  const miembrosFiltrados = useMemo(() => {
    let resultado = miembros;

    if (qDebounced) {
      const q = qDebounced.toLowerCase();
      resultado = resultado.filter(m =>
        (m.nombre || '').toLowerCase().includes(q) ||
        (m.rut || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.carrera || '').toLowerCase().includes(q)
      );
    }

    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(m => m.estado === filtroEstado);
    }

    if (filtroCarrera !== 'todos') {
      resultado = resultado.filter(m => m.carrera === filtroCarrera);
    }

    return resultado;
  }, [miembros, qDebounced, filtroEstado, filtroCarrera]);

  // Actualizar total y reset de página si cambian filtros/búsqueda
  useEffect(() => {
    setPaginationMiembros(prev => ({
      ...prev,
      total: miembrosFiltrados.length,
      current: 1
    }));
  }, [miembrosFiltrados.length]);

  const miembrosPaginados = useMemo(() => {
    const start = (paginationMiembros.current - 1) * paginationMiembros.pageSize;
    return miembrosFiltrados.slice(start, start + paginationMiembros.pageSize);
  }, [miembrosFiltrados, paginationMiembros.current, paginationMiembros.pageSize]);

  // Carreras únicas (para filtro)
  const carrerasUnicas = useMemo(
    () => [...new Set(miembros.map(m => m.carrera).filter(Boolean))],
    [miembros]
  );

  // Sesiones 
const cargarSesiones = async (
  page = 1,
  limit = paginationEntrenamientos.pageSize
) => {
  const reqId = ++requestIdSesionesRef.current;
  try {
    setLoadingSesiones(true);

    // Solo usamos q y canchaId
    const qParam = (filtrosEntrenamientos.q || '').trim();
    const canchaIdParam =
      filtrosEntrenamientos.canchaId != null
        ? Number(filtrosEntrenamientos.canchaId)
        : undefined;

    // Llamada al backend (si no soporta q/canchaId no pasa nada, luego filtramos local)
    const data = await obtenerSesiones({
      grupoId,
      page,
      limit,
      ...(qParam ? { q: qParam } : {}),
      ...(canchaIdParam ? { canchaId: canchaIdParam } : {}),
    });

    // Evitar condición de carrera
    if (reqId !== requestIdSesionesRef.current) return;

    const sesionesData = data?.sesiones || data?.data?.sesiones || [];
    const paginationData = data?.pagination || data?.data?.pagination || {};

    // Filtro local seguro por si el backend no filtra
    const q = qParam.toLowerCase();
    const canchaId = canchaIdParam;

    let filtradas = sesionesData;
    if (q || canchaId) {
      filtradas = sesionesData.filter((s) => {
        const canchaNom = String(s?.cancha?.nombre ?? '').toLowerCase();
        const ubicacion = String(s?.ubicacionExterna ?? '').toLowerCase();
        const objetivos = String(s?.objetivos ?? '').toLowerCase();
                const tipoSesion = String(s?.tipoSesion ?? '').toLowerCase();


        const okCancha = canchaId
          ? Number(s?.cancha?.id) === Number(canchaId)
          : true;

        const okQ = q
          ? canchaNom.includes(q) ||
            ubicacion.includes(q) ||
            tipoSesion.includes(q)
          : true;

        return okCancha && okQ;
      });
    }

    setSesiones(filtradas);
    setPaginationEntrenamientos({
      current: paginationData.currentPage || page,
      pageSize: paginationData.itemsPerPage || limit,
      // Si el backend no manda total, usamos el tamaño filtrado
      total:
        typeof paginationData.totalItems === 'number'
          ? paginationData.totalItems
          : filtradas.length,
    });
  } catch (error) {
    if (!mountedRef.current) return;
    console.error('Error cargando sesiones:', error);
    message.error('Error al cargar los entrenamientos');
  } finally {
    if (mountedRef.current) setLoadingSesiones(false);
  }
};




  // Primera carga de sesiones al entrar en la pestaña y cuando cambia pageSize
  useEffect(() => {
  if (tabActiva === 'entrenamientos') {
    // cada vez que entro a la pestaña, cambie el pageSize, el grupo o los filtros → recargo
    cargarSesiones(1, paginationEntrenamientos.pageSize);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [tabActiva, paginationEntrenamientos.pageSize, grupoId, filtrosEntrenamientos]);



  // Handlers
  const handleRemoverMiembro = async (jugadorId) => {
    try {
      await removerJugadorDeGrupo(jugadorId, grupoId);
      message.success('Jugador removido del grupo correctamente');
      // si quedaste sin elementos en la página, retrocede
      const nextPage =
        miembrosPaginados.length === 1 && paginationMiembros.current > 1
          ? paginationMiembros.current - 1
          : paginationMiembros.current;
      setPaginationMiembros(prev => ({ ...prev, current: nextPage }));
      // recargar miembros
      const grupoData = await obtenerGrupoPorId(grupoId);
      setGrupo(grupoData);
      const miembrosData = (grupoData.jugadorGrupos || []).map(jg => ({
        id: jg.jugador?.id,
        jugadorGrupoId: jg.id,
        nombre: jg.jugador?.usuario?.nombre || 'Sin nombre',
        rut: jg.jugador?.usuario?.rut || 'Sin RUT',
        email: jg.jugador?.usuario?.email || '—',
        carrera: jg.jugador?.usuario?.carrera?.nombre || '—',
        telefono: jg.jugador?.telefono || '—',
        anioIngreso: jg.jugador?.anioIngreso || '—',
        estado: jg.jugador?.estado || 'activo',
        fechaNacimiento: jg.jugador?.fechaNacimiento,
        fechaAsignacion: jg.fechaAsignacion,
      }));
      setMiembros(miembrosData);
    } catch (error) {
      console.error('Error removiendo miembro:', error);
      message.error(error.response?.data?.message || 'Error al remover miembro');
    }
  };

  const handleVerDetalleSesion = async (sesionId) => {
    try {
      setLoadingDetalle(true);
      setDetalleModal(true);
      const detalle = await obtenerSesionPorId(sesionId);
      setSesionDetalle(detalle);
    } catch (error) {
      console.error('Error cargando detalle de sesión:', error);
      message.error('Error al cargar el detalle de la sesión');
      setDetalleModal(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleVerDetalleJugador = async (jugadorId) => {
    try {
      setLoadingJugadorDetalle(true);
      setModalJugadorVisible(true);
      const jugador = await obtenerJugadorPorId(jugadorId);
      setJugadorDetalle(jugador);
    } catch (error) {
      console.error('Error cargando detalle del jugador:', error);
      message.error('Error al cargar el detalle del jugador');
      setModalJugadorVisible(false);
    } finally {
      setLoadingJugadorDetalle(false);
    }
  };

  const handleAgregarMiembro = async () => {
    try {
      setModalAgregar(true);
      const todos = await obtenerJugadores({ limit: 1000 });
      const lista = todos.jugadores || todos?.data?.jugadores || [];
      const idsGrupo = new Set(miembros.map(m => m.id));
      setJugadoresDisponibles(lista.filter(j => !idsGrupo.has(j.id)));
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      message.error('Error al cargar jugadores disponibles');
    }
  };

  const handleConfirmarAgregar = async () => {
    if (!jugadorSeleccionado) {
      message.warning('Selecciona un jugador');
      return;
    }
    try {
      setAgregando(true);
      await asignarJugadorAGrupo(jugadorSeleccionado, grupoId);
      message.success('Jugador agregado al grupo correctamente');
      setModalAgregar(false);
      setJugadorSeleccionado(null);
      // recargar grupo/miembros
      const grupoData = await obtenerGrupoPorId(grupoId);
      const miembrosData = (grupoData.jugadorGrupos || []).map(jg => ({
        id: jg.jugador?.id,
        jugadorGrupoId: jg.id,
        nombre: jg.jugador?.usuario?.nombre || 'Sin nombre',
        rut: jg.jugador?.usuario?.rut || 'Sin RUT',
        email: jg.jugador?.usuario?.email || '—',
        carrera: jg.jugador?.usuario?.carrera?.nombre || '—',
        telefono: jg.jugador?.telefono || '—',
        anioIngreso: jg.jugador?.anioIngreso || '—',
        estado: jg.jugador?.estado || 'activo',
        fechaNacimiento: jg.jugador?.fechaNacimiento,
        fechaAsignacion: jg.fechaAsignacion,
      }));
      setMiembros(miembrosData);
    } catch (error) {
      console.error('Error agregando jugador:', error);
      message.error(error.response?.data?.message || 'Error al agregar al grupo');
    } finally {
      setAgregando(false);
    }
  };

  const handleEliminarSesion = async (sesionId) => {
    try {
      await eliminarSesion(sesionId);
      message.success('Entrenamiento eliminado correctamente');
      cargarSesiones(paginationEntrenamientos.current, paginationEntrenamientos.pageSize);
    } catch (error) {
      console.error('Error eliminando sesión:', error);
      message.error(error.response?.data?.message || 'Error al eliminar entrenamiento');
    }
  };

  // Paginación front/back
  const handlePageChangeMiembros = (page, pageSize) => {
    setPaginationMiembros(prev => ({ ...prev, current: page, pageSize }));
  };
  const handlePageChangeEntrenamientos = (page, pageSize) => {
    setPaginationEntrenamientos(prev => ({ ...prev, current: page, pageSize }));
    cargarSesiones(page, pageSize);
  };

  // Columnas entrenamientos
  const columnasEntrenamientos = useMemo(() => [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <span>{formatearFecha(fecha)}</span>
        </div>
      ),
    },
    {
      title: 'Horario',
      key: 'horario',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#52c41a' }} />
          <span>{formatearHora(record.horaInicio)} - {formatearHora(record.horaFin)}</span>
        </div>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoSesion',
      key: 'tipoSesion',
      render: (tipo) => <Tag color="blue">{tipo || '—'}</Tag>,
    },
    {
  title: 'Lugar',
  key: 'lugar',
  render: (_, record) => (
    <span>
      <EnvironmentOutlined /> {record.ubicacionExterna || record.cancha?.nombre || 'Sin cancha'}
    </span>
  ),
  width: 220,
},
   
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver Detalle">
            <Button
              type="primary"
              size="middle"
              icon={<CalendarOutlined />}
              onClick={() => handleVerDetalleSesion(record.id)}
            />
          </Tooltip>
          <Tooltip title="Eliminar Entrenamiento">
            <Popconfirm
              title="¿Eliminar entrenamiento?"
              description="Esta acción no se puede deshacer"
              onConfirm={() => handleEliminarSesion(record.id)}
              okText="Sí, eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button danger size="middle" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ], []); // columnas estables

  // Columnas miembros
  const columnsMiembros = useMemo(() => [
    {
      title: 'Jugador',
      key: 'jugador',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.nombre || 'Sin nombre'}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.rut || 'Sin RUT'}
            </Text>
          </div>
        </div>
      ),
      width: 240,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => <Text style={{ fontSize: 13 }}>{email || '—'}</Text>,
    },
    {
      title: 'Carrera',
      dataIndex: 'carrera',
      key: 'carrera',
      render: (carrera) => <Tag color="blue">{carrera || '—'}</Tag>,
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      render: (telefono) => <Text style={{ fontSize: 13 }}>{telefono || '—'}</Text>,
    },
    {
      title: 'Año Ingreso',
      dataIndex: 'anioIngreso',
      key: 'anioIngreso',
      align: 'center',
      width: 120,
      render: (v) => v || '—',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      align: 'center',
      width: 110,
      render: (estado) => (
        <Tag color={estado === 'activo' ? 'success' : 'default'}>
          {(estado || '—').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      width: 170,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver Perfil">
            <Button
              type="primary"
              size="middle"
              icon={<UserOutlined />}
              onClick={() => handleVerDetalleJugador(record.id)}
            />
          </Tooltip>
          <Tooltip title="Remover del Grupo">
            <Popconfirm
              title="¿Remover del grupo?"
              description="El jugador ya no pertenecerá a este grupo"
              onConfirm={() => handleRemoverMiembro(record.id)}
              okText="Sí, remover"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button danger size="middle" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ], []); // columnas estables

  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', paddingTop: 120 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (!grupo) {
    return (
      <MainLayout>
        <div style={{ padding: 24 }}>
          <Empty description="Grupo no encontrado">
            <Button type="primary" onClick={() => navigate('/grupos')}>Volver a Grupos</Button>
          </Empty>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          <Card>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                <div>
                  <Title level={4} style={{ margin: 0 }}>{grupo.nombre}</Title>
                  {grupo.descripcion && <Text type="secondary">{grupo.descripcion}</Text>}
                </div>
              </div>

              <Space>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/grupos')}>
                  Volver
                </Button>
                {tabActiva === 'miembros' && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAgregarMiembro}>
                    Agregar Miembros
                  </Button>
                )}
                {tabActiva === 'entrenamientos' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate(`/sesiones/crear?grupoId=${grupoId}`)}
                  >
                    Nuevo Entrenamiento
                  </Button>
                )}
              </Space>
            </div>

            {/* Tabs */}
            <Tabs
              activeKey={tabActiva}
              onChange={(k) => {
                setTabActiva(k);
                if (k === 'miembros') {
                  // opcional: nada que recargar, ya está en memoria
                } else {
                  setPaginationEntrenamientos(prev => ({ ...prev, current: 1 }));
                }
              }}
              items={[
                {
                  key: 'miembros',
                  label: (
                    <span>
                      <UserOutlined />
                      {' '}Miembros ({miembros.length})
                    </span>
                  ),
                  children: (
                    <>
                      {/* Filtros Miembros */}
                      <Card style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={8}>
                            <Input
                              placeholder="Buscar por nombre, RUT, email o carrera..."
                              prefix={<SearchOutlined />}
                              value={busqueda}
                              onChange={(e) => setBusqueda(e.target.value)}
                              allowClear
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8}>
                            <Select
                              value={filtroEstado}
                              onChange={(v) => setFiltroEstado(v)}
                              style={{ width: '100%' }}
                              placeholder="Filtrar por estado"
                            >
                              <Option value="todos">Todos los estados</Option>
                              <Option value="activo">Activos</Option>
                              <Option value="inactivo">Inactivos</Option>
                            </Select>
                          </Col>
                          <Col xs={24} sm={12} md={8}>
                            <Select
                              value={filtroCarrera}
                              onChange={(v) => setFiltroCarrera(v)}
                              style={{ width: '100%' }}
                              placeholder="Filtrar por carrera"
                            >
                              <Option value="todos">Todas las carreras</Option>
                              {carrerasUnicas.map(carrera => (
                                <Option key={carrera} value={carrera}>
                                  {carrera}
                                </Option>
                              ))}
                            </Select>
                          </Col>
                        </Row>
                      </Card>

                      {/* Tabla Miembros */}
                      <Card>
                        <Table
                          columns={columnsMiembros}
                          dataSource={miembrosPaginados}
                          rowKey="id"
                          pagination={false}
                          locale={{
                            emptyText: (
                              <Empty description="No hay miembros en este grupo">
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleAgregarMiembro}>
                                  Agregar Miembros
                                </Button>
                              </Empty>
                            ),
                          }}
                        />
                        {/* Paginación externa (izquierda) */}
                        {paginationMiembros.total > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
                            <Pagination
                              current={paginationMiembros.current}
                              pageSize={paginationMiembros.pageSize}
                              total={paginationMiembros.total}
                              onChange={handlePageChangeMiembros}
                              onShowSizeChange={handlePageChangeMiembros}
                              showSizeChanger
                              showTotal={(total) => `Total: ${total} miembros`}
                              pageSizeOptions={['5', '10', '20', '50']}
                            />
                          </div>
                        )}
                      </Card>
                    </>
                  ),
                },
                {
                  key: 'entrenamientos',
                  label: (
                    <span>
                      <CalendarOutlined />
                      {' '}Entrenamientos ({paginationEntrenamientos.total})
                    </span>
                  ),
                  children: (
                    <>
                      {/* Acciones entrenamientos */}
                     <Card style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
  <Row gutter={[16, 16]} align="middle">
    <Col xs={24} md={8}>
      <Input
        placeholder="Buscar por lugar o tipo de Sesión"
        prefix={<SearchOutlined />}
        value={busquedaEntrenamiento}
        onChange={(e) => setBusquedaEntrenamiento(e.target.value)}
        allowClear
        size="middle"
      />
    </Col>

    <Col xs={24} sm={12} md={6}>
      <Select
        placeholder="Filtrar por cancha"
        value={filtrosEntrenamientos.canchaId}
        onChange={(v) =>
          setFiltrosEntrenamientos(prev => ({ ...prev, canchaId: v || null }))
        }
        allowClear
        style={{ width: '100%' }}
        showSearch
        filterOption={(input, option) =>
          (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
        }
      >
        {canchasOpts.map(c => (
          <Option key={c.id} value={c.id}>
            {c.nombre}
          </Option>
        ))}
      </Select>
    </Col>

    <Col xs={24} sm={12} md={4}>
      <Space>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => cargarSesiones(paginationEntrenamientos.current, paginationEntrenamientos.pageSize)}
          loading={loadingSesiones}
        >
          Actualizar
        </Button>
        <Button
          onClick={() => {
            setFiltrosEntrenamientos({ q: '', canchaId: null });
            setBusquedaEntrenamiento('');
          }}
        >
          Limpiar
        </Button>
      </Space>
    </Col>
  </Row>
</Card>

                      {/* Tabla Entrenamientos */}
                      <Card>
                        <Table
                          columns={columnasEntrenamientos}
                          dataSource={sesiones}
                          rowKey="id"
                          loading={loadingSesiones}
                          pagination={false}
                          locale={{
                            emptyText: (
                              <Empty description="No hay entrenamientos programados">
                                <Button
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  onClick={() => navigate(`/sesiones/crear?grupoId=${grupoId}`)}
                                >
                                  Crear Primer Entrenamiento
                                </Button>
                              </Empty>
                            ),
                          }}
                        />

                        {/* Paginación externa (izquierda) */}
                        {paginationEntrenamientos.total > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
                            <Pagination
                              current={paginationEntrenamientos.current}
                              pageSize={paginationEntrenamientos.pageSize}
                              total={paginationEntrenamientos.total}
                              onChange={handlePageChangeEntrenamientos}
                              onShowSizeChange={handlePageChangeEntrenamientos}
                              showSizeChanger
                              showTotal={(total) => `Total: ${total} entrenamientos`}
                              pageSizeOptions={['5', '10', '20', '50']}
                            />
                          </div>
                        )}
                      </Card>
                    </>
                  ),
                },
              ]}
            />
          </Card>

          {/* Modal Agregar Miembros */}
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined />
                <span>Agregar Jugador al Grupo</span>
              </div>
            }
            open={modalAgregar}
            onCancel={() => {
              setModalAgregar(false);
              setJugadorSeleccionado(null);
            }}
            footer={[
              <Button key="cancel" onClick={() => { setModalAgregar(false); setJugadorSeleccionado(null); }}>
                Cancelar
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={agregando}
                onClick={handleConfirmarAgregar}
                disabled={!jugadorSeleccionado}
              >
                Agregar
              </Button>,
            ]}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong>Grupo: </Text>
              <Text>{grupo?.nombre}</Text>
            </div>

            <div>
              <Text strong>Selecciona un jugador:</Text>
              <Select
                value={jugadorSeleccionado}
                onChange={setJugadorSeleccionado}
                placeholder="Buscar por nombre, RUT o carrera..."
                style={{ width: '100%', marginTop: 8 }}
                showSearch
                filterOption={(input, option) => {
                  const hay = (option?.label ?? '').toString().toLowerCase();
                  return hay.includes(input.toLowerCase());
                }}
                options={(jugadoresDisponibles || []).map(j => ({
                  value: j.id,
                  label: `${j.usuario?.nombre || 'Sin nombre'} - ${j.usuario?.rut || 'Sin RUT'} - ${j.usuario?.carrera?.nombre || 'Sin carrera'}`,
                }))}
              />

              {jugadoresDisponibles.length === 0 && (
                <Alert
                  message="No hay jugadores disponibles"
                  description="Todos los jugadores ya están en este grupo"
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </div>
          </Modal>

          {/* Modal Detalle Sesión */}
          <DetalleSesionModal
            open={detalleModal}
            loading={loadingDetalle}
            sesion={sesionDetalle}
            onClose={() => { setDetalleModal(false); setSesionDetalle(null); }}
          />

          {/* Modal Detalle Jugador */}
          <JugadorDetalleModal
            visible={modalJugadorVisible}
            loading={loadingJugadorDetalle}
            jugador={jugadorDetalle}
            onClose={() => { setModalJugadorVisible(false); setJugadorDetalle(null); }}
          />
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}
