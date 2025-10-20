import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Popconfirm,
  Typography,
  Tag,
  Empty,
  Spin
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  obtenerGrupos,
  crearGrupo,
  actualizarGrupo,
  eliminarGrupo
} from '../services/grupo.services.js';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Grupos() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      setLoading(true);
      const data = await obtenerGrupos();
      // El backend retorna un array directamente
      setGrupos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando grupos:', error);
      message.error('Error al cargar los grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoGrupo = () => {
    setEditando(false);
    setGrupoEditando(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditarGrupo = (grupo) => {
    setEditando(true);
    setGrupoEditando(grupo);
    form.setFieldsValue({
      nombre: grupo.nombre,
      descripcion: grupo.descripcion
    });
    setModalVisible(true);
  };

  const handleGuardarGrupo = async () => {
    try {
      const valores = await form.validateFields();
      setGuardando(true);

      if (editando && grupoEditando) {
        await actualizarGrupo(grupoEditando.id, valores);
        message.success('Grupo actualizado correctamente');
      } else {
        await crearGrupo(valores);
        message.success('Grupo creado correctamente');
      }

      setModalVisible(false);
      form.resetFields();
      cargarGrupos();
    } catch (error) {
      if (error.errorFields) {
        // Error de validación del formulario
        return;
      }
      console.error('Error guardando grupo:', error);
      message.error(
        error.response?.data?.message || 
        `Error al ${editando ? 'actualizar' : 'crear'} el grupo`
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarGrupo = async (id) => {
    try {
      await eliminarGrupo(id);
      message.success('Grupo eliminado correctamente');
      cargarGrupos();
    } catch (error) {
      console.error('Error eliminando grupo:', error);
      message.error(
        error.response?.data?.message || 
        'Error al eliminar el grupo'
      );
    }
  };

  const handleVerMiembros = (grupoId) => {
    navigate(`/grupos/${grupoId}/miembros`);
  };

  const columns = [
    {
      title: 'Grupo',
      key: 'grupo',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TeamOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 15 }}>
              {record.nombre}
            </div>
            {record.descripcion && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {record.descripcion}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Miembros',
      key: 'miembros',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserOutlined style={{ color: '#52c41a' }} />
          <Text strong>{record.jugadorGrupos?.length || 0}</Text>
        </div>
      ),
      width: 120,
      align: 'center',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleVerMiembros(record.id)}
          >
            Ver Miembros
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditarGrupo(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar grupo?"
            description="Esta acción no se puede deshacer. Los jugadores no se eliminarán."
            onConfirm={() => handleEliminarGrupo(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 320,
      align: 'center',
    },
  ];

  return (
    <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>
              Gestión de Grupos
            </Title>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleNuevoGrupo}
          >
            Nuevo Grupo
          </Button>
        </div>

        {/* Tabla */}
        <Table
          columns={columns}
          dataSource={grupos}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} grupos`,
          }}
          locale={{
            emptyText: (
              <Empty description="No hay grupos creados">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleNuevoGrupo}
                >
                  Crear Primer Grupo
                </Button>
              </Empty>
            ),
          }}
        />

        {/* Resumen */}
        {grupos.length > 0 && (
          <div style={{
            marginTop: 24,
            padding: 16,
            background: '#f5f5f5',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Total de Grupos</Text>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {grupos.length}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Total de Miembros</Text>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {grupos.reduce((acc, g) => acc + (g.jugadorGrupos?.length || 0), 0)}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Crear/Editar */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamOutlined />
            <span>{editando ? 'Editar Grupo' : 'Nuevo Grupo'}</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setModalVisible(false);
              form.resetFields();
            }}
          >
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={guardando}
            onClick={handleGuardarGrupo}
          >
            {editando ? 'Actualizar' : 'Crear'}
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Nombre del Grupo"
            name="nombre"
            rules={[
              { required: true, message: 'El nombre es requerido' },
              { max: 50, message: 'Máximo 50 caracteres' }
            ]}
          >
            <Input
              placeholder="Ej: Equipo A, Sub-20, Varones, etc."
              size="large"
              prefix={<TeamOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Descripción"
            name="descripcion"
            rules={[
              { max: 255, message: 'Máximo 255 caracteres' }
            ]}
          >
            <TextArea
              placeholder="Descripción opcional del grupo"
              rows={4}
              showCount
              maxLength={255}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}