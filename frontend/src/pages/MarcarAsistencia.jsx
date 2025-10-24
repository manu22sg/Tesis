import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Typography,
  Spin,
  Pagination,
} from 'antd';
import {
  CalendarOutlined,
  FieldTimeOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined, // ✅ AGREGAR si usas la columna Estado
  QuestionCircleOutlined
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { obtenerSesionesEstudiante } from '../services/sesion.services.js';
import { marcarAsistenciaPorToken } from '../services/asistencia.services.js';

const { Title, Text } = Typography;

export default function MarcarAsistencia() {
  const { usuario } = useAuth();
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [token, setToken] = useState('');
  const [selectedSesion, setSelectedSesion] = useState(null);
  const [marcando, setMarcando] = useState(false);

  // 🔹 Cargar sesiones del estudiante
  const cargarSesiones = async (page = 1, limit = 5) => {
    try {
      setLoading(true);
      const { sesiones, pagination } = await obtenerSesionesEstudiante({ page, limit });
      setSesiones(sesiones);
      setPagination({
        current: pagination.currentPage,
        pageSize: pagination.itemsPerPage,
        total: pagination.totalItems,
      });
    } catch (error) {
      console.error('Error cargando sesiones:', error);
      message.error('No se pudieron cargar tus sesiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSesiones();
  }, []);

  // 🔸 Abrir modal para marcar asistencia
  const abrirModal = (sesion) => {
    setSelectedSesion(sesion);
    setModalVisible(true);
    setToken('');
  };

  // ✅ Marcar asistencia con token (CORREGIDO)
  const handleMarcarAsistencia = async () => {
    if (!token) {
      message.error('Debes ingresar el código de asistencia');
      return;
    }

    try {
      setMarcando(true);
      
      // ✅ Ahora enviamos el token en el body
      await marcarAsistenciaPorToken({
        token: token.trim().toUpperCase(),
        estado: 'presente',
        origen: 'jugador',
      });

      message.success('¡Asistencia registrada correctamente!');
      setModalVisible(false);
      setToken('');
      
      // Recargar sesiones para actualizar el estado
      await cargarSesiones(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error marcando asistencia:', error);
      const msg = error.response?.data?.message || 'Error al registrar asistencia';
      message.error(msg);
    } finally {
      setMarcando(false);
    }
  };

  // 🔹 Columnas de la tabla
  const columns = [
  {
    title: 'Fecha',
    dataIndex: 'fecha',
    key: 'fecha',
    render: (fecha) => {
      const [year, month, day] = fecha.split('-');
      const fechaLocal = new Date(year, month - 1, day);
      
      return (
        <Space>
          <CalendarOutlined /> 
          {fechaLocal.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </Space>
      );
    },
  },
  {
    title: 'Horario',
    key: 'horario',
    render: (_, record) => (
      <Space>
        <FieldTimeOutlined /> {record.horaInicio} - {record.horaFin}
      </Space>
    ),
  },
  {
    title: 'Cancha',
    dataIndex: 'cancha',
    key: 'cancha',
  },
  {
    title: 'Tipo de Sesión',
    dataIndex: 'tipoSesion',
    key: 'tipoSesion',
    render: (tipo) => <Tag color="blue">{tipo || 'Entrenamiento'}</Tag>,
  },
  {
  title: 'Estado',
  key: 'estado',
  render: (_, record) => {
    if (!record.asistenciaMarcada) {
      return <Tag color="default">Sin registrar</Tag>;
    }

    const estados = {
      presente: { color: 'success', icon: <CheckCircleOutlined />, text: 'Presente' },
      ausente: { color: 'error', icon: <CloseCircleOutlined />, text: 'Ausente' },
      justificado: { color: 'warning', icon: <QuestionCircleOutlined />, text: 'Justificado' }
    };

    const config = estados[record.estadoAsistencia] || estados.presente;

    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  },
},
 
  {
    title: 'Acción',
    key: 'accion',
    render: (_, record) => {
      // ✅ Si ya marcó asistencia, mostrar tag
      if (record.asistenciaMarcada) {
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Asistencia Registrada
          </Tag>
        );
      }


      // ✅ Si no ha marcado, mostrar botón (deshabilitado si token inactivo)
      return (
        <Button
          type="primary"
          disabled={!record.tokenActivo}
          onClick={() => abrirModal(record)}
        >
          Marcar Asistencia
        </Button>
      );
    },
  },
];

  return (
    <MainLayout>
      <Card
        title={
          <Title level={3} style={{ margin: 0 }}>
            Marcar Asistencia
          </Title>
        }
        style={{ borderRadius: 12 }}
      >
        <Text type="secondary">
          Aquí puedes ver tus sesiones y marcar asistencia con el código entregado por tu entrenador.
        </Text>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={sesiones.map((s) => ({ ...s, key: s.id }))}
              pagination={false}
              style={{ marginTop: 20 }}
            />

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page, pageSize) => cargarSesiones(page, pageSize)}
                showTotal={(total) => `Total: ${total} sesiones`}
              />
            </div>
          </>
        )}

        {/* Modal de ingreso de token */}
        <Modal
          title={
            <span>
              <KeyOutlined /> Ingresar Código de Asistencia
            </span>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setToken('');
          }}
          onOk={handleMarcarAsistencia}
          okText="Confirmar Asistencia"
          confirmLoading={marcando}
          okButtonProps={{ disabled: !token }}
        >
          <p>
            <strong>Sesión:</strong> {selectedSesion?.tipoSesion} —{' '}
            {selectedSesion?.cancha?.nombre}
          </p>
          <Input
            prefix={<KeyOutlined />}
            placeholder="Ej: ABC123"
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            onPressEnter={handleMarcarAsistencia}
            maxLength={20}
            autoFocus
          />
          <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
            Ingresa el código proporcionado por tu entrenador
          </Text>
        </Modal>
      </Card>
    </MainLayout>
  );
}