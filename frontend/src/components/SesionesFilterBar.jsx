import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import { Row, Col, Input, Button, DatePicker, TimePicker, Select, App, Card } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { obtenerCanchas } from '../services/cancha.services';
import { obtenerGrupos } from '../services/grupo.services';

const { Option } = Select;

const SesionesFilterBar = memo(({ filtros, setFiltros }) => {
  const [canchas, setCanchas] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp(); 

  // estado local para debounce de q
  const [busqueda, setBusqueda] = useState(filtros.q || '');
  const mountedRef = useRef(true);
  const debounceRef = useRef(null);

  // sync si filtros.q cambia desde afuera
  useEffect(() => {
    setBusqueda(filtros.q || '');
  }, [filtros.q]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const cargarListas = async () => {
      setLoading(true);
      try {
        const [dataCanchas, dataGrupos] = await Promise.all([
          obtenerCanchas({ estado: 'disponible', limit: 100 }),
          obtenerGrupos({ limit: 100 }),
        ]);
        if (!mountedRef.current) return;

        setCanchas(dataCanchas?.canchas || []);
        const gruposArray = dataGrupos?.data?.grupos || dataGrupos?.grupos || dataGrupos || [];
        setGrupos(Array.isArray(gruposArray) ? gruposArray : []);
      } catch (error) {
        console.error('Error al cargar listas de filtros', error);
        message.error('Error al cargar filtros');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    cargarListas();
  }, []);

  // Debounce para q
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setFiltros(prev => ({ ...prev, q: busqueda.trim() }));
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busqueda, setFiltros]);

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const limpiar = () => {
    setBusqueda('');
    setFiltros({
      q: '',
      fecha: null,
      horario: null,
      canchaId: null,
      grupoId: null,
      tipoSesion: null,
    });
  };

  const hayFiltros = !!(
    filtros.q || 
    filtros.fecha || 
    filtros.horario || 
    filtros.canchaId || 
    filtros.grupoId || 
    filtros.tipoSesion
  );

  const filterOption = (input, option) => {
    const text =
      (option?.label ?? option?.children ?? '').toString().toLowerCase();
    return text.includes((input || '').toLowerCase());
  };

  // Opciones memoizadas para evitar renders innecesarios
  const canchaOptions = useMemo(
    () =>
      canchas.map(c => (
        <Option key={c.id} value={c.id}>
          {c.nombre}
        </Option>
      )),
    [canchas]
  );

  const grupoOptions = useMemo(
    () =>
      grupos.map(g => (
        <Option key={g.id} value={g.id}>
          {g.nombre}
        </Option>
      )),
    [grupos]
  );

  return (
    <Card
      title={
        <span>
          <FilterOutlined /> Filtros
        </span>
      }
      style={{ marginBottom: 24, backgroundColor: '#f5f5f5' }}
      extra={hayFiltros && <Button onClick={limpiar}>Limpiar Filtros</Button>}
    >
      <Row gutter={[16, 16]} align="middle">
        {/* Búsqueda general con debounce */}
        <Col xs={24} md={6}>
          <Input
            placeholder="Buscar por grupo o lugar..."
            prefix={<SearchOutlined />}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            allowClear
            size="middle"
          />
        </Col>

        {/* Tipo de Sesión */}
        <Col xs={24} sm={8} md={4}>
          <Select
            placeholder="Tipo de Sesión"
            value={filtros.tipoSesion}
            onChange={(v) => handleFiltroChange('tipoSesion', v)}
            allowClear
            style={{ width: '100%' }}
            size="middle"
          >
            <Option value="Entrenamiento">Entrenamiento</Option>
            <Option value="Partido">Partido</Option>

            <Option value="Partido Amistoso">Partido Amistoso</Option>
            <Option value="Charla Técnica">Charla Técnica</Option>
          </Select>
        </Col>

        {/* Fecha */}
        <Col xs={24} sm={8} md={3}>
          <DatePicker
            placeholder="Fecha"
            value={filtros.fecha}
            onChange={(v) => handleFiltroChange('fecha', v)}
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            size="middle"
          />
        </Col>

        {/* Horario 08:00 - 22:00 */}
        <Col xs={24} sm={8} md={4}>
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
            size="middle"
          />
        </Col>

        {/* Cancha */}
        <Col xs={24} sm={12} md={4}>
          <Select
            placeholder="Cancha"
            value={filtros.canchaId}
            onChange={(v) => handleFiltroChange('canchaId', v)}
            allowClear
            loading={loading}
            style={{ width: '100%' }}
            showSearch
            filterOption={filterOption}
            size="middle"
          >
            {canchaOptions}
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
            size="middle"
          >
            {grupoOptions}
          </Select>
        </Col>
      </Row>
    </Card>
  );
});

export default SesionesFilterBar;