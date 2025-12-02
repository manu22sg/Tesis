import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  Card, 
  Button, 
  Modal, 
  Select,
  Row,
  Col,
  Space, 
  App, 
  ConfigProvider,
  Typography,
  Dropdown,
  Spin
} from 'antd';
import locale from 'antd/locale/es_ES';
import { 
  DownloadOutlined,
  PlusOutlined, 
  ReloadOutlined,
  StarOutlined,
  FileExcelOutlined,    
  FilePdfOutlined
} from '@ant-design/icons';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
import { exportarEvaluacionesExcel, exportarEvaluacionesPDF } from '../services/evaluacion.services.js';
import { obtenerSesiones, obtenerSesionPorId } from '../services/sesion.services.js';
import { obtenerJugadores } from '../services/jugador.services.js';
import { obtenerGrupoPorId } from '../services/grupo.services.js';
import EvaluacionForm from '../components/EvaluacionForm.jsx';
import ListaEvaluaciones from '../components/ListaEvaluaciones.jsx';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout.jsx';

const { Text } = Typography;
const PRELOAD_LIMIT = 50;

export default function Evaluaciones() {
  const { usuario } = useAuth();
  
  // Estados principales
  const [modo, setModo] = useState('sesion');
  const [sesiones, setSesiones] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [sesionId, setSesionId] = useState(null);
  const [jugadorId, setJugadorId] = useState(null);
    const { message } = App.useApp(); 

  // Estados dependientes
  const [jugadoresDelGrupo, setJugadoresDelGrupo] = useState([]);
  const [sesionesDelJugador, setSesionesDelJugador] = useState([]);
  const [filtroJugadorEnSesion, setFiltroJugadorEnSesion] = useState(null);
  const [filtroSesionDelJugador, setFiltroSesionDelJugador] = useState(null);
  
  // ✅ Estados de búsqueda dinámica para MODO JUGADOR
  const [busquedaJugadorModo, setBusquedaJugadorModo] = useState('');
  const [jugadoresBusquedaModo, setJugadoresBusquedaModo] = useState([]);
  const [loadingBusquedaJugadorModo, setLoadingBusquedaJugadorModo] = useState(false);
  const searchTimeoutModo = useRef(null);

  // ✅ Estados de búsqueda dinámica para FILTRO EN SESIÓN
  const [busquedaJugadorFiltro, setBusquedaJugadorFiltro] = useState('');
  const [jugadoresBusquedaFiltro, setJugadoresBusquedaFiltro] = useState([]);
  const [loadingBusquedaJugadorFiltro, setLoadingBusquedaJugadorFiltro] = useState(false);
  const searchTimeoutFiltro = useRef(null);
  
  // Estados de UI
  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingDependiente, setLoadingDependiente] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const esEstudiante = usuario?.rol === 'estudiante';

  // ✅ CARGAR DATOS INICIALES
  useEffect(() => {
    const cargarBase = async () => {
      setLoadingBase(true);
      try {
        const [resSes, resJug] = await Promise.all([
          obtenerSesiones({ page: 1, limit: PRELOAD_LIMIT }),
          obtenerJugadores({ limit: PRELOAD_LIMIT })
        ]);

        const listaSes = resSes?.sesiones || resSes?.data?.sesiones || [];
        const listaJug = resJug?.jugadores || resJug?.data?.jugadores || [];

        setSesiones(listaSes);
        setJugadores(listaJug);
      } catch (e) {
        console.error('Error cargando base:', e);
        message.error('No se pudieron cargar sesiones o jugadores');
      } finally {
        setLoadingBase(false);
      }
    };

    cargarBase();
  }, []);

  // Limpiar al cambiar modo
  useEffect(() => {
    setSesionId(null);
    setJugadorId(null);
    setJugadoresDelGrupo([]);
    setSesionesDelJugador([]);
    setFiltroJugadorEnSesion(null);
    setFiltroSesionDelJugador(null);
    setBusquedaJugadorModo('');
    setBusquedaJugadorFiltro('');
    setJugadoresBusquedaModo([]);
    setJugadoresBusquedaFiltro([]);
    
    // Limpiar timeouts
    if (searchTimeoutModo.current) clearTimeout(searchTimeoutModo.current);
    if (searchTimeoutFiltro.current) clearTimeout(searchTimeoutFiltro.current);
  }, [modo]);

  // ✅ Al elegir una sesión
  const onSeleccionarSesion = useCallback(async (id) => {
    setSesionId(id);
    setFiltroJugadorEnSesion(null);
    setJugadoresDelGrupo([]);
    setBusquedaJugadorFiltro('');
    setJugadoresBusquedaFiltro([]);
    
    if (!id) return;

    setLoadingDependiente(true);
    try {
      let sesionCompleta = null;
      try {
        sesionCompleta = await obtenerSesionPorId(id);
      } catch (_) {
        sesionCompleta = null;
      }

      const grupoId =
        sesionCompleta?.grupo?.id ||
        sesionCompleta?.grupoId ||
        sesiones.find(s => s.id === id)?.grupo?.id ||
        sesiones.find(s => s.id === id)?.grupoId;

      if (!grupoId) {
        setJugadoresDelGrupo(jugadores);
        return;
      }

      const grupo = await obtenerGrupoPorId(Number(grupoId));
      const miembros = (grupo?.jugadorGrupos || [])
        .map(jg => jg.jugador)
        .filter(Boolean);
      setJugadoresDelGrupo(miembros);
    } catch (e) {
      console.error('Error cargando jugadores del grupo:', e);
      message.warning('No se pudo cargar el grupo de la sesión; se listarán todos los jugadores');
      setJugadoresDelGrupo(jugadores);
    } finally {
      setLoadingDependiente(false);
    }
  }, [jugadores, sesiones]);

  // ✅ Al elegir un jugador (modo jugador)
  const onSeleccionarJugador = useCallback(async (id) => {
    setJugadorId(id);
    setFiltroSesionDelJugador(null);
    setSesionesDelJugador([]);

    if (!id) return;
    setSesionesDelJugador(sesiones);
  }, [sesiones]);

  // ✅ HANDLER de búsqueda para MODO JUGADOR (estilo EvaluacionForm)
  const handleBuscarJugadoresModo = (value) => {
    setBusquedaJugadorModo(value);
    
    if (searchTimeoutModo.current) {
      clearTimeout(searchTimeoutModo.current);
    }

    // Si está vacío O tiene menos de 2 caracteres, limpiar todo
    if (!value || value.trim().length < 2) {
      setJugadoresBusquedaModo([]);
      setLoadingBusquedaJugadorModo(false);
      return;
    }

    // ✅ Solo activar loading, NO limpiar jugadores
    setLoadingBusquedaJugadorModo(true);

    // Buscar con debounce (solo si tiene 2+ caracteres)
    searchTimeoutModo.current = setTimeout(() => {
      buscarJugadoresModo(value.trim());
    }, 500);
  };

  // ✅ HANDLER de búsqueda para FILTRO EN SESIÓN (estilo EvaluacionForm)
  const handleBuscarJugadoresFiltro = (value) => {
    setBusquedaJugadorFiltro(value);
    
    if (searchTimeoutFiltro.current) {
      clearTimeout(searchTimeoutFiltro.current);
    }

    // Si está vacío O tiene menos de 2 caracteres, limpiar todo
    if (!value || value.trim().length < 2) {
      setJugadoresBusquedaFiltro([]);
      setLoadingBusquedaJugadorFiltro(false);
      return;
    }

    // ✅ Solo activar loading, NO limpiar jugadores
    setLoadingBusquedaJugadorFiltro(true);

    // Buscar con debounce (solo si tiene 2+ caracteres)
    searchTimeoutFiltro.current = setTimeout(() => {
      buscarJugadoresFiltro(value.trim());
    }, 500);
  };

  // ✅ Búsqueda dinámica para MODO JUGADOR
  const buscarJugadoresModo = async (q) => {
    setLoadingBusquedaJugadorModo(true);
    try {
      const resJug = await obtenerJugadores({ 
        q: q.trim(), 
        limit: 100
      });

      const listaJug = resJug?.jugadores || resJug?.data?.jugadores || [];
      setJugadoresBusquedaModo(listaJug);
    } catch (e) {
      console.error('Error buscando jugadores:', e);
      setJugadoresBusquedaModo([]);
    } finally {
      setLoadingBusquedaJugadorModo(false);
    }
  };

  // ✅ Búsqueda dinámica para FILTRO EN SESIÓN
  const buscarJugadoresFiltro = async (q) => {
    setLoadingBusquedaJugadorFiltro(true);
    try {
      const resJug = await obtenerJugadores({ 
        q: q.trim(), 
        limit: 100
      });

      const listaJug = resJug?.jugadores || resJug?.data?.jugadores || [];
      setJugadoresBusquedaFiltro(listaJug);
    } catch (e) {
      console.error('Error buscando jugadores:', e);
      setJugadoresBusquedaFiltro([]);
    } finally {
      setLoadingBusquedaJugadorFiltro(false);
    }
  };

  // ✅ Debounce para búsqueda MODO JUGADOR - YA NO SE USA, MOVIDO A handleBuscarJugadoresModo
  // useEffect eliminado - ahora usa useRef con timeout manual

  // ✅ Debounce para búsqueda FILTRO EN SESIÓN - YA NO SE USA, MOVIDO A handleBuscarJugadoresFiltro
  // useEffect eliminado - ahora usa useRef con timeout manual

  const limpiarFiltros = useCallback(() => {
    setSesionId(null);
    setJugadorId(null);
    setJugadoresDelGrupo([]);
    setSesionesDelJugador([]);
    setFiltroJugadorEnSesion(null);
    setFiltroSesionDelJugador(null);
    setBusquedaJugadorModo('');
    setBusquedaJugadorFiltro('');
    setJugadoresBusquedaModo([]);
    setJugadoresBusquedaFiltro([]);
  }, []);

  const manejarCrear = () => {
    setEditando(null);
    setModalVisible(true);
  };

  const onSuccessForm = () => {
    setModalVisible(false);
    setEditando(null);
    setReloadKey(k => k + 1);
  };

  // Exportación
  const handleExportarExcel = async () => {
  setExportando(true);
  try {
    const params = {};
    
    if (modo === 'sesion' && sesionId) {
      params.sesionId = sesionId;
      if (filtroJugadorEnSesion) params.jugadorId = filtroJugadorEnSesion;
    } else if (modo === 'jugador' && jugadorId) {
      params.jugadorId = jugadorId;
      if (filtroSesionDelJugador) params.sesionId = filtroSesionDelJugador;
    }

    const result = await exportarEvaluacionesExcel(params);

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
  setExportando(true);
  try {
    const params = {};
    
    if (modo === 'sesion' && sesionId) {
      params.sesionId = sesionId;
      if (filtroJugadorEnSesion) params.jugadorId = filtroJugadorEnSesion;
    } else if (modo === 'jugador' && jugadorId) {
      params.jugadorId = jugadorId;
      if (filtroSesionDelJugador) params.sesionId = filtroSesionDelJugador;
    }

    const result = await exportarEvaluacionesPDF(params);

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


  const canConsultar = useMemo(() => {
    return (modo === 'sesion' && sesionId) || (modo === 'jugador' && jugadorId);
  }, [modo, sesionId, jugadorId]);

  // ✅ Determinar qué jugadores mostrar según búsqueda
    // ✅ Determinar qué jugadores mostrar según búsqueda
  const jugadoresModoAMostrar = useMemo(() => {
    // Si está escribiendo pero tiene menos de 2 caracteres, no mostrar nada
    if (busquedaJugadorModo.trim().length > 0 && busquedaJugadorModo.trim().length < 2) {
      return [];
    }
    // Si tiene 2+ caracteres, mostrar resultados de búsqueda
    // Si NO hay búsqueda, NO mostrar nada (array vacío)
    return busquedaJugadorModo.trim().length >= 2 
      ? jugadoresBusquedaModo 
      : [];
  }, [busquedaJugadorModo, jugadoresBusquedaModo]);

  const jugadoresFiltroAMostrar = useMemo(() => {
    // Si está escribiendo pero tiene menos de 2 caracteres, no mostrar nada
    if (busquedaJugadorFiltro.trim().length > 0 && busquedaJugadorFiltro.trim().length < 2) {
      return [];
    }
    // Si tiene 2+ caracteres, mostrar resultados de búsqueda
    // Si NO hay búsqueda, NO mostrar nada (array vacío)
    return busquedaJugadorFiltro.trim().length >= 2
      ? jugadoresBusquedaFiltro
      : [];
  }, [busquedaJugadorFiltro, jugadoresBusquedaFiltro]);

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24 }}>
          <Card
            title={<><StarOutlined /> <span style={{ marginLeft: 8 }}>Panel de Evaluaciones</span></>}
            extra={
              <Space>
                {canConsultar && (
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'excel',
                          icon: <FileExcelOutlined />,
                          label: 'Exportar a Excel',
                          onClick: handleExportarExcel,
                        },
                        {
                          key: 'pdf',
                          icon: <FilePdfOutlined />,
                          label: 'Exportar a PDF',
                          onClick: handleExportarPDF,
                        },
                      ],
                    }}
                    placement="bottomRight"
                  >
                    <Button icon={<DownloadOutlined />} loading={exportando}>
                      Exportar
                    </Button>
                  </Dropdown>
                )}
                
                <Button icon={<ReloadOutlined />} onClick={() => setReloadKey(k => k + 1)}>
                  Actualizar
                </Button>
                
                {!esEstudiante && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={manejarCrear}>
                    Nueva evaluación
                  </Button>
                )}
              </Space>
            }
          >
            {/* Filtros principales */}
            <Card style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={6}>
                  <Text type="secondary">Ver evaluaciones por</Text>
                  <Select
                    value={modo}
                    onChange={setModo}
                    style={{ width: '100%', marginTop: 6 }}
                    options={[
                      { value: 'sesion', label: 'Sesión' },
                      { value: 'jugador', label: 'Jugador' },
                    ]}
                  />
                </Col>

                {modo === 'sesion' && (
                  <>
                    <Col xs={24} md={10}>
                      <Text type="secondary">Sesión</Text>
                      <Select
                        value={sesionId}
                        onChange={onSeleccionarSesion}
                        style={{ width: '100%', marginTop: 6 }}
                        placeholder="Selecciona una sesión"
                        loading={loadingBase}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={(sesiones || []).map(s => {
                          const fecha = formatearFecha(s.fecha);
                          const hi = formatearHora(s.horaInicio);
                          const hf = s.horaFin ? formatearHora(s.horaFin) : '';
                          const nombre = s.tipoSesion ? `${s.tipoSesion} — ` : '';
                          return {
                            value: s.id,
                            label: `${nombre}${fecha} — ${hi}${hf ? ` - ${hf}` : ''}`
                          };
                        })}
                      />
                    </Col>

                    <Col xs={24} md={8}>
                      <Text type="secondary">Jugador (opcional)</Text>
                      <Select
                        value={filtroJugadorEnSesion}
                        onChange={setFiltroJugadorEnSesion}
                        style={{ width: '100%', marginTop: 6 }}
                        placeholder="Busca por nombre o RUT..."
                        allowClear
                        showSearch
                        searchValue={busquedaJugadorFiltro}
                        onSearch={handleBuscarJugadoresFiltro}
                        filterOption={false}
                        loading={loadingDependiente || loadingBusquedaJugadorFiltro}
                        disabled={!sesionId}
                        notFoundContent={
                          loadingDependiente || loadingBusquedaJugadorFiltro ? (
                            <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <Spin size="small" />
                            </div>
                          ) : busquedaJugadorFiltro.trim().length > 0 && busquedaJugadorFiltro.trim().length < 2 ? (
                            <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                              Escribe al menos 2 caracteres
                            </div>
                          ) : busquedaJugadorFiltro.trim().length >= 2 && jugadoresFiltroAMostrar.length === 0 ? (
                            <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                              No se encontraron jugadores
                            </div>
                          ) : jugadoresFiltroAMostrar.length === 0 ? (
                            <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                              Escribe para buscar...
                            </div>
                          ) : null
                        }
                        options={jugadoresFiltroAMostrar.map(j => ({
                          value: j.id,
                          label: `${j?.usuario?.nombre || 'Sin nombre'} ${j?.usuario?.apellido || ''} — ${j?.usuario?.rut || 'Sin RUT'}`
                        }))}
                      />
                    </Col>
                  </>
                )}

                {modo === 'jugador' && (
                  <>
                    <Col xs={24} md={10}>
                      <Text type="secondary">Jugador</Text>
                      <Select
                        value={jugadorId}
                        onChange={onSeleccionarJugador}
                        style={{ width: '100%', marginTop: 6 }}
                        placeholder="Busca por nombre o RUT..."
                        loading={loadingBase || loadingBusquedaJugadorModo}
                        allowClear
                        showSearch
                        searchValue={busquedaJugadorModo}
                        onSearch={handleBuscarJugadoresModo}
                        filterOption={false}
                        notFoundContent={
                          loadingBusquedaJugadorModo ? (
                            <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <Spin size="small" />
                            </div>
                          ) : busquedaJugadorModo.trim().length > 0 && busquedaJugadorModo.trim().length < 2 ? (
                            <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                              Escribe al menos 2 caracteres
                            </div>
                          ) : busquedaJugadorModo.trim().length >= 2 && jugadoresModoAMostrar.length === 0 ? (
                            <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                              No se encontraron jugadores
                            </div>
                          ) : jugadoresModoAMostrar.length === 0 ? (
                            <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                              Escribe para buscar...
                            </div>
                          ) : null
                        }
                        options={jugadoresModoAMostrar.map(j => ({
                          value: j.id,
                          label: `${j?.usuario?.nombre || 'Sin nombre'} ${j?.usuario?.apellido || ''} — ${j?.usuario?.rut || 'Sin RUT'}`
                        }))}
                      />
                    </Col>

                    <Col xs={24} md={8}>
                      <Text type="secondary">Sesión (opcional)</Text>
                      <Select
                        value={filtroSesionDelJugador}
                        onChange={setFiltroSesionDelJugador}
                        style={{ width: '100%', marginTop: 6 }}
                        placeholder="Todas las sesiones"
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={(sesionesDelJugador.length ? sesionesDelJugador : sesiones).map(s => {
                          const fecha = formatearFecha(s.fecha);
                          const hi = formatearHora(s.horaInicio);
                          const hf = s.horaFin ? formatearHora(s.horaFin) : '';
                          const nombre = s.nombre ? `${s.nombre} — ` : '';
                          return {
                            value: s.id,
                            label: `${nombre}${fecha} — ${hi}${hf ? ` - ${hf}` : ''}`
                          };
                        })}
                        disabled={!jugadorId}
                      />
                    </Col>
                  </>
                )}

                <Col xs={24} md={24} style={{ textAlign: 'right' }}>
                  {(sesionId || jugadorId || filtroJugadorEnSesion || filtroSesionDelJugador) && (
                    <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
                  )}
                </Col>
              </Row>
            </Card>

            {/* Resultado */}
            {canConsultar ? (
              <ListaEvaluaciones
                tipo={modo === 'sesion' ? 'sesion' : 'jugador'}
                id={modo === 'sesion' ? sesionId : jugadorId}
                filtroJugadorId={modo === 'sesion' ? filtroJugadorEnSesion : undefined}
                filtroSesionId={modo === 'jugador' ? filtroSesionDelJugador : undefined}
                reloadKey={reloadKey}
                userRole={esEstudiante ? 'estudiante' : 'entrenador'}
                onEdit={(row) => {
                  setEditando(row);
                  setModalVisible(true);
                }}
              />
            ) : (
              <Card style={{ textAlign: 'center', color: '#888' }}>
                Selecciona {modo === 'sesion' ? 'una sesión' : 'un jugador'} para ver las evaluaciones.
              </Card>
            )}
          </Card>

          {/* Modal Crear/Editar */}
          <Modal
            title={editando ? 'Editar Evaluación' : 'Nueva Evaluación'}
            open={modalVisible}
            onCancel={() => { setModalVisible(false); setEditando(null); }}
            footer={null}
            destroyOnClose
            width={600}
          >
            <EvaluacionForm
              initialValues={editando}
              onSuccess={onSuccessForm}
            />
          </Modal>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}