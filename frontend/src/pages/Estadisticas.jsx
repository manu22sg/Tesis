import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Card, Button, Modal, Select, Row, Col, Space, message, ConfigProvider, Typography,Dropdown 
} from 'antd';
import locale from 'antd/locale/es_ES';
import { PlusOutlined, ReloadOutlined, SlidersOutlined,FileExcelOutlined,   
  FilePdfOutlined,     
  DownloadOutlined     
 } from '@ant-design/icons';
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

// Tamaño de pre-carga para dropdowns (puedes subir a 200 si tu backend y UI lo aguantan)
const PRELOAD_LIMIT = 50;

export default function Estadisticas() {
  // Modo: 'sesion' | 'jugador'
  const [modo, setModo] = useState('sesion');

  // Datos base
  const [sesiones, setSesiones] = useState([]);
  const [jugadores, setJugadores] = useState([]);

  // Filtros principales
  const [sesionId, setSesionId] = useState(null);
  const [jugadorId, setJugadorId] = useState(null);

  // Filtros secundarios (anidados)
  const [jugadoresDelGrupo, setJugadoresDelGrupo] = useState([]);   // cuando se elige sesión
  const [sesionesDelJugador, setSesionesDelJugador] = useState([]); // opcional cuando se elige jugador
  const [filtroJugadorEnSesion, setFiltroJugadorEnSesion] = useState(null);
  const [filtroSesionDelJugador, setFiltroSesionDelJugador] = useState(null);

  // UI / control
  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingDependiente, setLoadingDependiente] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const cargarBase = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    cargarBase();
  }, [cargarBase]);

  // Cuando cambia el modo, limpiamos filtros coherentes
  useEffect(() => {
    setSesionId(null);
    setJugadorId(null);
    setJugadoresDelGrupo([]);
    setSesionesDelJugador([]);
    setFiltroJugadorEnSesion(null);
    setFiltroSesionDelJugador(null);
  }, [modo]);

  // Al elegir una sesión: cargar jugadores del grupo de esa sesión
  const onSeleccionarSesion = useCallback(async (id) => {
    setSesionId(id);
    setFiltroJugadorEnSesion(null);
    setJugadoresDelGrupo([]);
    if (!id) return;

    setLoadingDependiente(true);
    try {
      // Traer la sesión completa (si la lista no incluye group info)
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
        // Fallback: no hay grupo, listar todos
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

  // Al elegir un jugador: opcionalmente derivar sesiones del jugador (cliente-side)
  const onSeleccionarJugador = useCallback(async (id) => {
    setJugadorId(id);
    setFiltroSesionDelJugador(null);
    setSesionesDelJugador([]);

    if (!id) return;

    // Si tu backend soporta filtrar sesiones por jugador, úsalo.
    // Fallback cliente: mostramos todas; el filtro fino se hace en la tabla.
    setSesionesDelJugador(sesiones);
  }, [sesiones]);

  const limpiarFiltros = useCallback(() => {
    setSesionId(null);
    setJugadorId(null);
    setJugadoresDelGrupo([]);
    setSesionesDelJugador([]);
    setFiltroJugadorEnSesion(null);
    setFiltroSesionDelJugador(null);
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
      id: modo === 'sesion' ? sesionId : jugadorId
    };

    const blob = await exportarEstadisticasExcel(params);
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `estadisticas_${modo}_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

  } catch (error) {
    console.error('Error:', error);
    message.error(error.message || 'Error al exportar a Excel');
  }
};

const handleExportarPDF = async () => {
  try {
    const params = {
      tipo: modo,
      id: modo === 'sesion' ? sesionId : jugadorId
    };

    const blob = await exportarEstadisticasPDF(params);
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `estadisticas_${modo}_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

  } catch (error) {
    console.error('Error:', error);
    message.error(error.message || 'Error al exportar a PDF');
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
            <Card style={{ marginBottom: 16, background: '#fafafa' }}>
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
                          const nombre = s.nombre ? `${s.nombre} — ` : '';
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
                          label: `${j?.usuario?.nombre || 'Sin nombre'} — ${j?.usuario?.rut || 'Sin RUT'}`
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
                        placeholder="Selecciona un jugador"
                        loading={loadingBase}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={(jugadores || []).map(j => ({
                          value: j.id,
                          label: `${j?.usuario?.nombre || 'Sin nombre'} — ${j?.usuario?.rut || 'Sin RUT'}`
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
                // API principal
                tipo={modo === 'sesion' ? 'sesion' : 'jugador'}
                id={modo === 'sesion' ? sesionId : jugadorId}
                // Filtros secundarios opcionales (cliente)
                filtroJugadorId={modo === 'sesion' ? filtroJugadorEnSesion : undefined}
                filtroSesionId={modo === 'jugador' ? filtroSesionDelJugador : undefined}
                // recarga externa
                reloadKey={reloadKey}
                // habilitar acciones (editar/eliminar)
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
