import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Input,
  DatePicker,
  Space,
  App,
  Empty,
  Button,
  ConfigProvider
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  MedicineBoxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useAuth } from '../context/AuthContext.jsx';
import { obtenerMisLesiones } from '../services/lesion.services.js';
import MainLayout from '../components/MainLayout.jsx';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
dayjs.locale('es');

const { RangePicker } = DatePicker;

export default function MisLesiones() {
  const { usuario } = useAuth();
  const jugadorId = usuario?.jugadorId;
  const { message } = App.useApp(); 

  const [lesiones, setLesiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [rangoFechas, setRangoFechas] = useState(null);

  useEffect(() => {
    cargarMisLesiones();
  }, [rangoFechas]);

  const cargarMisLesiones = async () => {
    setLoading(true);
    try {
      const params = {};
      if (rangoFechas) {
        params.desde = rangoFechas[0].format('YYYY-MM-DD');
        params.hasta = rangoFechas[1].format('YYYY-MM-DD');
      }

      const response = await obtenerMisLesiones(params);
      const data = response.data.lesiones || [];
      setLesiones(data);
    } catch (error) {
      console.error('Error cargando mis lesiones:', error);
      message.error(error.message || 'Error al cargar tus lesiones');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setRangoFechas(null);
  };

  const lesionesFiltradas = lesiones.filter(l => {
    if (!busqueda) return true;
    const search = busqueda.toLowerCase();
    return l.diagnostico?.toLowerCase().includes(search);
  });

  const columns = [
    {
      title: 'Diagnóstico',
      dataIndex: 'diagnostico',
      key: 'diagnostico',
      render: (texto) => texto || '—',
    },
    {
      title: 'Fecha Inicio',
      dataIndex: 'fechaInicio',
      key: 'fechaInicio',
      render: (fecha) => formatearFecha(fecha) || '—',
      align: 'center',
      width: 130,
    },
    {
      title: 'Alta Estimada',
      dataIndex: 'fechaAltaEstimada',
      key: 'fechaAltaEstimada',
      render: (fecha) => fecha ? formatearFecha(fecha) || '—' : '—',
      align: 'center',
      width: 130,
    },
    {
      title: 'Alta Real',
      dataIndex: 'fechaAltaReal',
      key: 'fechaAltaReal',
      render: (fecha) => fecha ? formatearFecha(fecha) || '—' : '—',
      align: 'center',
      width: 130,
    },
    {
      title: 'Estado',
      key: 'estado',
      align: 'center',
      width: 120,
      render: (_, record) =>
        record.fechaAltaReal ? (
          <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px'
}}>
  <CheckCircleOutlined />
  Recuperado
</span>
        ) : (
         <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px'
}}>
  <ClockCircleOutlined />
  Activa
</span>
        ),
    },
  ];

  const hayFiltrosActivos = busqueda || rangoFechas;

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MedicineBoxOutlined style={{ fontSize: 24 }} />
                <span>Mis Lesiones</span>
              </div>
            }
          >
            {/* Filtros */}
           <div
  style={{
    marginBottom: 12,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,              
  }}
>
  <Input
    allowClear
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value)}
    prefix={<SearchOutlined />}
    placeholder="Buscar por diagnóstico..."
    style={{ width: 260 }}   
    size="middle"
  />

  <RangePicker
    value={rangoFechas}
    onChange={setRangoFechas}
    format="DD/MM/YYYY"
    placeholder={['Fecha inicio', 'Fecha fin']}
    style={{ width: 260 }}   
    size="middle"
  />

  {hayFiltrosActivos && (
    <Button onClick={limpiarFiltros} size="middle">
      Limpiar filtros
    </Button>
  )}
</div>
            {/* Tabla */}
            <Table
              columns={columns}
              dataSource={lesionesFiltradas}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="middle"
              locale={{
                emptyText: (
                  <Empty
                    description={
                      hayFiltrosActivos
                        ? 'No se encontraron lesiones con los filtros aplicados'
                        : 'No tienes lesiones registradas'
                    }
                  />
                ),
              }}
            />
          </Card>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}
