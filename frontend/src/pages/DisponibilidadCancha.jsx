import { useState, useEffect } from 'react';
import { DatePicker, Button, Card, Table, Tag, message, Spin, ConfigProvider, Pagination, Input, Select, Space } from 'antd';
import { SearchOutlined, FilterOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getDisponibilidadPorFecha } from '../services/horario.services.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import locale from 'antd/locale/es_ES';
import 'dayjs/locale/es';
import MainLayout from '../components/MainLayout';

dayjs.locale('es');

export default function DisponibilidadCancha() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [fecha, setFecha] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [disponibilidadFiltrada, setDisponibilidadFiltrada] = useState([]);

  // 🔹 Paginación
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
    totalPages: 0
  });

  // 🔹 Filtros
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroCapacidad, setFiltroCapacidad] = useState(null);

  // 🔹 NUEVOS: Select de canchas con búsqueda
  const [canchasDisponibles, setCanchasDisponibles] = useState([]); // {label, value}
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null); // id de cancha

  const [filtrosActivos, setFiltrosActivos] = useState(false);

  const puedeReservar =
    usuario && (usuario.rol === 'estudiante' || usuario.rol === 'academico');

  // Cargar data principal al cambiar la fecha
  useEffect(() => {
    if (fecha) {
      handleBuscar(1, pagination.pageSize);
    }
  }, [fecha]);

  // Cargar opciones de canchas PARA ESA FECHA (literalmente como tu snippet)
  useEffect(() => {
    const cargarCanchas = async () => {
      try {
        const fechaStr = (fecha || dayjs()).format('YYYY-MM-DD');
        const response = await getDisponibilidadPorFecha(fechaStr, 1, 100);
        const lista = (response.data || []).map((d) => ({
          label: d.cancha?.nombre ?? `Cancha ${d.cancha?.id ?? ''}`,
          value: d.cancha?.id
        }));
        setCanchasDisponibles(lista);
      } catch (err) {
        console.error('Error cargando canchas:', err);
      }
    };
    cargarCanchas();
  }, [fecha]);

  // Reaplica filtros cuando cambien
  useEffect(() => {
    aplicarFiltros();
  }, [filtroNombre, filtroCapacidad, canchaSeleccionada, disponibilidad]);

  const columns = [
    {
      title: 'Bloque',
      dataIndex: 'bloque',
      key: 'bloque',
      width: '40%'
    },
    {
      title: 'Estado',
      dataIndex: 'disponible',
      key: 'disponible',
      width: '60%',
      render: (disp, record) =>
        disp ? (
          <Tag color="green">Disponible</Tag>
        ) : (
          <Tag color="red">{record.motivo || 'Ocupado'}</Tag>
        )
    }
  ];

  const handleBuscar = async (page = 1, pageSize = 5) => {
    if (!fecha) return;

    try {
      setLoading(true);
      const fechaStr = fecha.format('YYYY-MM-DD');
      const response = await getDisponibilidadPorFecha(fechaStr, page, pageSize);

      setDisponibilidad(response.data || []);
      setDisponibilidadFiltrada(response.data || []);
      setPagination({
        current: response.page,
        pageSize: response.limit,
        total: response.total,
        totalPages: response.totalPages
      });
    } catch (err) {
      console.error(err);
      message.error('Error al obtener disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = (data = disponibilidad) => {
    let resultado = [...data];

    // 🔎 por nombre de cancha
    if (filtroNombre) {
      resultado = resultado.filter((c) =>
        c.cancha.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }

    // 🧮 por capacidad
    if (filtroCapacidad) {
      resultado = resultado.filter((c) => {
        const cap = c.cancha.capacidadMaxima;
        if (filtroCapacidad === 'pequena') return cap <= 8;
        if (filtroCapacidad === 'mediana') return cap > 8 && cap <= 15;
        if (filtroCapacidad === 'grande') return cap > 15;
        return true;
      });
    }

    // ✅ NUEVO: por cancha seleccionada en el Select
    if (canchaSeleccionada) {
      resultado = resultado.filter((c) => c.cancha.id === canchaSeleccionada);
    }

    setDisponibilidadFiltrada(resultado);
    setFiltrosActivos(
      Boolean(
        filtroNombre || filtroCapacidad || canchaSeleccionada
      )
    );
  };

  const limpiarFiltros = () => {
    setFiltroNombre('');
    setFiltroCapacidad(null);
    setCanchaSeleccionada(null);
    setDisponibilidadFiltrada(disponibilidad);
    setFiltrosActivos(false);
  };

  const handlePageChange = (page, pageSize) => {
    handleBuscar(page, pageSize);
  };

  const handleDateChange = (newDate) => {
    setFecha(newDate || dayjs());
  };

  const opcionesCapacidad = [
    { label: 'Pequeña (≤8 jugadores)', value: 'pequena' },
    { label: 'Mediana (9-15 jugadores)', value: 'mediana' },
    { label: 'Grande (>15 jugadores)', value: 'grande' }
  ];

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <Card title="Disponibilidad de Canchas" style={{ border: 'none' }}>
          {/* 🔹 Barra superior: fecha y botón de reserva */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Button
                onClick={() => {
                  if (!fecha) return;
                  let nuevaFecha = fecha.subtract(1, 'day');
                  if (nuevaFecha.day() === 0) nuevaFecha = nuevaFecha.subtract(2, 'day');
                  if (nuevaFecha.day() === 6) nuevaFecha = nuevaFecha.subtract(1, 'day');
                  setFecha(nuevaFecha);
                }}
                icon={<span>◀</span>}
              >
                Día anterior
              </Button>

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
                icon={<span>▶</span>}
              >
                Día siguiente
              </Button>

              <Button
                type="dashed"
                onClick={() => setFecha(dayjs())}
                disabled={!fecha || fecha.isSame(dayjs(), 'day')}
              >
                Hoy
              </Button>
            </div>

            {puedeReservar && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/reservas/nueva')}>
                Reservar cancha
              </Button>
            )}
          </div>

          {/* 🔻 Filtros */}
          <Card
            type="inner"
            title={
              <span>
                <FilterOutlined style={{ marginRight: 8 }} />
                Filtros de búsqueda
              </span>
            }
            style={{ marginBottom: '1rem', backgroundColor: '#fafafa' }}
          >
            <Space
              direction="horizontal"
              wrap
              size="middle"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Select
                  placeholder="Buscar cancha"
                  value={canchaSeleccionada}
                  onChange={setCanchaSeleccionada}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={canchasDisponibles}
                  style={{ width: 260 }}
                />

                <Select
                  placeholder="Capacidad"
                  value={filtroCapacidad}
                  onChange={setFiltroCapacidad}
                  allowClear
                  options={opcionesCapacidad}
                  style={{ width: 200 }}
                />

                
              </div>

              {(filtrosActivos || disponibilidad.length > 0) && (
                <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
              )}
            </Space>
          </Card>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spin size="large" />
            </div>
          ) : disponibilidadFiltrada.length > 0 ? (
            <>
              {disponibilidadFiltrada.map((c, i) => (
                <Card
                  key={i}
                  type="inner"
                  title={`${c.cancha.nombre} — Capacidad: ${c.cancha.capacidadMaxima}`}
                  style={{ marginBottom: '1rem' }}
                >
                  {c.cancha.descripcion && (
                    <p
                      style={{
                        marginBottom: '1rem',
                        color: '#666',
                        fontSize: 14
                      }}
                    >
                      {c.cancha.descripcion}
                    </p>
                  )}
                  <Table
                    columns={columns}
                    dataSource={c.bloques.map((b, j) => ({
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

              {/* Ocultamos paginación si hay filtros activos (incluye select de canchas) */}
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
              {filtrosActivos
                ? 'No se encontraron canchas con los filtros aplicados'
                : 'No hay canchas disponibles para esta fecha'}
            </div>
          )}
        </Card>

        <style>
          {`
            .hide-weekends .ant-picker-cell:nth-child(7n+6),
            .hide-weekends .ant-picker-cell:nth-child(7n+7) {
              display: none !important;
            }

            .hide-weekends thead tr th:nth-child(6),
            .hide-weekends thead tr th:nth-child(7) {
              display: none !important;
            }
          `}
        </style>
      </ConfigProvider>
    </MainLayout>
  );
}
