import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  DatePicker, Button, Card, Table,App, Spin,
  ConfigProvider, Pagination, Select, Space
} from 'antd';
import { FilterOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getDisponibilidadPorFecha } from '../services/horario.services.js';
import { obtenerCanchas } from '../services/cancha.services.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import locale from 'antd/locale/es_ES';
import 'dayjs/locale/es';
import MainLayout from '../components/MainLayout';

dayjs.locale('es');
const DEFAULT_PAGE_SIZE = 5;

export default function DisponibilidadCancha() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { message } = App.useApp(); 

  const [fecha, setFecha] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0
  });

  const [filtroCapacidad, setFiltroCapacidad] = useState(null);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);

  // Select remoto
  const [canchasDisponibles, setCanchasDisponibles] = useState([]);
  const [searchCancha, setSearchCancha] = useState('');
  const [selectAbierto, setSelectAbierto] = useState(false);
  const baseCanchasRef = useRef(null); // cache base

  const [filtrosActivos, setFiltrosActivos] = useState(false);

  // refs para restaurar paginación
  const prevFiltrosRef = useRef(false);
  const lastPageRef = useRef(1);
  const lastPageSizeRef = useRef(DEFAULT_PAGE_SIZE);

  // abort controller para handleBuscar
  const fetchAbortRef = useRef(null);

  const puedeReservar =
    usuario && (usuario.rol === 'estudiante' || usuario.rol === 'academico');

  // Columns memo
  const columns = useMemo(() => ([
    { title: 'Bloque', dataIndex: 'bloque', key: 'bloque', width: '40%' },
    {
      title: 'Estado',
      dataIndex: 'disponible',
      key: 'disponible',
      width: '60%',
      render: (disp, record) =>
        disp ? (
          <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5'
}}>
  Disponible
</span>
        ) : (
          <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5'
}}>
  {record.motivo || 'Ocupado'}
</span>
        )
    }
  ]), []);

  // Buscar disponibilidad
  const handleBuscar = useCallback(async (page = 1, pageSize = DEFAULT_PAGE_SIZE) => {
    if (!fecha) return;

    // cancelar request anterior si existía
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      setLoading(true);
      const fechaStr = fecha.format('YYYY-MM-DD');

      const extra = {};
      if (canchaSeleccionada) extra.canchaId = Number(canchaSeleccionada);
      if (filtroCapacidad) extra.capacidad = filtroCapacidad;

      const resp = await getDisponibilidadPorFecha(fechaStr, page, pageSize, extra);
      if (controller.signal.aborted) return;

      setItems(resp.data || []);
      setPagination({
        current: resp.page,
        pageSize: resp.limit,
        total: resp.total,
        totalPages: resp.totalPages
      });
    } catch (err) {
      if (err?.name !== 'CanceledError') {
        console.error(err);
        message.error('Error al obtener disponibilidad');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [fecha, canchaSeleccionada, filtroCapacidad]);

  // Cargar por fecha
  useEffect(() => {
    if (fecha) handleBuscar(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  // Select: búsqueda remota con debounce (300ms) + cache base
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const q = (searchCancha || '').trim();
        // si no hay query y hay cache base, úsala
        if (!q && baseCanchasRef.current) {
          if (alive) setCanchasDisponibles(baseCanchasRef.current);
          return;
        }
        const { canchas } = await obtenerCanchas({
          q: q || undefined,
          estado: 'disponible',
          page: 1,
          limit: 50
        });
        if (!alive) return;
        const unique = new Map();
        (canchas || []).forEach((c) => {
          if (!unique.has(c.id)) unique.set(c.id, { label: c.nombre, value: c.id });
        });
        const list = Array.from(unique.values());
        if (!q) baseCanchasRef.current = list; // cache base
        setCanchasDisponibles(list);
      } catch (err) {
        console.error('Error cargando canchas:', err);
      }
    }, 300);

    return () => { alive = false; clearTimeout(t); };
  }, [searchCancha, selectAbierto]);

  // Reconsulta al cambiar filtros + restaurar paginación al limpiar
  useEffect(() => {
    const hayFiltros = Boolean(filtroCapacidad || canchaSeleccionada);
    const antesHabiaFiltros = prevFiltrosRef.current;

    if (hayFiltros && !antesHabiaFiltros) {
      // activando filtros
      lastPageRef.current = pagination.current;
      lastPageSizeRef.current = pagination.pageSize || DEFAULT_PAGE_SIZE;
      setFiltrosActivos(true);
      handleBuscar(1, 1); // en filtrado por cancha suele volver 1
    } else if (!hayFiltros && antesHabiaFiltros) {
      // limpiando filtros
      setFiltrosActivos(false);
      handleBuscar(lastPageRef.current || 1, lastPageSizeRef.current || DEFAULT_PAGE_SIZE);
    } else if (hayFiltros && antesHabiaFiltros) {
      // cambiaron valores en modo filtrado
      handleBuscar(1, 1);
    }

    prevFiltrosRef.current = hayFiltros;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCapacidad, canchaSeleccionada]);

  const handlePageChange = (page, pageSize) => {
    if (!filtrosActivos) {
      lastPageRef.current = page;
      lastPageSizeRef.current = pageSize;
    }
    handleBuscar(page, pageSize);
  };

  const handleDateChange = (newDate) => {
    setFecha(newDate || dayjs());
  };

  const limpiarFiltros = () => {
    setFiltroCapacidad(null);
    setCanchaSeleccionada(null);
    setFiltrosActivos(false);
    setSearchCancha('');
  };

  const opcionesCapacidad = useMemo(() => ([
    { label: 'Pequeña (≤8 jugadores)', value: 'pequena' },
    { label: 'Mediana (9-15 jugadores)', value: 'mediana' },
    { label: 'Grande (>15 jugadores)', value: 'grande' }
  ]), []);

  const puedeReservarBtn = usuario && (usuario.rol === 'estudiante' || usuario.rol === 'academico');

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <Card title="Disponibilidad de Canchas" style={{ border: 'none' }}>
          {/* header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                onClick={() => {
                  if (!fecha) return;
                  let nuevaFecha = fecha.subtract(1, 'day');
                  if (nuevaFecha.day() === 0) nuevaFecha = nuevaFecha.subtract(2, 'day');
                  if (nuevaFecha.day() === 6) nuevaFecha = nuevaFecha.subtract(1, 'day');
                  setFecha(nuevaFecha);
                }}
              >◀ Día anterior</Button>

              <DatePicker
                value={fecha}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                style={{ width: 200 }}
                disabledDate={(current) => {
                  const day = current.day();
                  return day === 0 || day === 6;
                }}
                classNames={{ popup: { root: 'hide-weekends' } }}
              />

              <Button
                onClick={() => {
                  if (!fecha) return;
                  let nuevaFecha = fecha.add(1, 'day');
                  if (nuevaFecha.day() === 6) nuevaFecha = nuevaFecha.add(2, 'day');
                  if (nuevaFecha.day() === 0) nuevaFecha = nuevaFecha.add(1, 'day');
                  setFecha(nuevaFecha);
                }}
              >Día siguiente ▶</Button>

              <Button type="dashed" onClick={() => setFecha(dayjs())} disabled={!fecha || fecha.isSame(dayjs(), 'day')}>
                Hoy
              </Button>
            </div>

            {puedeReservarBtn && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/reservas/nueva')}>
                Reservar cancha
              </Button>
            )}
          </div>

          {/* filtros */}
          <Card type="inner" title={<span><FilterOutlined style={{ marginRight: 8 }} />Filtros de búsqueda</span>} style={{ marginBottom: '1rem', backgroundColor: '#f5f5f5' }}>
            <Space direction="horizontal" wrap size="middle" style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Select
                  placeholder="Buscar cancha"
                  value={canchaSeleccionada}
                  onChange={(val) => { setCanchaSeleccionada(val ?? null); setSearchCancha(''); }}
                  allowClear
                  showSearch
                  onSearch={setSearchCancha}
                  filterOption={false}
                  options={canchasDisponibles}
                  style={{ width: 260 }}
                  onDropdownVisibleChange={(open) => { setSelectAbierto(open); if (!open) setSearchCancha(''); }}
                />

                <Select
                  placeholder="Capacidad"
                  value={filtroCapacidad}
                  onChange={(v) => setFiltroCapacidad(v ?? null)}
                  allowClear
                  options={opcionesCapacidad}
                  style={{ width: 200 }}
                />
              </div>

              {(filtrosActivos || items.length > 0) && (
                <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
              )}
            </Space>
          </Card>

          {/* contenido */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><Spin size="large" /></div>
          ) : items.length > 0 ? (
            <>
              {items.map((c, i) => (
                <Card key={i} type="inner" title={`${c.cancha.nombre} — Capacidad: ${c.cancha.capacidadMaxima}`} style={{ marginBottom: '1rem' }}>
                  {c.cancha.descripcion && (
                    <p style={{ marginBottom: '1rem', color: '#666', fontSize: 14 }}>{c.cancha.descripcion}</p>
                  )}
                  <Table
                    columns={columns}
                    dataSource={(c.bloques || []).map((b, j) => ({
                      key: j,
                      bloque: `${b.horaInicio} - ${b.horaFin}`,
                      disponible: b.disponible,
                      motivo: b.motivo
                    }))}
                    pagination={false}
                    size="small"
                  />
                </Card>
              ))}

              {!filtrosActivos && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    showSizeChanger
                    showTotal={(total) => `Total: ${total} canchas`}
                    pageSizeOptions={['5', '10', '20', '50']}
                  />
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              {filtrosActivos ? 'No se encontraron canchas con los filtros aplicados' : 'No hay canchas disponibles para esta fecha'}
            </div>
          )}
        </Card>

        <style>{`
          .hide-weekends .ant-picker-cell:nth-child(7n+6),
          .hide-weekends .ant-picker-cell:nth-child(7n+7) { display: none !important; }
          .hide-weekends thead tr th:nth-child(6),
          .hide-weekends thead tr th:nth-child(7) { display: none !important; }
        `}</style>
      </ConfigProvider>
    </MainLayout>
  );
}
