import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Space, Tooltip, Popconfirm, App,
  Row, Col, Empty, Breadcrumb, Input, Select, Alert, Pagination, ConfigProvider, Dropdown
} from 'antd';
import esES from 'antd/locale/es_ES';
import {
  DeleteOutlined, UserOutlined, ThunderboltOutlined, FilterOutlined,
  ReloadOutlined, TeamOutlined, ArrowLeftOutlined, SearchOutlined,
  FileExcelOutlined, FilePdfOutlined, DownloadOutlined
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import * as estadisticaService from '../services/estadisticaCampeonato.services';
import { equipoService } from '../services/equipo.services';

function EstadisticasContent() {
  const { id: campeonatoId } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [estadisticas, setEstadisticas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [todosLosJugadores, setTodosLosJugadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [jugadoresCargados, setJugadoresCargados] = useState(false);

  const [filtros, setFiltros] = useState({ busqueda: '', equipoId: null });
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // === 1️⃣ Cargar equipos del campeonato
  useEffect(() => {
    (async () => {
      try {
        console.log('🏆 Cargando equipos del campeonato:', campeonatoId);
        const response = await equipoService.listarPorCampeonato(campeonatoId);
        console.log('📦 Response completa:', response);
        
        // ✅ Unwrap la respuesta (puede venir como {data: [...]} o directamente [...])
        const lista = response?.data || response;
        console.log('✅ Equipos cargados:', lista);
        
        setEquipos(Array.isArray(lista) ? lista : []);
      } catch (err) {
        console.error('❌ Error cargando equipos:', err);
        message.error('No se pudieron cargar los equipos');
      }
    })();
  }, [campeonatoId]);

  // === 2️⃣ Cargar jugadores de todos los equipos
  useEffect(() => {
    (async () => {
      if (!equipos.length) {
        console.log('⏳ Esperando equipos...');
        return;
      }
      
      try {
        console.log('👥 Cargando jugadores de', equipos.length, 'equipos');
        const prom = equipos.map(async (eq) => {
          const response = await equipoService.listarJugadores(eq.id);
          const data = response.data?.data || response.data || response;
          const jugadores = Array.isArray(data) ? data : data.jugadores || [];
          
          return jugadores.map((j) => ({
            id: j.id,
            usuario: {
              nombre: j.nombre ?? j.usuario?.nombre ?? '',
              apellido: j.apellido ?? j.usuario?.apellido ?? '',
              rut: j.rut ?? j.usuario?.rut ?? ''
            },
            equipo: { id: eq.id, nombre: eq.nombre },
          }));
        });

        const result = await Promise.all(prom);
        const jugadoresFlat = result.flat();
        console.log('✅ Jugadores cargados:', jugadoresFlat.length);
        setTodosLosJugadores(jugadoresFlat);
        setJugadoresCargados(true);
      } catch (err) {
        console.error('❌ Error cargando jugadores:', err);
        message.error('No se pudieron cargar los jugadores');
        setJugadoresCargados(true); // ✅ Marcar como cargado aunque falle
      }
    })();
  }, [equipos]);

  // === 3️⃣ Cargar estadísticas (independiente de jugadores)
  const cargarEstadisticas = useCallback(async () => {
    console.log('📊 Iniciando carga de estadísticas...');
    setLoading(true);
    try {
      const data = await estadisticaService.listarEstadisticas({ campeonatoId });
      console.log('📥 Respuesta del servicio:', data);
      
      // ✅ El servicio devuelve { total, items }
      const items = data?.items || [];
      console.log('📋 Items recibidos:', items.length);

      // ✅ Enriquecer con información de jugadores
      const enriched = items.map((est) => {
        const jugador = todosLosJugadores.find((j) => j.id === est.jugadorCampeonatoId);
        return {
          ...est,
          jugadorNombre:
            (jugador
              ? `${jugador.usuario?.nombre || ''} ${jugador.usuario?.apellido || ''}`.trim()
              : '') || 'Desconocido',
          equipoNombre: jugador?.equipo?.nombre || 'Sin equipo',
          partidoInfo: est.partido || est.partidoInfo || {},
        };
      });

      console.log('✅ Estadísticas enriquecidas:', enriched.length);
      setEstadisticas(enriched);
      setCurrent(1);
    } catch (err) {
      console.error('❌ Error al cargar estadísticas:', err);
      message.error('Error al cargar estadísticas');
      setEstadisticas([]);
    } finally {
      setLoading(false);
    }
  }, [campeonatoId, todosLosJugadores]);

  // === 4️⃣ Cargar estadísticas cuando los jugadores estén listos
  useEffect(() => {
    if (jugadoresCargados) {
      console.log('🚀 Jugadores listos, cargando estadísticas...');
      cargarEstadisticas();
    }
  }, [jugadoresCargados, cargarEstadisticas]);

  const handleEliminar = useCallback(async (id) => {
    try {
      await estadisticaService.eliminarEstadistica(id);
      message.success('Estadística eliminada');
      cargarEstadisticas();
    } catch (err) {
      message.error(typeof err === 'string' ? err : 'Error al eliminar estadística');
    }
  }, [cargarEstadisticas]);

  const limpiarFiltros = () => {
    setFiltros({ busqueda: '', equipoId: null });
    setCurrent(1);
  };

  const handleExportarExcel = async () => {
    setExportando(true);
    try {
      const result = await estadisticaService.exportarExcel(
        campeonatoId,
        filtros.equipoId,
        filtros.busqueda
      );

      if (result.modo === "web" && result.blob) {
        descargarArchivo(result.blob, result.nombre);
        message.success("Excel descargado correctamente");
      } else if (result.modo === "mobile" && result.base64) {
        console.log("BASE64 recibido:", result.base64);
        message.success("Archivo generado (mobile)");
      }
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      message.error(error.message || 'Error al exportar estadísticas a Excel');
    } finally {
      setExportando(false);
    }
  };

  const handleExportarPDF = async () => {
    setExportando(true);
    try {
      const result = await estadisticaService.exportarPDF(
        campeonatoId,
        filtros.equipoId,
        filtros.busqueda
      );

      if (result.modo === "web" && result.blob) {
        descargarArchivo(result.blob, result.nombre);
        message.success("PDF descargado correctamente");
      } else if (result.modo === "mobile" && result.base64) {
        console.log("BASE64 recibido:", result.base64);
        message.success("Archivo generado (mobile)");
      }
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      message.error(error.message || 'Error al exportar estadísticas a PDF');
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
    }
  }

  // helper: id -> nombre equipo
  const getEquipoNombreById = useCallback((id) => {
    if (!id) return null;
    const eq = equipos.find((e) => Number(e.id) === Number(id));
    return eq?.nombre || null;
  }, [equipos]);

  // === Filtrado
  const estadisticasFiltradas = useMemo(() => {
    const texto = filtros.busqueda?.toLowerCase().trim();
    const equipoSel = filtros.equipoId
      ? equipos.find((e) => e.id === filtros.equipoId)?.nombre
      : null;

    return estadisticas.filter((est) => {
      const matchBusqueda = texto
        ? (est.jugadorNombre || '').toLowerCase().includes(texto) ||
          (est.equipoNombre || '').toLowerCase().includes(texto)
        : true;

      const matchEquipo = equipoSel ? est.equipoNombre === equipoSel : true;

      return matchBusqueda && matchEquipo;
    });
  }, [estadisticas, filtros, equipos]);

  // === Paginación en memoria
  const paginatedData = useMemo(() => {
    const start = (current - 1) * pageSize;
    return estadisticasFiltradas.slice(start, start + pageSize);
  }, [estadisticasFiltradas, current, pageSize]);

  // === Columnas
  const columns = useMemo(() => [
    {
      title: 'Jugador',
      key: 'jugador',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <UserOutlined />
            <strong>{record.jugadorNombre || `ID ${record.jugadorCampeonatoId}`}</strong>
          </Space>
          <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 20 }}>
            {record.equipoNombre || 'Sin equipo'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Partido',
      key: 'partido',
      width: 220,
      render: (_, record) => {
        const p = record.partidoInfo || {};
        const nombreA =
          p?.equipoA?.nombre ||
          getEquipoNombreById(p?.equipoAId) ||
          p?.equipoA || 'Equipo A';
        const nombreB =
          p?.equipoB?.nombre ||
          getEquipoNombreById(p?.equipoBId) ||
          p?.equipoB || 'Equipo B';
        return (
          <Space direction="vertical" size={0}>
            <span>
              <strong>{nombreA}</strong> vs <strong>{nombreB}</strong>
            </span>
            {p?.ronda && (
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>{p.ronda}</span>
            )}
          </Space>
        );
      },
    },
    {
      title: '⚽ Goles',
      dataIndex: 'goles',
      key: 'goles',
      align: 'center',
      render: (g) => <strong>{g ?? 0}</strong>,
    },
    {
      title: '🎯 Asist.',
      dataIndex: 'asistencias',
      key: 'asistencias',
      align: 'center',
      render: (a) => <strong>{a ?? 0}</strong>,
    },
    {
      title: '🧤 Ataj.',
      dataIndex: 'atajadas',
      key: 'atajadas',
      align: 'center',
      render: (a) => <strong>{a ?? 0}</strong>,
    },
    {
      title: 'Tarjetas',
      key: 'tarjetas',
      align: 'center',
      render: (_, r) => (
        <span>🟨 {r.tarjetasAmarillas || 0} / 🟥 {r.tarjetasRojas || 0}</span>
      ),
    },
    {
      title: '⏱️ Minutos',
      dataIndex: 'minutosJugados',
      key: 'minutosJugados',
      align: 'center',
      render: (m) => <strong>{m ?? 0}'</strong>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm
          title="¿Eliminar estadística?"
          description="Esta acción no se puede deshacer"
          onConfirm={() => handleEliminar(record.id)}
          okText="Eliminar"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Eliminar">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ], [getEquipoNombreById, handleEliminar]);

  const hayFiltrosActivos = filtros.busqueda || filtros.equipoId;

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Volver</Button>
      </Space>

      <Alert
        message="Las estadísticas se gestionan desde cada partido"
        description="Para agregar o editar estadísticas, vaya a la sección de Partidos y usa el botón de estadísticas en cada partido."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card
        title={<Space><FilterOutlined /><span>Filtros</span></Space>}
        style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}
        extra={
          <Button icon={<ReloadOutlined />} onClick={limpiarFiltros} disabled={!hayFiltrosActivos}>
            Limpiar
          </Button>
        }
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar por nombre o equipo"
              allowClear
              value={filtros.busqueda}
              onChange={(e) => setFiltros((p) => ({ ...p, busqueda: e.target.value }))}
              prefix={<SearchOutlined />}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filtrar por equipo"
              allowClear
              showSearch
              value={filtros.equipoId}
              onChange={(val) => setFiltros((p) => ({ ...p, equipoId: val }))}
              optionFilterProp="children"
              suffixIcon={<TeamOutlined />}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={equipos.map((e) => ({
                value: e.id,
                label: e.nombre,
              }))}
            />
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <span>Estadísticas del Campeonato</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #B9BBBB',
              backgroundColor: '#f5f5f5'
            }}>
              {estadisticasFiltradas.length} registros
            </span>
            {hayFiltrosActivos && (
              <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '12px',
                fontWeight: 500,
                border: '1px solid #B9BBBB',
                backgroundColor: '#f5f5f5'
              }}>
                Filtrado
              </span>
            )}
          </Space>
        }
        extra={
          estadisticas.length > 0 && (
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
          )
        }
      >
        <Table
          columns={columns}
          dataSource={paginatedData}
          loading={loading}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1000 }}
          size="small"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  hayFiltrosActivos
                    ? 'No se encontraron resultados con los filtros aplicados'
                    : 'No hay estadísticas registradas'
                }
              >
                {hayFiltrosActivos && <Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
              </Empty>
            )
          }}
        />

        {estadisticasFiltradas.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Pagination
              current={current}
              pageSize={pageSize}
              onChange={(page, size) => { setCurrent(page); setPageSize(size); }}
              showSizeChanger
              showTotal={(total) => `Total: ${total} registros`}
              pageSizeOptions={['10', '20', '50', '100']}
              total={estadisticasFiltradas.length}
            />
          </div>
        )}
      </Card>
    </>
  );
}

export default function EstadisticasCampeonato() {
  const { id } = useParams();
  const navigate = useNavigate();

  const breadcrumb = (
    <Breadcrumb
      items={[
        { title: <a onClick={() => navigate('/campeonatos')}>Campeonatos</a> },
        { title: <a onClick={() => navigate(`/campeonatos/${id}/info`)}>Detalle</a> },
        { title: 'Estadísticas' }
      ]}
    />
  );

  return (
    <ConfigProvider locale={esES}>
      <MainLayout breadcrumb={breadcrumb}>
        <EstadisticasContent />
      </MainLayout>
    </ConfigProvider>
  );
}