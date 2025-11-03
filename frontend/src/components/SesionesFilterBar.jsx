import React, { memo } from 'react';
import { Input, Button, DatePicker, TimePicker, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const SesionesFilterBar = memo(({ filtros, setFiltros }) => {
  const limpiar = () => setFiltros({ q: '', fecha: null, horario: null });

  return (
    <Space wrap style={{ marginBottom: 16 }}>
      <Input
        placeholder="Buscar..."
        value={filtros.q}
        onChange={(e) => setFiltros(f => ({ ...f, q: e.target.value }))}
        prefix={<SearchOutlined />}
        allowClear
        style={{ width: 240 }}
      />
      <DatePicker
        placeholder="Fecha"
        value={filtros.fecha}
        onChange={(v) => setFiltros(f => ({ ...f, fecha: v }))}
        format="DD/MM/YYYY"
      />
      <TimePicker.RangePicker
        placeholder={['Inicio', 'Fin']}
        value={filtros.horario}
        onChange={(v) => setFiltros(f => ({ ...f, horario: v }))}
        format="HH:mm"
        minuteStep={30}
        hideDisabledOptions
      />
      {(filtros.q || filtros.fecha || filtros.horario) && (
        <Button onClick={limpiar}>Limpiar</Button>
      )}
    </Space>
  );
});

export default SesionesFilterBar;
