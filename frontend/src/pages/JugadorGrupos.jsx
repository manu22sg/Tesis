import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  App,
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
import MainLayout from '../components/MainLayout.jsx';
const { Title, Text } = Typography;
const { Option } = Select;

export default function JugadorGrupos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp(); 

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
    setJugador(jugadorData);

    const gruposData = await obtenerGrupos({ limit: 100 });
    
    // CORRECCIÓN: Acceder correctamente a la estructura anidada
    const todosLosGrupos = gruposData?.data?.grupos || gruposData?.grupos || [];
   
    
    // Filtrar grupos a los que NO pertenece el jugador
    const gruposIds = (jugadorData.jugadorGrupos || []).map(jg => jg.grupo?.id).filter(Boolean);
    
    const disponibles = Array.isArray(todosLosGrupos) 
      ? todosLosGrupos.filter(g => g && g.id && !gruposIds.includes(g.id))
      : [];
    
 
    
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
      message.warning('Seleccione un grupo');
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
          <TeamOutlined style={{ fontSize: 18, color: '#014898' }} />
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
    <MainLayout>
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
            <UserOutlined style={{ fontSize: 32, color: '#014898' }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {jugador.usuario?.nombre || 'Jugador'}
              </Title>
              <Text type="secondary">
                {jugador.usuario?.rut} • {jugador.posicion || 'Sin posición'} • {jugador.usuario?.carrera?.nombre}
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
          <Text strong>Seleccione un grupo:</Text>
          <Select
  value={grupoSeleccionado}
  onChange={setGrupoSeleccionado}
  placeholder="Seleccione un grupo"
  style={{ width: '100%', marginTop: 8 }}
  size="large"
  showSearch
  filterOption={(input, option) => {
    const grupo = gruposDisponibles.find(g => g.id === option.value);
    if (!grupo) return false;
    const searchText = input.toLowerCase();
    return (
      grupo.nombre?.toLowerCase().includes(searchText) ||
      grupo.descripcion?.toLowerCase().includes(searchText) ||
      grupo.categoria?.toLowerCase().includes(searchText)
    );
  }}
>
  {gruposDisponibles.map(grupo => (
    <Option key={grupo.id} value={grupo.id}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TeamOutlined />
        <span>{grupo.nombre}</span>
        {grupo.categoria && (
          <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5',
  marginLeft: 'auto'
}}>
  {grupo.categoria}
</span>
        )}
      </div>
    </Option>
  ))}
</Select>
        </div>
      </Modal>
    </div>
    </MainLayout>
  );
}