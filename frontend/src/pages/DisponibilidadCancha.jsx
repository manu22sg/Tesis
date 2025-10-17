import { useState, useEffect } from 'react';
import { DatePicker, Button, Card, Table, Tag, message, Spin, ConfigProvider, Pagination, Input, Select, Space } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getDisponibilidadPorFecha } from '../services/horario.services.js';
import { useNavigate } from 'react-router-dom';
import locale from 'antd/locale/es_ES';
import 'dayjs/locale/es';

dayjs.locale('es');

export default function DisponibilidadCancha() {
  const navigate = useNavigate();
  const [fecha, setFecha] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [disponibilidadFiltrada, setDisponibilidadFiltrada] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
    totalPages: 0
  });
  
  // Estados para filtros
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroCapacidad, setFiltroCapacidad] = useState(null);
  const [filtrosActivos, setFiltrosActivos] = useState(false);

  // ✅ SOLO UN useEffect: Consultar cuando cambia la fecha
  useEffect(() => {
    handleBuscar(1, pagination.pageSize);
  }, [fecha]); // Eliminar el otro useEffect

  // 🔹 Aplicar filtros automáticamente cuando cambien
  useEffect(() => {
    aplicarFiltros();
  }, [filtroNombre, filtroCapacidad, disponibilidad]);

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
        ),
    },
  ];

  const handleBuscar = async (page = 1, pageSize = 5) => {
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

    // Filtrar por nombre
    if (filtroNombre) {
      resultado = resultado.filter(c => 
        c.cancha.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }

    // Filtrar por capacidad
    if (filtroCapacidad) {
      resultado = resultado.filter(c => {
        if (filtroCapacidad === 'pequena') return c.cancha.capacidadMaxima <= 8;
        if (filtroCapacidad === 'mediana') return c.cancha.capacidadMaxima > 8 && c.cancha.capacidadMaxima <= 15;
        if (filtroCapacidad === 'grande') return c.cancha.capacidadMaxima > 15;
        return true;
      });
    }

    setDisponibilidadFiltrada(resultado);
    setFiltrosActivos(filtroNombre || filtroCapacidad);
  };

  const limpiarFiltros = () => {
    setFiltroNombre('');
    setFiltroCapacidad(null);
    setDisponibilidadFiltrada(disponibilidad);
    setFiltrosActivos(false);
  };

  const handlePageChange = (page, pageSize) => {
    handleBuscar(page, pageSize);
  };

  // Opciones de capacidad
  const opcionesCapacidad = [
    { label: 'Pequeña (≤8 jugadores)', value: 'pequena' },
    { label: 'Mediana (9-15 jugadores)', value: 'mediana' },
    { label: 'Grande (>15 jugadores)', value: 'grande' },
  ];

  return (
    <ConfigProvider locale={locale}>
      <div
        style={{
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Card
          title="Disponibilidad de Canchas"
          style={{ maxWidth: 1000, margin: '0 auto' }}
        >
          {/* 🔹 Barra superior: fecha y botón de reserva */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                onClick={() => {
                  let nuevaFecha = fecha.subtract(1, 'day');
                  // Saltar sábado y domingo al retroceder
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
                onChange={setFecha}
                format="DD/MM/YYYY"
                style={{ width: 200 }}
                disabledDate={(current) => {
                  const day = current.day();
                  return day === 0 || day === 6;
                }}
                classNames={{ popup: { root: "hide-weekends" } }} 
              />

              <Button
                onClick={() => {
                  let nuevaFecha = fecha.add(1, 'day');
                  // Saltar sábado y domingo al avanzar
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
                disabled={fecha.isSame(dayjs(), 'day')}
              >
                Hoy
              </Button>
            </div>

            <Button
              type="default"
              style={{
                borderColor: '#014898',
                color: '#014898',
                fontWeight: 500,
              }}
              onClick={() => navigate('/reservas/nueva')}
            >
              Reservar cancha
            </Button>
          </div>

          {/* 🔹 Filtros de búsqueda */}
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
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Input
                  placeholder="Buscar por nombre de cancha"
                  prefix={<SearchOutlined />}
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                  style={{ flex: '1 1 300px', minWidth: 200 }}
                  allowClear
                />
                
                <Select
                  placeholder="Filtrar por capacidad"
                  value={filtroCapacidad}
                  onChange={setFiltroCapacidad}
                  style={{ flex: '1 1 250px', minWidth: 200 }}
                  options={opcionesCapacidad}
                  allowClear
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              </div>

              {filtrosActivos && (
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#e6f7ff', 
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#0958d9'
                }}>
                  📊 Mostrando {disponibilidadFiltrada.length} de {disponibilidad.length} canchas
                </div>
              )}
            </Space>
          </Card>

          {/* 🔹 Resultados */}
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
                    <p style={{ 
                      marginBottom: '1rem', 
                      color: '#666',
                      fontSize: 14 
                    }}>
                      {c.cancha.descripcion}
                    </p>
                  )}
                  <Table
                    columns={columns}
                    dataSource={c.bloques.map((b, j) => ({
                      key: j,
                      bloque: `${b.horaInicio} - ${b.horaFin}`,
                      disponible: b.disponible,
                      motivo: b.motivo,
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
      </div>
    </ConfigProvider>
  );
}