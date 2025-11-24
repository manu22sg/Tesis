import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  Select,
  Row,
  Col,
  Space,
  message,
  ConfigProvider,
  Typography,
  Dropdown,
  Statistic
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ListaAsistencias from '../components/ListaAsistencias.jsx';
import { obtenerSesiones, obtenerSesionPorId } from '../services/sesion.services.js';
import { obtenerJugadores } from '../services/jugador.services.js';
import { obtenerGrupoPorId } from '../services/grupo.services.js';
import {
  exportarAsistenciasExcel,
  exportarAsistenciasPDF,
  obtenerEstadisticasAsistenciaJugador
} from '../services/asistencia.services.js';
import ModalRegistrarAsistencia from '../components/ModalRegistrarAsistencia.jsx';

import { formatearFecha, formatearHora } from '../utils/formatters.js';

const { Text } = Typography;
const PRELOAD_LIMIT = 50;

export default function Asistencias() {
  const [modalVisible, setModalVisible] = useState(false);

  const [modo, setModo] = useState('sesion');
  const [sesiones, setSesiones] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [sesionId, setSesionId] = useState(null);
  const [jugadorId, setJugadorId] = useState(null);

  const [jugadoresDelGrupo, setJugadoresDelGrupo] = useState([]);
  const [sesionesDelJugador, setSesionesDelJugador] = useState([]);
  const [filtroJugadorEnSesion, setFiltroJugadorEnSesion] = useState(null);
  const [filtroSesionDelJugador, setFiltroSesionDelJugador] = useState(null);

  const [busquedaJugador, setBusquedaJugador] = useState('');
  const [jugadoresBusqueda, setJugadoresBusqueda] = useState([]);
  const [loadingBusquedaJugador, setLoadingBusquedaJugador] = useState(false);

  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingDependiente, setLoadingDependiente] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Estadísticas del jugador seleccionado
  const [estadisticasJugador, setEstadisticasJugador] = useState(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);

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

  useEffect(() => {
    setSesionId(null);
    setJugadorId(null);
    setJugadoresDelGrupo([]);
    setSesionesDelJugador([]);
    setFiltroJugadorEnSesion(null);
    setFiltroSesionDelJugador(null);
    setBusquedaJugador('');
    setJugadoresBusqueda([]);
    setEstadisticasJugador(null);
  }, [modo]);

  const onSeleccionarSesion = useCallback(async (id) => {
    setSesionId(id);
    setFiltroJugadorEnSesion(null);
    setJugadoresDelGrupo([]);
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
      message.warning('No se pudo cargar el grupo de la sesión');
      setJugadoresDelGrupo(jugadores);
    } finally {
      setLoadingDependiente(false);
    }
  }, [jugadores, sesiones]);

  const onSeleccionarJugador = useCallback(async (id) => {
    setJugadorId(id);
    setFiltroSesionDelJugador(null);
    setSesionesDelJugador([]);
    setEstadisticasJugador(null);

    if (!id) return;
    
    setSesionesDelJugador(sesiones);

    // Cargar estadísticas del jugador
    setLoadingEstadisticas(true);
    try {
      const stats = await obtenerEstadisticasAsistenciaJugador(id);
      setEstadisticasJugador(stats);
    } catch (e) {
      console.error('Error cargando estadísticas:', e);
    } finally {
      setLoadingEstadisticas(false);
    }
  }, [sesiones]);

  const buscarJugadoresConQ = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setJugadoresBusqueda([]);
      return;
    }

    setLoadingBusquedaJugador(true);
    try {
      const resJug = await obtenerJugadores({
        q: q.trim(),
        limit: 100
      });

      const listaJug = resJug?.jugadores || resJug?.data?.jugadores || [];
      setJugadoresBusqueda(listaJug);
    } catch (e) {
      console.error('Error buscando jugadores:', e);
      setJugadoresBusqueda([]);
    } finally {
      setLoadingBusquedaJugador(false);
    }
  }, []);
  const handleModalSuccess = () => {
    // Recargar la lista de asistencias
    setReloadKey(prev => prev + 1);
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      if (busquedaJugador.trim().length >= 2) {
        buscarJugadoresConQ(busquedaJugador);
      } else {
        setJugadoresBusqueda([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [busquedaJugador, buscarJugadoresConQ]);

  const limpiarFiltros = useCallback(() => {
    setSesionId(null);
    setJugadorId(null);
    setJugadoresDelGrupo([]);
    setSesionesDelJugador([]);
    setFiltroJugadorEnSesion(null);
    setFiltroSesionDelJugador(null);
    setBusquedaJugador('');
    setJugadoresBusqueda([]);
    setEstadisticasJugador(null);
  }, []);

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

    const blob = await exportarAsistenciasExcel(params);

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `asistencias_${modo}_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    message.success('Excel exportado correctamente');
  } catch (error) {
    console.error(' Error exportando Excel:', error);
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

    

    const blob = await exportarAsistenciasPDF(params);

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `asistencias_${modo}_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    message.success('PDF exportado correctamente');
  } catch (error) {
    console.error(' Error exportando PDF:', error);
    message.error(error.message || 'Error al exportar a PDF');
  } finally {
    setExportando(false);
  }
};


  const canConsultar = useMemo(() => {
    return (modo === 'sesion' && sesionId) || (modo === 'jugador' && jugadorId);
  }, [modo, sesionId, jugadorId]);

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24 }}>
          <Card
            title={<><TeamOutlined /> <span style={{ marginLeft: 8 }}>Panel de Asistencias</span></>}
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
                 <Button 
      type="primary" 
      icon={<PlusOutlined />}
      onClick={() => setModalVisible(true)}
    >
      Registrar Asistencia
    </Button>
              </Space>
            }
          >
            {/* Filtros principales */}
            <Card style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={6}>
                  <Text type="secondary">Ver asistencias por</Text>
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
                          const tipo = s.tipoSesion || 'Sesión';
                          return {
                            value: s.id,
                            label: `${tipo} — ${fecha} — ${hi}${hf ? ` - ${hf}` : ''}`
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
                        placeholder={loadingDependiente ? 'Cargando jugadores…' : 'Todos los jugadores'}
                        allowClear
                        loading={loadingDependiente}
                        showSearch
                        filterOption={(input, option) =>
                          String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={(jugadoresDelGrupo.length ? jugadoresDelGrupo : jugadores).map(j => ({
                          value: j.id,
                          label: `${j?.usuario?.nombre || 'Sin nombre'} ${j?.usuario?.apellido || ''} — ${j?.usuario?.rut || 'Sin RUT'}`
                        }))}
                        disabled={!sesionId}
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
                        loading={loadingBase || loadingBusquedaJugador}
                        allowClear
                        showSearch
                        searchValue={busquedaJugador}
                        onSearch={setBusquedaJugador}
                        filterOption={false}
                        notFoundContent={
                          loadingBusquedaJugador
                            ? 'Buscando...'
                            : busquedaJugador.length >= 2 && jugadoresBusqueda.length === 0
                            ? 'No se encontraron jugadores'
                            : busquedaJugador.length > 0 && busquedaJugador.length < 2
                            ? 'Escribe al menos 2 caracteres para buscar'
                            : 'Escribe para buscar jugadores'
                        }
                        options={(busquedaJugador.length >= 2 ? jugadoresBusqueda : jugadores).map(j => ({
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
                          const tipo = s.tipoSesion || 'Sesión';
                          return {
                            value: s.id,
                            label: `${tipo} — ${fecha} — ${hi}${hf ? ` - ${hf}` : ''}`
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
              <ListaAsistencias
                tipo={modo === 'sesion' ? 'sesion' : 'jugador'}
                id={modo === 'sesion' ? sesionId : jugadorId}
                filtroJugadorId={modo === 'sesion' ? filtroJugadorEnSesion : undefined}
                filtroSesionId={modo === 'jugador' ? filtroSesionDelJugador : undefined}
                reloadKey={reloadKey}
              />
            ) : (
              <Card style={{ textAlign: 'center', color: '#888' }}>
                Selecciona {modo === 'sesion' ? 'una sesión' : 'un jugador'} para ver las asistencias.
              </Card>
            )}
          </Card>
          <ModalRegistrarAsistencia
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSuccess={handleModalSuccess}
          />
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}