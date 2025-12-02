import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Card, Button, Modal, Select, Row, Col, Space, App, ConfigProvider, Typography, Dropdown, Spin 
} from 'antd';
import locale from 'antd/locale/es_ES';
import { PlusOutlined, ReloadOutlined, SlidersOutlined, FileExcelOutlined, FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ListaEstadisticas from '../components/EstadisticasList';
import EstadisticaForm from '../components/EstadisticaForm';
import { obtenerSesiones, obtenerSesionPorId } from '../services/sesion.services.js';
import { obtenerJugadores } from '../services/jugador.services.js';
import { obtenerGrupoPorId } from '../services/grupo.services.js';
import { exportarEstadisticasExcel, exportarEstadisticasPDF } from '../services/estadistica.services.js';
import { formatearFecha, formatearHora } from '../utils/formatters.js';

const { Option } = Select;
const { Text } = Typography;

const PRELOAD_LIMIT = 50;

export default function Estadisticas() {
  const [busquedaJugador, setBusquedaJugador] = useState('');
  const [jugadoresBusqueda, setJugadoresBusqueda] = useState([]);
  const [loadingBusquedaJugador, setLoadingBusquedaJugador] = useState(false);
  const searchTimeout = useRef(null);
    const { message } = App.useApp(); 

  const [modo, setModo] = useState('sesion');
  const [sesiones, setSesiones] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [sesionId, setSesionId] = useState(null);
  const [jugadorId, setJugadorId] = useState(null);
  const [jugadoresDelGrupo, setJugadoresDelGrupo] = useState([]);
  const [sesionesDelJugador, setSesionesDelJugador] = useState([]);
  const [filtroJugadorEnSesion, setFiltroJugadorEnSesion] = useState(null);
  const [filtroSesionDelJugador, setFiltroSesionDelJugador] = useState(null);
  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingDependiente, setLoadingDependiente] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // ✅ CARGAR DATOS INICIALES - Solo una vez al montar
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

  // Cuando cambia el modo, limpiamos filtros
  useEffect(() => {
    setSesionId(null);
    setJugadorId(null);
    setJugadoresDelGrupo([]);
    setSesionesDelJugador([]);
    setFiltroJugadorEnSesion(null);
    setFiltroSesionDelJugador(null);
    setBusquedaJugador('');
    setJugadoresBusqueda([]);
    
    // Limpiar timeout
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  }, [modo]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Al elegir una sesión: cargar jugadores del grupo
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
      message.warning('No se pudo cargar el grupo de la sesión; se listarán todos los jugadores');
      setJugadoresDelGrupo(jugadores);
    } finally {
      setLoadingDependiente(false);
    }
  }, [jugadores, sesiones]);

  // Al elegir un jugador
  const onSeleccionarJugador = useCallback(async (id) => {
    setJugadorId(id);
    setFiltroSesionDelJugador(null);
    setSesionesDelJugador([]);

    if (!id) return;
    setSesionesDelJugador(sesiones);
  }, [sesiones]);

  // 🔥 Handler de búsqueda con debounce
  const handleBuscarJugadores = (value) => {
    setBusquedaJugador(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Si está vacío O tiene menos de 2 caracteres, limpiar
    if (!value || value.trim().length < 2) {
      setJugadoresBusqueda([]);
      setLoadingBusquedaJugador(false);
      return;
    }

    // ✅ Solo activar loading, NO limpiar jugadores
    setLoadingBusquedaJugador(true);

    // Buscar con debounce (solo si tiene 2+ caracteres)
    searchTimeout.current = setTimeout(() => {
      buscarJugadoresConQ(value.trim());
    }, 500);
  };

  const buscarJugadoresConQ = async (q) => {
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
  };

  const limpiarFiltros = useCallback(() => {
    setSesionId(null);
    setJugadorId(null);
    setJugadoresDelGrupo([]);
    setSesionesDelJugador([]);
    setFiltroJugadorEnSesion(null);
    setFiltroSesionDelJugador(null);
    setBusquedaJugador('');
    setJugadoresBusqueda([]);
  }, []);

  const manejarCrear = () => {
    setEditando(null);
    setModalVisible(true);
  };

  const onSuccessForm = () => {
    setModalVisible(false);
    setEditando(null);
    message.success('Estadística guardada');
    setReloadKey(k => k + 1);
  };

 const handleExportarExcel = async () => {
  try {
    const params = {
      tipo: modo,
      id: modo === 'sesion' ? sesionId : jugadorId,
      // ✅ Agregar filtros opcionales
      ...(modo === 'sesion' && filtroJugadorEnSesion && { jugadorId: filtroJugadorEnSesion }),
      ...(modo === 'jugador' && filtroSesionDelJugador && { sesionId: filtroSesionDelJugador })
    };

    const result = await exportarEstadisticasExcel(params);

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
  }
};

const handleExportarPDF = async () => {
  try {
    const params = {
      tipo: modo,
      id: modo === 'sesion' ? sesionId : jugadorId,
      // ✅ Agregar filtros opcionales
      ...(modo === 'sesion' && filtroJugadorEnSesion && { jugadorId: filtroJugadorEnSesion }),
      ...(modo === 'jugador' && filtroSesionDelJugador && { sesionId: filtroSesionDelJugador })
    };

    const result = await exportarEstadisticasPDF(params);

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

  // Determinar qué jugadores mostrar
  const jugadoresAMostrar = useMemo(() => {
    // ✅ Si está escribiendo pero tiene menos de 2 caracteres, no mostrar nada
    if (busquedaJugador.trim().length > 0 && busquedaJugador.trim().length < 2) {
      return [];
    }
    // Si tiene 2+ caracteres, mostrar resultados de búsqueda
    // Si NO hay búsqueda, NO mostrar nada (array vacío)
    return busquedaJugador.trim().length >= 2 ? jugadoresBusqueda : [];
  }, [busquedaJugador, jugadoresBusqueda]);


  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24 }}>
          <Card
            title={<><SlidersOutlined /> <span style={{ marginLeft: 8 }}>Panel de Estadísticas</span></>}
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
                    <Button icon={<DownloadOutlined />}>
                      Exportar
                    </Button>
                  </Dropdown>
                )}
                
                <Button icon={<ReloadOutlined />} onClick={() => setReloadKey(k => k + 1)}>
                  Actualizar
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={manejarCrear}>
                  Nueva estadística
                </Button>
              </Space>
            }
          >
            {/* Filtros principales */}
            <Card style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={6}>
                  <Text type="secondary">Ver estadísticas por</Text>
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
                        onSearch={handleBuscarJugadores}
                        filterOption={false}
                        notFoundContent={
                          loadingBusquedaJugador ? (
                            <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <Spin size="small" />
                            </div>
                          ) : busquedaJugador.trim().length > 0 && busquedaJugador.trim().length < 2 ? (
                            <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                              Escribe al menos 2 caracteres
                            </div>
                          ) : busquedaJugador.trim().length >= 2 && jugadoresAMostrar.length === 0 ? (
                            <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                              No se encontraron jugadores
                            </div>
                          ) : jugadoresAMostrar.length === 0 ? (
                            <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                              Escribe para buscar...
                            </div>
                          ) : null
                        }
                        options={jugadoresAMostrar.map(j => ({
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
              <ListaEstadisticas
                tipo={modo === 'sesion' ? 'sesion' : 'jugador'}
                id={modo === 'sesion' ? sesionId : jugadorId}
                filtroJugadorId={modo === 'sesion' ? filtroJugadorEnSesion : undefined}
                filtroSesionId={modo === 'jugador' ? filtroSesionDelJugador : undefined}
                reloadKey={reloadKey}
                userRole="entrenador"
                onEdit={(row) => {
                  setEditando(row);
                  setModalVisible(true);
                }}
              />
            ) : (
              <Card style={{ textAlign: 'center', color: '#888' }}>
                Selecciona {modo === 'sesion' ? 'una sesión' : 'un jugador'} para ver las estadísticas.
              </Card>
            )}
          </Card>

          {/* Modal Crear/Editar */}
          <Modal
            title={editando ? 'Editar Estadística' : 'Nueva Estadística'}
            open={modalVisible}
            onCancel={() => { setModalVisible(false); setEditando(null); }}
            footer={null}
            destroyOnClose
            width={800}
          >
            <EstadisticaForm
              estadistica={editando}
              jugadores={jugadores}
              onSuccess={onSuccessForm}
              onCancel={() => { setModalVisible(false); setEditando(null); }}
            />
          </Modal>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}