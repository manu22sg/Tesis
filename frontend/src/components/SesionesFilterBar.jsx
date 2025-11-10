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

  // Carga las listas para los Selects cuando el componente se monta
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
  }, []); // El array vacío asegura que se ejecute solo una vez

  // Función genérica para actualizar cualquier filtro
  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  // Función de limpiar actualizada
  const limpiar = () => setFiltros({
    q: '',
    fecha: null,
    horario: null,
    canchaId: null,
    grupoId: null
  });

  // Comprueba si hay algún filtro aplicado
  const hayFiltros = filtros.q || filtros.fecha || filtros.horario || filtros.canchaId || filtros.grupoId;

  // Función para el filtro de búsqueda (case-insensitive)
  const filterOption = (input, option) =>
    (option?.children ?? '').toLowerCase().includes(input.toLowerCase());

  return (
    <Card
      title={<span><FilterOutlined /> Filtros</span>}
      style={{ marginBottom: 24, backgroundColor: '#fafafa' }}
      extra={hayFiltros && <Button onClick={limpiar}>Limpiar Filtros</Button>}
    >
      <Row gutter={[16, 16]} align="middle">
        
        {/* --- NUEVOS SELECTS --- */}
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Todas las canchas"
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

        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Todos los grupos"
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

        {/* --- FILTROS EXISTENTES --- */}
        <Col xs={24} sm={12} md={6}>
          <DatePicker
            placeholder="Seleccionar fecha"
            value={filtros.fecha}
            onChange={(v) => handleFiltroChange('fecha', v)}
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            size="medium"
          />
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <TimePicker.RangePicker
            placeholder={['Inicio', 'Fin']}
            value={filtros.horario}
            onChange={(v) => handleFiltroChange('horario', v)}
            format="HH:mm"
            minuteStep={30}
            hideDisabledOptions
            style={{ width: '100%' }}
            size="medium"
          />
        </Col>
      </Row>
    </Card>
  );
});

export default SesionesFilterBar;