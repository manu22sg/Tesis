import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Empty,
  Modal,
  Select,
  Popconfirm,
  Typography,
  Spin,
  Alert
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import {
  obtenerJugadorPorId,
  asignarJugadorAGrupo,
  removerJugadorDeGrupo
} from '../services/jugador.services.js';
import { obtenerGrupos } from '../services/grupo.services.js';

const { Title, Text } = Typography;
const { Option } = Select;

export default function JugadorGrupos() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [jugador, setJugador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gruposDisponibles, setGruposDisponibles] = useState([]);
  
  const [modalAgregar, setModalAgregar] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
  try {
    setLoading(true);
    
    const jugadorData = await obtenerJugadorPorId(parseInt(id));
  //  console.log('Jugador cargado:', jugadorData);
  //  console.log('Grupos del jugador:', jugadorData.jugadorGrupos);
    setJugador(jugadorData);

    const gruposData = await obtenerGrupos({ limit: 100 });
  //  console.log('Respuesta completa de grupos:', gruposData);

// Obtener el array de grupos correctamente
const todosLosGrupos = gruposData.grupos || gruposData || [];
//console.log('Array de grupos procesado:', todosLosGrupos);

// Filtrar grupos a los que NO pertenece el jugador
const gruposIds = (jugadorData.jugadorGrupos || []).map(jg => jg.grupo?.id).filter(Boolean);
//console.log('IDs de grupos a excluir:', gruposIds);

const disponibles = Array.isArray(todosLosGrupos) 
  ? todosLosGrupos.filter(g => g && g.id && !gruposIds.includes(g.id))
  : [];

//console.log('Grupos disponibles finales:', disponibles);
setGruposDisponibles(disponibles);
  } catch (error) {
    console.error('Error cargando datos:', error);
    message.error('Error al cargar los datos');
  } finally {
    setLoading(false);
  }
};

  const handleAgregarGrupo = async () => {
    if (!grupoSeleccionado) {
      message.warning('Selecciona un grupo');
      return;
    }

    try {
      setAgregando(true);
      await asignarJugadorAGrupo(parseInt(id), grupoSeleccionado);
      message.success('Jugador agregado al grupo correctamente');
      setModalAgregar(false);
      setGrupoSeleccionado(null);
      cargarDatos();
    } catch (error) {
      console.error('Error agregando al grupo:', error);
      message.error(error.response?.data?.message || 'Error al agregar al grupo');
    } finally {
      setAgregando(false);
    }
  };

  const handleRemoverGrupo = async (grupoId) => {
    try {
      await removerJugadorDeGrupo(parseInt(id), grupoId);
      message.success('Jugador removido del grupo correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error removiendo del grupo:', error);
      message.error(error.response?.data?.message || 'Error al remover del grupo');
    }
  };

  const columns = [
    {
      title: 'Grupo',
      key: 'grupo',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamOutlined style={{ fontSize: 18, color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.grupo?.nombre || 'Sin nombre'}
            </div>
            {record.grupo?.descripcion && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.grupo.descripcion}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Categoría',
      dataIndex: ['grupo', 'categoria'],
      key: 'categoria',
      render: (categoria) => (
        <Tag color="blue">{categoria || '—'}</Tag>
      ),
      width: 150,
    },
    {
      title: 'Estado',
      dataIndex: ['grupo', 'estado'],
      key: 'estado',
      render: (estado) => (
        <Tag color={estado === 'activo' ? 'success' : 'default'}>
          {estado?.toUpperCase() || 'N/A'}
        </Tag>
      ),
      width: 100,
      align: 'center',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Popconfirm
          title="¿Remover del grupo?"
          description="El jugador ya no pertenecerá a este grupo"
          onConfirm={() => handleRemoverGrupo(record.grupo?.id)}
          okText="Sí, remover"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            Remover
          </Button>
        </Popconfirm>
      ),
      width: 120,
      align: 'center',
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!jugador) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="Jugador no encontrado">
          <Button type="primary" onClick={() => navigate('/jugadores')}>
            Volver a Jugadores
          </Button>
        </Empty>
      </div>
    );
  }

  const gruposActuales = jugador.jugadorGrupos || [];

  return (
    <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card>
        {/* Header con info del jugador */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UserOutlined style={{ fontSize: 32, color: '#1890ff' }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {jugador.usuario?.nombre || 'Jugador'}
              </Title>
              <Text type="secondary">
                {jugador.usuario?.rut} • {jugador.posicion || 'Sin posición'} • {jugador.carrera}
              </Text>
            </div>
          </div>
          
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/jugadores')}
            >
              Volver
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalAgregar(true)}
              disabled={gruposDisponibles.length === 0}
            >
              Agregar a Grupo
            </Button>
          </Space>
        </div>

        {/* Alert si no hay grupos disponibles */}
        {gruposDisponibles.length === 0 && gruposActuales.length > 0 && (
          <Alert
            message="Información"
            description="El jugador ya está en todos los grupos disponibles"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Tabla de grupos */}
        <Table
          columns={columns}
          dataSource={gruposActuales}
          rowKey={(record) => record.grupo?.id || record.id}
          pagination={false}
          locale={{
            emptyText: (
              <Empty description="El jugador no pertenece a ningún grupo">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalAgregar(true)}
                  disabled={gruposDisponibles.length === 0}
                >
                  Agregar a un Grupo
                </Button>
              </Empty>
            ),
          }}
        />

        {/* Resumen */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#f5f5f5',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <Text strong style={{ fontSize: 16 }}>
            Total de grupos: {gruposActuales.length}
          </Text>
        </div>
      </Card>

      {/* Modal Agregar a Grupo */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamOutlined />
            <span>Agregar a Grupo</span>
          </div>
        }
        open={modalAgregar}
        onCancel={() => {
          setModalAgregar(false);
          setGrupoSeleccionado(null);
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setModalAgregar(false);
              setGrupoSeleccionado(null);
            }}
          >
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={agregando}
            onClick={handleAgregarGrupo}
            disabled={!grupoSeleccionado}
          >
            Agregar
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Jugador: </Text>
          <Text>{jugador.usuario?.nombre}</Text>
        </div>

        <div>
          <Text strong>Selecciona un grupo:</Text>
          <Select
            value={grupoSeleccionado}
            onChange={setGrupoSeleccionado}
            placeholder="Selecciona un grupo"
            style={{ width: '100%', marginTop: 8 }}
            size="large"
            showSearch
            optionFilterProp="children"
          >
            {gruposDisponibles.map(grupo => (
              <Option key={grupo.id} value={grupo.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamOutlined />
                  <span>{grupo.nombre}</span>
                  {grupo.categoria && (
                    <Tag color="blue" style={{ marginLeft: 'auto' }}>
                      {grupo.categoria}
                    </Tag>
                  )}
                </div>
              </Option>
            ))}
          </Select>

          {gruposDisponibles.length === 0 && (
            <Alert
              message="No hay grupos disponibles"
              description="El jugador ya está en todos los grupos existentes"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}