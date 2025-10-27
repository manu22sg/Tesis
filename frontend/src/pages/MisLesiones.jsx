import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Input,
  DatePicker,
  Space,
  message,
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

dayjs.locale('es');

const { RangePicker } = DatePicker;

export default function MisLesiones() {
  const { usuario } = useAuth();
  const jugadorId = usuario?.jugadorId;

  const [lesiones, setLesiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [rangoFechas, setRangoFechas] = useState(null);
  const [estadisticas, setEstadisticas] = useState({ activas: 0, recuperadas: 0, total: 0 });

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
      calcularEstadisticas(data);
    } catch (error) {
      console.error('Error cargando mis lesiones:', error);
      message.error(error.message || 'Error al cargar tus lesiones');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (data) => {
    const activas = data.filter(l => !l.fechaAltaReal).length;
    const recuperadas = data.filter(l => l.fechaAltaReal).length;
    setEstadisticas({ activas, recuperadas, total: data.length });
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
      render: (fecha) => dayjs(fecha).format('DD/MM/YYYY'),
      width: 130,
      align: 'center',
    },
    {
      title: 'Alta Estimada',
      dataIndex: 'fechaAltaEstimada',
      key: 'fechaAltaEstimada',
      render: (fecha) => fecha ? dayjs(fecha).format('DD/MM/YYYY') : '—',
      width: 130,
      align: 'center',
    },
    {
      title: 'Alta Real',
      dataIndex: 'fechaAltaReal',
      key: 'fechaAltaReal',
      render: (fecha) => fecha ? dayjs(fecha).format('DD/MM/YYYY') : '—',
      width: 130,
      align: 'center',
    },
    {
      title: 'Estado',
      key: 'estado',
      align: 'center',
      render: (_, record) =>
        record.fechaAltaReal ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Recuperado
          </Tag>
        ) : (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            Activa
          </Tag>
        ),
      width: 130,
    },
  ];

  const hayFiltrosActivos = busqueda || rangoFechas;

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24 }}>
          <Card>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Lesiones Activas"
                  value={estadisticas.activas}
                  prefix={<MedicineBoxOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Recuperadas"
                  value={estadisticas.recuperadas}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Total"
                  value={estadisticas.total}
                  prefix={<MedicineBoxOutlined />}
                />
              </Col>
            </Row>

            {/* Filtros */}
            <div
              style={{
                marginBottom: 16,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <Input
                allowClear
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                prefix={<SearchOutlined />}
                placeholder="Buscar por diagnóstico..."
              />

              <RangePicker
                value={rangoFechas}
                onChange={setRangoFechas}
                format="DD/MM/YYYY"
                placeholder={['Fecha inicio', 'Fecha fin']}
                style={{ width: '100%' }}
              />

              {hayFiltrosActivos && (
                <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
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
