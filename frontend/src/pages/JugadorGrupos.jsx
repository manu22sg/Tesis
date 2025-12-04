import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Table,
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

// Constantes
const LIMITE_GRUPOS = 100;
const ESTILOS = {
  iconoGrande: { fontSize: 32, color: '#014898' },
  iconoMedio: { fontSize: 18, color: '#014898' },
  contenedorPrincipal: { padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' },
  headerFlex: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16
  },
  resumen: {
    marginTop: 24,
    padding: 16,
    background: '#f5f5f5',
    borderRadius: 8,
    textAlign: 'center'
  },
  tagCategoria: {
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid #B9BBBB',
    backgroundColor: '#f5f5f5',
    marginLeft: 'auto'
  }
};

// Componente para el header del jugador
const JugadorHeader = ({ jugador, onVolver, onAgregar, deshabilitado }) => (
  <div style={ESTILOS.headerFlex}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <UserOutlined style={ESTILOS.iconoGrande} />
      <div>
        <Title level={4} style={{ margin: 0 }}>
          {jugador.usuario?.nombre || 'Jugador'} {jugador.usuario?.apellido || ''}
        </Title>
        <Text type="secondary">
          {jugador.usuario?.rut} • {jugador.posicion || 'Sin posición'} • {jugador.usuario?.carrera?.nombre}
        </Text>
      </div>
    </div>
    
    <Space>
      <Button 
        icon={<ArrowLeftOutlined />}
        onClick={onVolver}
        aria-label="Volver a lista de jugadores"
      >
        Volver
      </Button>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onAgregar}
        disabled={deshabilitado}
        aria-label="Agregar jugador a un grupo"
      >
        Agregar a Grupo
      </Button>
    </Space>
  </div>
);

// Componente para el modal de agregar
const ModalAgregarGrupo = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  jugador,
  gruposDisponibles,
  grupoSeleccionado,
  setGrupoSeleccionado,
  cargando 
}) => (
  <Modal
    title={
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TeamOutlined />
        <span>Agregar a Grupo</span>
      </div>
    }
    open={visible}
    onCancel={onCancel}
    footer={[
      <Button key="cancel" onClick={onCancel}>
        Cancelar
      </Button>,
      <Button
        key="submit"
        type="primary"
        loading={cargando}
        onClick={onSubmit}
        disabled={!grupoSeleccionado}
      >
        Agregar
      </Button>,
    ]}
  >
    <div style={{ marginBottom: 16 }}>
      <Text strong>Jugador: </Text>
      <Text>{jugador.usuario?.nombre} {jugador.usuario?.apellido}</Text>
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
                <span style={ESTILOS.tagCategoria}>
                  {grupo.categoria}
                </span>
              )}
            </div>
          </Option>
        ))}
      </Select>
    </div>
  </Modal>
);

// Hook personalizado para la lógica del componente
const useJugadorGrupos = (id) => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  
  const [jugador, setJugador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gruposDisponibles, setGruposDisponibles] = useState([]);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [agregando, setAgregando] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [jugadorData, gruposData] = await Promise.all([
        obtenerJugadorPorId(parseInt(id)),
        obtenerGrupos({ limit: LIMITE_GRUPOS })
      ]);
      
      setJugador(jugadorData);

      // Obtener todos los grupos
      const todosLosGrupos = gruposData?.data?.grupos || gruposData?.grupos || [];
      
      // Filtrar grupos a los que NO pertenece el jugador
      const gruposIds = (jugadorData.jugadorGrupos || [])
        .map(jg => jg.grupo?.id)
        .filter(Boolean);
      
      const disponibles = Array.isArray(todosLosGrupos) 
        ? todosLosGrupos.filter(g => g?.id && !gruposIds.includes(g.id))
        : [];
      
      setGruposDisponibles(disponibles);
    } catch (error) {
      console.error('Error cargando datos:', error);
      message.error('Error al cargar los datos del jugador');
      
      // Si el jugador no existe, volver a la lista
      if (error.response?.status === 404) {
        navigate('/jugadores');
      }
    } finally {
      setLoading(false);
    }
  }, [id, message, navigate]);

  const handleAgregarGrupo = useCallback(async () => {
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
  }, [grupoSeleccionado, id, message, cargarDatos]);

  const handleRemoverGrupo = useCallback(async (grupoId) => {
    try {
      await removerJugadorDeGrupo(parseInt(id), grupoId);
      message.success('Jugador removido del grupo correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error removiendo del grupo:', error);
      message.error(error.response?.data?.message || 'Error al remover del grupo');
    }
  }, [id, message, cargarDatos]);

  const cerrarModal = useCallback(() => {
    setModalAgregar(false);
    setGrupoSeleccionado(null);
  }, []);

  return {
    jugador,
    loading,
    gruposDisponibles,
    modalAgregar,
    setModalAgregar,
    grupoSeleccionado,
    setGrupoSeleccionado,
    agregando,
    cargarDatos,
    handleAgregarGrupo,
    handleRemoverGrupo,
    cerrarModal
  };
};

// Componente principal
export default function JugadorGrupos() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    jugador,
    loading,
    gruposDisponibles,
    modalAgregar,
    setModalAgregar,
    grupoSeleccionado,
    setGrupoSeleccionado,
    agregando,
    cargarDatos,
    handleAgregarGrupo,
    handleRemoverGrupo,
    cerrarModal
  } = useJugadorGrupos(id);

  useEffect(() => {
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      navigate('/jugadores');
      return;
    }
    cargarDatos();
  }, [id, navigate, cargarDatos]);

  // Memoizar grupos actuales
  const gruposActuales = useMemo(
    () => jugador?.jugadorGrupos || [], 
    [jugador]
  );

  // Definir columnas de la tabla
  const columns = useMemo(() => [
    {
      title: 'Grupo',
      key: 'grupo',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamOutlined style={ESTILOS.iconoMedio} />
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
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            aria-label={`Remover de ${record.grupo?.nombre}`}
          >
            Remover
          </Button>
        </Popconfirm>
      ),
      width: 120,
      align: 'center',
    },
  ], [handleRemoverGrupo]);

  // Estado de carga
  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', paddingTop: 120 }}>
          <Spin size="large" tip="Cargando información del jugador..." />
        </div>
      </MainLayout>
    );
  }

  // Jugador no encontrado
  if (!jugador) {
    return (
      <MainLayout>
        <div style={{ padding: 24 }}>
          <Empty description="Jugador no encontrado">
            <Button type="primary" onClick={() => navigate('/jugadores')}>
              Volver a Jugadores
            </Button>
          </Empty>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={ESTILOS.contenedorPrincipal}>
        <Card>
          {/* Header con info del jugador */}
          <JugadorHeader
            jugador={jugador}
            onVolver={() => navigate('/jugadores')}
            onAgregar={() => setModalAgregar(true)}
            deshabilitado={gruposDisponibles.length === 0}
          />

          {/* Alerta si ya está en todos los grupos */}
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
          <div style={ESTILOS.resumen}>
            <Text strong style={{ fontSize: 16 }}>
              Total de grupos: {gruposActuales.length}
            </Text>
          </div>
        </Card>

        {/* Modal Agregar a Grupo */}
        <ModalAgregarGrupo
          visible={modalAgregar}
          onCancel={cerrarModal}
          onSubmit={handleAgregarGrupo}
          jugador={jugador}
          gruposDisponibles={gruposDisponibles}
          grupoSeleccionado={grupoSeleccionado}
          setGrupoSeleccionado={setGrupoSeleccionado}
          cargando={agregando}
        />
      </div>
    </MainLayout>
  );
}