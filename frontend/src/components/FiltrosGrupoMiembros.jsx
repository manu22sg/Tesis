import { Card, Input, Select, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

export default function FiltrosGrupoMiembros({ 
  busqueda, 
  onBusquedaChange,
  filtroEstado,
  onFiltroEstadoChange,
  filtroCarrera,
  onFiltroCarreraChange,
  carrerasUnicas 
}) {
  return (
    <Card style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Buscar por nombre, RUT, email o carrera..."
            prefix={<SearchOutlined />}
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            value={filtroEstado}
            onChange={onFiltroEstadoChange}
            style={{ width: '100%' }}
            placeholder="Filtrar por estado"
          >
            <Option value="todos">Todos los estados</Option>
            <Option value="activo">Activos</Option>
            <Option value="inactivo">Inactivos</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            value={filtroCarrera}
            onChange={onFiltroCarreraChange}
            style={{ width: '100%' }}
            placeholder="Filtrar por carrera"
          >
            <Option value="todos">Todas las carreras</Option>
            {carrerasUnicas.map(carrera => (
              <Option key={carrera} value={carrera}>
                {carrera}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
    </Card>
  );
}