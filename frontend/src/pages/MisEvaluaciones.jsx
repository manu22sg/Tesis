import { useEffect, useState } from 'react';
import { Table, Button, message, Card, Pagination, DatePicker, Select, Space, Tag, Statistic, Row, Col, ConfigProvider } from 'antd';
import { ReloadOutlined, TrophyOutlined, LineChartOutlined } from '@ant-design/icons';
import { obtenerMisEvaluaciones } from '../services/evaluacion.services.js';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout.jsx';
import dayjs from 'dayjs';
import locale from 'antd/locale/es_ES';
import { formatearFecha, formatearHora } from '../utils/formatters.js';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function MisEvaluaciones() {
  const { usuario } = useAuth();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filtros, setFiltros] = useState({
    desde: null,
    hasta: null,
    sesionId: null
  });

  // Estadísticas calculadas
  const [promedios, setPromedios] = useState({
    tecnica: 0,
    tactica: 0,
    actitudinal: 0,
    fisica: 0,
    general: 0
  });

  const calcularPromedios = (evals) => {
    if (!evals || evals.length === 0) {
      setPromedios({ tecnica: 0, tactica: 0, actitudinal: 0, fisica: 0, general: 0 });
      return;
    }

    const total = evals.length;
    const sumas = evals.reduce((acc, ev) => {
      acc.tecnica += ev.tecnica || 0;
      acc.tactica += ev.tactica || 0;
      acc.actitudinal += ev.actitudinal || 0;
      acc.fisica += ev.fisica || 0;
      return acc;
    }, { tecnica: 0, tactica: 0, actitudinal: 0, fisica: 0 });

    const promediosCalc = {
      tecnica: (sumas.tecnica / total).toFixed(1),
      tactica: (sumas.tactica / total).toFixed(1),
      actitudinal: (sumas.actitudinal / total).toFixed(1),
      fisica: (sumas.fisica / total).toFixed(1),
    };

    promediosCalc.general = (
      (parseFloat(promediosCalc.tecnica) +
       parseFloat(promediosCalc.tactica) +
       parseFloat(promediosCalc.actitudinal) +
       parseFloat(promediosCalc.fisica)) / 4
    ).toFixed(1);

    setPromedios(promediosCalc);
  };

  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = { 
        page: page,
        limit: limit
      };
      
      if (filtros.desde) params.desde = filtros.desde.format('YYYY-MM-DD');
      if (filtros.hasta) params.hasta = filtros.hasta.format('YYYY-MM-DD');
      if (filtros.sesionId) params.sesionId = filtros.sesionId;

      const res = await obtenerMisEvaluaciones(params);
      
      const evalData = res.evaluaciones || [];
      const paginationData = res.pagination || {};
      
      setEvaluaciones(evalData);
      setPagination({
        current: page,
        pageSize: limit,
        total: paginationData.totalItems || 0
      });
      calcularPromedios(evalData);
    } catch (err) {
      message.error('Error cargando tus evaluaciones');
      console.error('Error completo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(1, pagination.pageSize); 
  }, [filtros]);

  const limpiarFiltros = () => {
    setFiltros({
      desde: null,
      hasta: null,
      sesionId: null
    });
    message.success('Filtros limpiados'); 
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
    fetchData(page, pageSize);
  };

  const hayFiltrosActivos = filtros.desde || filtros.hasta || filtros.sesionId;

  const getColorNota = (nota) => {
    if (nota >= 9) return '#52c41a';
    if (nota >= 7) return '#1890ff';
    if (nota >= 5) return '#faad14';
    return '#ff4d4f';
  };

  const columns = [
    {
      title: 'Fecha Sesión',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.sesion?.fecha ? formatearFecha(record.sesion.fecha) : '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {formatearHora(record.sesion?.horaInicio) || '—'} - {formatearHora(record.sesion?.horaFin) || '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Técnica',
      dataIndex: 'tecnica',
      key: 'tecnica',
      align: 'center',
      render: (nota) => (
        <Tag color={getColorNota(nota)} style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {nota || 0}
        </Tag>
      ),
    },
    {
      title: 'Táctica',
      dataIndex: 'tactica',
      key: 'tactica',
      align: 'center',
      render: (nota) => (
        <Tag color={getColorNota(nota)} style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {nota || 0}
        </Tag>
      ),
    },
    {
      title: 'Actitudinal',
      dataIndex: 'actitudinal',
      key: 'actitudinal',
      align: 'center',
      render: (nota) => (
        <Tag color={getColorNota(nota)} style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {nota || 0}
        </Tag>
      ),
    },
    {
      title: 'Física',
      dataIndex: 'fisica',
      key: 'fisica',
      align: 'center',
      render: (nota) => (
        <Tag color={getColorNota(nota)} style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {nota || 0}
        </Tag>
      ),
    },
    {
      title: 'Promedio',
      key: 'promedio',
      align: 'center',
      render: (_, record) => {
        const prom = ((record.tecnica + record.tactica + record.actitudinal + record.fisica) / 4).toFixed(1);
        return (
          <Tag color={getColorNota(parseFloat(prom))} style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {prom}
          </Tag>
        );
      },
    },
    {
      title: 'Observaciones',
      dataIndex: 'observaciones',
      key: 'observaciones',
      render: (obs) => obs || '—',
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'fechaRegistro',
      key: 'fechaRegistro',
      render: (fecha) => fecha ? dayjs(fecha).format('DD/MM/YYYY HH:mm') : '—',
    },
  ];

  return (
    <ConfigProvider locale={locale}>
      <MainLayout>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
            Mis Evaluaciones
          </h1>
          <p style={{ color: '#666' }}>
            Aquí puedes ver todas tus evaluaciones de rendimiento en las sesiones de entrenamiento.
          </p>
        </div>

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card>
              <Statistic
                title="Técnica"
                value={promedios.tecnica}
                precision={1}
                suffix="/ 10"
                valueStyle={{ color: getColorNota(parseFloat(promedios.tecnica)) }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card>
              <Statistic
                title="Táctica"
                value={promedios.tactica}
                precision={1}
                suffix="/ 10"
                valueStyle={{ color: getColorNota(parseFloat(promedios.tactica)) }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card>
              <Statistic
                title="Actitudinal"
                value={promedios.actitudinal}
                precision={1}
                suffix="/ 10"
                valueStyle={{ color: getColorNota(parseFloat(promedios.actitudinal)) }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card>
              <Statistic
                title="Física"
                value={promedios.fisica}
                precision={1}
                suffix="/ 10"
                valueStyle={{ color: getColorNota(parseFloat(promedios.fisica)) }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={24} md={12} lg={8}>
            <Card>
              <Statistic
                title="Promedio General"
                value={promedios.general}
                precision={1}
                suffix="/ 10"
               
                valueStyle={{ 
                  color: getColorNota(parseFloat(promedios.general)),
                  fontSize: '28px'
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                Basado en {evaluaciones.length} evaluación(es)
              </div>
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <RangePicker
            format="DD/MM/YYYY"
            placeholder={['Desde', 'Hasta']}
            value={filtros.desde && filtros.hasta ? [filtros.desde, filtros.hasta] : null}
            onChange={(dates) => {
              if (dates) {
                setFiltros({ ...filtros, desde: dates[0], hasta: dates[1] });
              } else {
                setFiltros({ ...filtros, desde: null, hasta: null });
              }
            }}
            style={{ minWidth: '280px' }}
          />
          
          {hayFiltrosActivos && (
            <Button onClick={limpiarFiltros}>Limpiar Filtros</Button>
          )}
        </div>

        <Card
          title={
            <span>
              <LineChartOutlined /> Historial de Evaluaciones ({pagination.total})
            </span>
          }
          extra={
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchData(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Actualizar
            </Button>
          }
        >
          <Table
            dataSource={evaluaciones}
            columns={columns}
            loading={loading}
            pagination={false}
            rowKey="id"
            scroll={{ x: 1000 }}
            locale={{
              emptyText: 'No tienes evaluaciones registradas aún'
            }}
          />
          
          {evaluaciones.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                onShowSizeChange={handlePageChange}
                showSizeChanger
                showTotal={(total) => `Total: ${total} evaluaciones`}
                pageSizeOptions={['5', '10', '20', '50']}
              />
            </div>
          )}
        </Card>
      </MainLayout>
    </ConfigProvider>
  );
}