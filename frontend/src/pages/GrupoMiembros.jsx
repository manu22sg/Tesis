import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  App,
  Empty,
  Typography,
  Spin,
  Input,
  Select,
  Row,
  Col,
  Tabs,
  Pagination,
  ConfigProvider,
  Tooltip,
  Popconfirm
} from 'antd';
import locale from 'antd/locale/es_ES';
import { obtenerCanchas } from '../services/cancha.services.js';
import ModalAgregarJugador from '../components/ModalAgregarJugador.jsx';
import TablaMiembrosGrupo from '../components/TablaMiembrosGrupo.jsx';

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
import { obtenerJugadorPorId, removerJugadorDeGrupo, asignarJugadorAGrupo } from '../services/jugador.services.js';

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
  const { message } = App.useApp(); 

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
  
  // Filtros entrenamientos
  const [filtrosEntrenamientos, setFiltrosEntrenamientos] = useState({
    q: '',
    canchaId: null,
  });
  const [busquedaEntrenamiento, setBusquedaEntrenamiento] = useState('');

  // Modal agregar miembros
  const [modalAgregar, setModalAgregar] = useState(false);
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
  const cargarDatosGrupo = async () => {
    const reqId = ++requestIdGrupoRef.current;
    try {
      setLoading(true);
      const grupoData = await obtenerGrupoPorId(grupoId);
      if (reqId !== requestIdGrupoRef.current) return;

      setGrupo(grupoData);

      const miembrosData = (grupoData.jugadorGrupos || []).map(jg => ({
        id: jg.jugador?.id,
        jugadorGrupoId: jg.id,
        nombre: `${jg.jugador?.usuario?.nombre || 'Sin nombre'} ${jg.jugador?.usuario?.apellido || ''}`.trim(),
        rut: jg.jugador?.usuario?.rut || 'Sin RUT',
        email: jg.jugador?.usuario?.email || '—',
        carrera: jg.jugador?.usuario?.carrera?.nombre || '—',
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

  useEffect(() => {
    if (!Number.isNaN(grupoId)) {
      cargarDatosGrupo();
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

      const qParam = (filtrosEntrenamientos.q || '').trim();
      const canchaIdParam =
        filtrosEntrenamientos.canchaId != null
          ? Number(filtrosEntrenamientos.canchaId)
          : undefined;

      const data = await obtenerSesiones({
        grupoId,
        page,
        limit,
        ...(qParam ? { q: qParam } : {}),
        ...(canchaIdParam ? { canchaId: canchaIdParam } : {}),
      });

      if (reqId !== requestIdSesionesRef.current) return;

      const sesionesData = data?.sesiones || data?.data?.sesiones || [];
      const paginationData = data?.pagination || data?.data?.pagination || {};

      const q = qParam.toLowerCase();
      const canchaId = canchaIdParam;

      let filtradas = sesionesData;
      if (q || canchaId) {
        filtradas = sesionesData.filter((s) => {
          const canchaNom = String(s?.cancha?.nombre ?? '').toLowerCase();
          const ubicacion = String(s?.ubicacionExterna ?? '').toLowerCase();
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

  useEffect(() => {
    if (tabActiva === 'entrenamientos') {
      cargarSesiones(1, paginationEntrenamientos.pageSize);
    }
  }, [tabActiva, paginationEntrenamientos.pageSize, grupoId, filtrosEntrenamientos]);

  // Handlers
  const handleRemoverMiembro = async (jugadorId) => {
    try {
      await removerJugadorDeGrupo(jugadorId, grupoId);
      message.success('Jugador removido del grupo correctamente');
      
      const nextPage =
        miembrosPaginados.length === 1 && paginationMiembros.current > 1
          ? paginationMiembros.current - 1
          : paginationMiembros.current;
      setPaginationMiembros(prev => ({ ...prev, current: nextPage }));
      
      await cargarDatosGrupo();
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

  const handleAgregarMiembro = () => {
    setModalAgregar(true);
  };

  const handleConfirmarAgregar = async (jugadorId) => {
    try {
      setAgregando(true);
      await asignarJugadorAGrupo(jugadorId, grupoId);
      message.success('Jugador agregado al grupo correctamente');
      
      await cargarDatosGrupo();
      return true;
    } catch (error) {
      console.error('Error agregando jugador:', error);
      message.error(error.response?.data?.message || 'Error al agregar al grupo');
      return false;
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

  const handlePageChangeMiembros = (page, pageSize) => {
    setPaginationMiembros(prev => ({ ...prev, current: page, pageSize }));
  };
  
  const handlePageChangeEntrenamientos = (page, pageSize) => {
    setPaginationEntrenamientos(prev => ({ ...prev, current: page, pageSize }));
    cargarSesiones(page, pageSize);
  };

  const columnasEntrenamientos = useMemo(() => [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarOutlined style={{ color: '#014898' }} />
          <span>{formatearFecha(fecha)}</span>
        </div>
      ),
    },
    {
      title: 'Horario',
      key: 'horario',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#006B5B' }} />
          <span>{formatearHora(record.horaInicio)} - {formatearHora(record.horaFin)}</span>
        </div>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoSesion',
      key: 'tipoSesion',
      render: (tipo) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid #B9BBBB',
          backgroundColor: '#f5f5f5'
        }}>
          {tipo || '—'}
        </span>
      ),
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
  ], []);

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
                    Nueva Sesión
                  </Button>
                )}
              </Space>
            </div>

            <Tabs
              activeKey={tabActiva}
              onChange={(k) => {
                setTabActiva(k);
                if (k === 'entrenamientos') {
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
                    <TablaMiembrosGrupo
                      miembros={miembros}
                      miembrosFiltrados={miembrosFiltrados}
                      miembrosPaginados={miembrosPaginados}
                      busqueda={busqueda}
                      filtroEstado={filtroEstado}
                      filtroCarrera={filtroCarrera}
                      carrerasUnicas={carrerasUnicas}
                      pagination={paginationMiembros}
                      onBusquedaChange={setBusqueda}
                      onFiltroEstadoChange={setFiltroEstado}
                      onFiltroCarreraChange={setFiltroCarrera}
                      onPageChange={handlePageChangeMiembros}
                      onVerDetalle={handleVerDetalleJugador}
                      onRemoverMiembro={handleRemoverMiembro}
                      onAgregarMiembro={handleAgregarMiembro}
                    />
                  ),
                },
                {
                  key: 'entrenamientos',
                  label: (
                    <span>
                      <CalendarOutlined />
                      {' '}Sesiones ({paginationEntrenamientos.total})
                    </span>
                  ),
                  children: (
                    <>
                      <Card style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
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

                      <Card>
                        <Table
                          columns={columnasEntrenamientos}
                          dataSource={sesiones}
                          rowKey="id"
                          loading={loadingSesiones}
                          pagination={false}
                          locale={{
                            emptyText: (
                              <Empty description="No hay Sesiones programadas">
                                <Button
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  onClick={() => navigate(`/sesiones/crear?grupoId=${grupoId}`)}
                                >
                                  Crear Primera Sesión
                                </Button>
                              </Empty>
                            ),
                          }}
                        />

                        {paginationEntrenamientos.total > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
                            <Pagination
                              current={paginationEntrenamientos.current}
                              pageSize={paginationEntrenamientos.pageSize}
                              total={paginationEntrenamientos.total}
                              onChange={handlePageChangeEntrenamientos}
                              onShowSizeChange={handlePageChangeEntrenamientos}
                              showSizeChanger
                              showTotal={(total) => `Total: ${total} sesiones`}
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

          <ModalAgregarJugador
            visible={modalAgregar}
            onClose={() => setModalAgregar(false)}
            onConfirm={handleConfirmarAgregar}
            grupo={grupo}
            miembros={miembros}
            loading={agregando}
          />

          <DetalleSesionModal
            open={detalleModal}
            loading={loadingDetalle}
            sesion={sesionDetalle}
            onClose={() => { setDetalleModal(false); setSesionDetalle(null); }}
          />

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