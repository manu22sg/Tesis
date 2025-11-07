import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Row,
  Col,
  Alert,
  Divider,
  Breadcrumb
} from 'antd';
import {
  TrophyOutlined,
  EditOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import MainLayout, { useCampeonatoActivo } from '../components/MainLayout';
import { campeonatoService } from '../services/campeonato.services';

const { Option } = Select;

// Componente interno que usa el hook
function CampeonatoInfoContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCampeonatoActivo } = useCampeonatoActivo();
  
  const [campeonato, setCampeonato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    cargarCampeonato();
  }, [id]);

  const cargarCampeonato = async () => {
    setLoading(true);
    try {
      const data = await campeonatoService.obtener(id);
      setCampeonato(data);
      
      // Actualizar el campeonato activo en el sidebar
      setCampeonatoActivo({
        id: data.id,
        nombre: data.nombre
      });
    } catch (error) {
      message.error('Error al cargar información del campeonato');
      navigate('/campeonatos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalEditar = () => {
    form.setFieldsValue({
      nombre: campeonato.nombre,
      formato: campeonato.formato,
      genero: campeonato.genero,
      anio: campeonato.anio,
      semestre: campeonato.semestre,
      estado: campeonato.estado
    });
    setModalVisible(true);
  };

  const handleActualizar = async (values) => {
    setLoading(true);
    try {
      await campeonatoService.actualizar(id, values);
      message.success('Campeonato actualizado exitosamente');
      setModalVisible(false);
      cargarCampeonato();
    } catch (error) {
      message.error('Error al actualizar campeonato');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      creado: 'blue',
      en_juego: 'green',
      finalizado: 'gold',
      cancelado: 'red'
    };
    return colors[estado] || 'default';
  };

  const formatEstadoTexto = (estado) => {
    const map = {
      'creado': 'Creado',
      'en_juego': 'En Juego',
      'finalizado': 'Finalizado',
      'cancelado': 'Cancelado'
    };
    // Devuelve el texto formateado, o el original si no se encuentra
    return map[estado] || estado;
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      creado: <InfoCircleOutlined />,
      en_juego: <FireOutlined />,
      finalizado: <CheckCircleOutlined />,
      cancelado: <ClockCircleOutlined />
    };
    return icons[estado] || <InfoCircleOutlined />;
  };

  if (!campeonato) {
    return <Card loading={true}>Cargando información del campeonato...</Card>;
  }

  return (
    <>
      {/* Header con Título y Estadísticas */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/campeonatos')}
              >
                Volver
              </Button>
              <TrophyOutlined style={{ fontSize: 28, color: '#faad14' }} />
              <div>
                <h2 style={{ margin: 0 }}>{campeonato.nombre}</h2>
                <Space size="small" style={{ marginTop: 8 }}>
                  <Tag color={getEstadoColor(campeonato.estado)} icon={getEstadoIcon(campeonato.estado)}>
              {formatEstadoTexto(campeonato.estado)} 
            </Tag>
                  <Tag color="purple">{campeonato.formato}</Tag>
                  <Tag color={
                    campeonato.genero === 'masculino' ? 'blue' :
                    campeonato.genero === 'femenino' ? 'pink' : 'orange'
                  }>
                    {campeonato.genero.charAt(0).toUpperCase() + campeonato.genero.slice(1)}
                  </Tag>
                </Space>
              </div>
            </Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={abrirModalEditar}
              disabled={campeonato.estado === 'finalizado'}
            >
              Editar
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Estadísticas compactas */}
        <Row gutter={24}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                <TeamOutlined style={{ marginRight: 8 }} />
                {campeonato.equipos?.length || 0}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>Equipos</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {campeonato.partidos?.length || 0}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>Partidos</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                <CheckCircleOutlined style={{ marginRight: 8 }} />
                {campeonato.partidos?.filter(p => p.estado === 'finalizado').length || 0}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>Finalizados</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                {campeonato.partidos?.filter(p => p.estado === 'pendiente').length || 0}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>Pendientes</div>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        {/* Botones de acción prominentes */}
        <Space size="middle" wrap style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            type="default"
            size="large"
            icon={<TeamOutlined />}
            onClick={() => navigate(`/campeonatos/${id}/equipos`)}
          >
            Ver Equipos
          </Button>
          <Button
            type="default"
            size="large"
            icon={<CalendarOutlined />}
            onClick={() => navigate(`/campeonatos/${id}/fixture`)}
          >
            Ver Fixture
          </Button>
          <Button
            type="default"
            size="large"
            icon={<BarChartOutlined />}
            onClick={() => navigate(`/campeonatos/${id}/tabla`)}
          >
            Ver Tabla
          </Button>
        </Space>
      </Card>

      {/* Información Detallada */}
      <Card title={<><InfoCircleOutlined /> Información del Campeonato</>}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Nombre" span={2}>
            <strong>{campeonato.nombre}</strong>
          </Descriptions.Item>
          
          <Descriptions.Item label="Formato">
            <Tag color="purple" style={{ fontSize: 14 }}>{campeonato.formato}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Género">
            <Tag 
              color={
                campeonato.genero === 'masculino' ? 'blue' :
                campeonato.genero === 'femenino' ? 'pink' : 'orange'
              }
              style={{ fontSize: 14 }}
            >
              {campeonato.genero.charAt(0).toUpperCase() + campeonato.genero.slice(1)}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Año">
            {campeonato.anio}
          </Descriptions.Item>
          
          <Descriptions.Item label="Semestre">
            Semestre {campeonato.semestre}
          </Descriptions.Item>
          
          <Descriptions.Item label="Estado">
            <Tag color={getEstadoColor(campeonato.estado)} icon={getEstadoIcon(campeonato.estado)}>
              {formatEstadoTexto(campeonato.estado)} 
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Total Equipos">
            <Space>
              <TeamOutlined />
              <strong>{campeonato.equipos?.length || 0}</strong>
            </Space>
          </Descriptions.Item>
          
       
        </Descriptions>

        <Divider />

        {/* Alertas según estado */}
        {campeonato.estado === 'creado' && (
          <Alert
            message="Campeonato en Preparación"
            description="Este campeonato está en fase de preparación. Puedes agregar equipos y configurar el fixture."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {campeonato.estado === 'en_juego' && (
          <Alert
            message="Campeonato en Curso"
            description="Este campeonato está activo. Los partidos están siendo jugados."
            type="success"
            showIcon
            icon={<FireOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {campeonato.estado === 'finalizado' && (
          <Alert
            message="Campeonato Finalizado"
            description="Este campeonato ha concluido. Consulta la tabla de posiciones para ver el campeón."
            type="warning"
            showIcon
            icon={<TrophyOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}
      </Card>

      {/* Modal Editar */}
      <Modal
        title={<><EditOutlined /> Editar Campeonato</>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleActualizar}
        >
          <Form.Item
            name="nombre"
            label="Nombre del Campeonato"
            rules={[{ required: true, message: 'Campo obligatorio' }]}
          >
            <Input placeholder="Ej: Copa Primavera" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="formato" label="Formato" rules={[{ required: true }]}>
                <Select placeholder="Seleccionar formato">
                  <Option value="5v5">5v5</Option>
                  <Option value="7v7">7v7</Option>
                  <Option value="11v11">11v11</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="genero" label="Género" rules={[{ required: true }]}>
                <Select placeholder="Seleccionar género">
                  <Option value="masculino">Masculino</Option>
                  <Option value="femenino">Femenino</Option>
                  <Option value="mixto">Mixto</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="anio" label="Año" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={2020} max={2100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="semestre" label="Semestre" rules={[{ required: true }]}>
                <Select>
                  <Option value={1}>Semestre 1</Option>
                  <Option value={2}>Semestre 2</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="estado" label="Estado" rules={[{ required: true }]}>
            <Select>
              <Option value="creado">Creado</Option>
              <Option value="en_juego">En Juego</Option>
              <Option value="finalizado">Finalizado</Option>
              <Option value="cancelado">Cancelado</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Guardar Cambios
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// Componente wrapper con MainLayout
export default function CampeonatoInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campeonato, setCampeonato] = useState(null);

  useEffect(() => {
    const cargarNombre = async () => {
      try {
        const data = await campeonatoService.obtener(id);
        setCampeonato(data);
      } catch (error) {
        // Silencioso, el componente interno manejará el error
      }
    };
    cargarNombre();
  }, [id]);

  const breadcrumb = (
    <Breadcrumb
      items={[
        {
          title: <a onClick={() => navigate('/campeonatos')}>Campeonatos</a>
        },
        {
          title: campeonato?.nombre || 'Cargando...'
        },
        {
          title: 'Información'
        }
      ]}
    />
  );

  return (
    <MainLayout breadcrumb={breadcrumb}>
      <CampeonatoInfoContent />
    </MainLayout>
  );
}