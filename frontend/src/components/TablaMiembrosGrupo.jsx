import { useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Empty,
  Typography,
  Input,
  Select,
  Row,
  Col,
  Pagination,
  Tooltip,
  Popconfirm,
  Avatar
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

export default function TablaMiembrosGrupo({
  miembros = [],
  miembrosFiltrados = [],
  miembrosPaginados = [],
  busqueda = '',
  filtroEstado = 'todos',
  filtroCarrera = 'todos',
  carrerasUnicas = [],
  pagination = { current: 1, pageSize: 10, total: 0 },
  onBusquedaChange,
  onFiltroEstadoChange,
  onFiltroCarreraChange,
  onPageChange,
  onVerDetalle,
  onRemoverMiembro,
  onAgregarMiembro
}) {
  const columnsMiembros = useMemo(() => [
    {
      title: 'Jugador',
      key: 'jugador',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#014898' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.nombre || 'Sin nombre'}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.rut || 'Sin RUT'}
            </Text>
          </div>
        </div>
      ),
      width: 240,
    },
    {
      title: 'Carrera',
      dataIndex: 'carrera',
      key: 'carrera',
      render: (carrera) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid #B9BBBB',
          backgroundColor: '#f5f5f5'
        }}>
          {carrera || '—'}
        </span>
      ),
    },
    {
      title: 'Año Ingreso',
      dataIndex: 'anioIngreso',
      key: 'anioIngreso',
      align: 'center',
      width: 120,
      render: (v) => v || '—',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      align: 'center',
      width: 110,
      render: (estado) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid #B9BBBB',
          backgroundColor: '#f5f5f5'
        }}>
          {(estado || '—').toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      width: 170,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver Perfil">
            <Button
              type="primary"
              size="middle"
              icon={<UserOutlined />}
              onClick={() => onVerDetalle(record.id)}
            />
          </Tooltip>
          <Tooltip title="Remover del Grupo">
            <Popconfirm
              title="¿Remover del grupo?"
              description="El jugador ya no pertenecerá a este grupo"
              onConfirm={() => onRemoverMiembro(record.id)}
              okText="Sí, remover"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button danger size="middle" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ], [onVerDetalle, onRemoverMiembro]);

  return (
    <>
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

      <Card>
        <Table
          columns={columnsMiembros}
          dataSource={miembrosPaginados}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: (
              <Empty description="No hay miembros en este grupo">
                <Button type="primary" icon={<PlusOutlined />} onClick={onAgregarMiembro}>
                  Agregar Miembros
                </Button>
              </Empty>
            ),
          }}
        />
        {pagination.total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={onPageChange}
              onShowSizeChange={onPageChange}
              showSizeChanger
              showTotal={(total) => `Total: ${total} miembros`}
              pageSizeOptions={['5', '10', '20', '50']}
            />
          </div>
        )}
      </Card>
    </>
  );
}