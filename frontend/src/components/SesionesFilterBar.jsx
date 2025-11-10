import React, { memo, useState, useEffect } from 'react';
import { Row, Col, Input, Button, DatePicker, TimePicker, Select, message, Card } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';

import { obtenerCanchas } from '../services/cancha.services'; 
import { obtenerGrupos } from '../services/grupo.services';

const { Option } = Select;

const SesionesFilterBar = memo(({ filtros, setFiltros }) => {
  const [canchas, setCanchas] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarListas = async () => {
      setLoading(true);
      try {
        const [dataCanchas, dataGrupos] = await Promise.all([
          obtenerCanchas({ estado: 'disponible', limit: 100 }), 
          obtenerGrupos({ limit: 100 })                       
        ]);
        
        setCanchas(dataCanchas.canchas || []);
        const gruposArray = dataGrupos.data?.grupos || dataGrupos.grupos || dataGrupos || [];
        setGrupos(gruposArray);

      } catch (error) {
        console.error("Error al cargar listas de filtros", error);
        message.error('Error al cargar filtros');
      } finally {
        setLoading(false);
      }
    };
    cargarListas();
  }, []);

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const limpiar = () => setFiltros({
    q: '',
    fecha: null,
    horario: null,
    canchaId: null,
    grupoId: null
  });

  const hayFiltros = filtros.q || filtros.fecha || filtros.horario || filtros.canchaId || filtros.grupoId;

  const filterOption = (input, option) =>
    (option?.children ?? '').toLowerCase().includes(input.toLowerCase());

  return (
    <Card
      title={<span><FilterOutlined /> Filtros</span>}
      style={{ marginBottom: 24, backgroundColor: '#fafafa' }}
      extra={hayFiltros && <Button onClick={limpiar}>Limpiar Filtros</Button>}
    >
      <Row gutter={[16, 16]} align="middle">
        
        {/* Búsqueda general - incluye ubicacionExterna */}
        <Col xs={24} md={8}>
          <Input
            placeholder="Buscar por tipo, grupo, cancha o ubicación..."
            prefix={<SearchOutlined />}
            value={filtros.q}
            onChange={(e) => handleFiltroChange('q', e.target.value)}
            allowClear
            size="medium"
          />
        </Col>

        {/* Fecha */}
        <Col xs={24} sm={8} md={4}>
          <DatePicker
            placeholder="Fecha"
            value={filtros.fecha}
            onChange={(v) => handleFiltroChange('fecha', v)}
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            size="medium"
          />
        </Col>
        
        {/* Horario con rango limitado 08:00 - 22:00 */}
        <Col xs={24} sm={8} md={6}>
          <TimePicker.RangePicker
            placeholder={['Inicio', 'Fin']}
            value={filtros.horario}
            onChange={(v) => handleFiltroChange('horario', v)}
            format="HH:mm"
            minuteStep={30}
            disabledTime={() => ({
              disabledHours: () => [0,1,2,3,4,5,6,7,22,23],
            })}
            hideDisabledOptions
            style={{ width: '100%' }}
            size="medium"
          />
        </Col>

        {/* Cancha */}
        <Col xs={24} sm={12} md={3}>
          <Select
            placeholder="Cancha"
            value={filtros.canchaId}
            onChange={(v) => handleFiltroChange('canchaId', v)}
            allowClear
            loading={loading}
            style={{ width: '100%' }}
            showSearch
            filterOption={filterOption}
            size="medium"
          >
            {canchas.map(c => <Option key={c.id} value={c.id}>{c.nombre}</Option>)}
          </Select>
        </Col>

        {/* Grupo */}
        <Col xs={24} sm={12} md={3}>
          <Select
            placeholder="Grupo"
            value={filtros.grupoId}
            onChange={(v) => handleFiltroChange('grupoId', v)}
            allowClear
            loading={loading}
            style={{ width: '100%' }}
            showSearch
            filterOption={filterOption}
            size="medium"
          >
            {grupos.map(g => <Option key={g.id} value={g.id}>{g.nombre}</Option>)}
          </Select>
        </Col>
      </Row>
    </Card>
  );
});

export default SesionesFilterBar;