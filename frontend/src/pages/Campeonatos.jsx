import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Tag,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Badge,
  Empty,
  ConfigProvider,
  Pagination
} from 'antd';
import locale from 'antd/locale/es_ES';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { campeonatoService } from '../services/campeonato.services.js';
import { useAuth } from '../context/AuthContext.jsx';
import MainLayout, { useCampeonatoActivo } from '../components/MainLayout.jsx';

const { Option } = Select;

// 🔥 Componente interno que usa el hook
function CampeonatosContent() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  
  // ✅ Ahora el hook está dentro del Provider
  const { setCampeonatoActivo } = useCampeonatoActivo();
  
  const [campeonatos, setCampeonatos] = useState([]);
  const [campeonatosOriginales, setCampeonatosOriginales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  // Estado para los filtros
  const [filtros, setFiltros] = useState({
    formato: null,
    genero: null,
    anio: null,
    semestre: null,
    estado: null
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const cargarCampeonatos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await campeonatoService.listar();
      setCampeonatos(data);
      setCampeonatosOriginales(data);
      setPagination({
        current: 1,
        pageSize: 10,
        total: data.length || 0
      });
    } catch (error) {
      message.error('Error al cargar campeonatos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCampeonatos();
  }, [cargarCampeonatos]);

  // Aplicar filtros combinados
  const aplicarFiltros = useCallback(() => {
    let resultado = [...campeonatosOriginales];

    if (filtros.formato) {
      resultado = resultado.filter(c => c.formato === filtros.formato);
    }
    if (filtros.genero) {
      resultado = resultado.filter(c => c.genero === filtros.genero);
    }
    if (filtros.anio) {
      resultado = resultado.filter(c => c.anio === filtros.anio);
    }
    if (filtros.semestre) {
      resultado = resultado.filter(c => c.semestre === filtros.semestre);
    }
    if (filtros.estado) {
      resultado = resultado.filter(c => c.estado === filtros.estado);
    }

    setCampeonatos(resultado);
    setPagination({
      current: 1,
      pageSize: pagination.pageSize,
      total: resultado.length
    });
  }, [filtros, campeonatosOriginales, pagination.pageSize]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      formato: null,
      genero: null,
      anio: null,
      semestre: null,
      estado: null
    });
    setCampeonatos(campeonatosOriginales);
    setPagination({
      current: 1,
      pageSize: pagination.pageSize,
      total: campeonatosOriginales.length
    });
  };

  // Obtener años únicos de los campeonatos
  const aniosDisponibles = useMemo(() => {
    const anios = [...new Set(campeonatosOriginales.map(c => c.anio))];
    return anios.sort((a, b) => b - a);
  }, [campeonatosOriginales]);

  const abrirModal = (registro = null) => {
    if (registro) {
      setEditingId(registro.id);
      form.setFieldsValue({
        nombre: registro.nombre,
        formato: registro.formato,
        genero: registro.genero,
        anio: registro.anio,
        semestre: registro.semestre,
        estado: registro.estado
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({
        anio: new Date().getFullYear(),
        semestre: Math.ceil((new Date().getMonth() + 1) / 6)
      });
    }
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingId) {
        await campeonatoService.actualizar(editingId, values);
        message.success('Campeonato actualizado exitosamente');
      } else {
        const payload = {
          ...values,
          entrenadorId: usuario?.id || usuario?.usuarioId
        };
        await campeonatoService.crear(payload);
        message.success('Campeonato creado exitosamente');
      }
      cerrarModal();
      cargarCampeonatos();
    } catch {
      message.error('Error al guardar campeonato');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await campeonatoService.eliminar(id);
      message.success('Campeonato eliminado');
      cargarCampeonatos();
    } catch {
      message.error('Error al eliminar');
    }
  };

  // 🌟 Nueva función: Ir a detalle y establecer como activo
  const verDetalle = async (campeonato) => {
    // Establecer campeonato como activo en el sidebar
    setCampeonatoActivo({
      id: campeonato.id,
      nombre: campeonato.nombre
    });
    
    // Navegar a la página de información del campeonato
    navigate(`/campeonatos/${campeonato.id}/info`);
  };

  

  const getEstadoColor = (estado) => {
    const colors = {
      creado: 'blue',
      en_juego: 'green',
      finalizado: 'default',
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

  const columns = useMemo(() => [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre) => <strong>{nombre}</strong>
    },
    {
      title: 'Formato',
      dataIndex: 'formato',
      render: (formato) => <Tag color="purple">{formato}</Tag>
    },
    {
      title: 'Género',
      dataIndex: 'genero',
      render: (genero) => (
        <Tag color={genero === 'masculino' ? 'blue' : genero === 'femenino' ? 'pink' : 'orange'}>
          {genero.charAt(0).toUpperCase() + genero.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Año/Semestre',
      render: (_, record) => `${record.anio} - S${record.semestre}`
    },
   {
  title: 'Estado',
  dataIndex: 'estado',
  render: (estado) => (
    <Tag color={getEstadoColor(estado)}>
      {formatEstadoTexto(estado)}
    </Tag>
  )
},
    {
      title: 'Equipos',
      render: (_, record) => (
        <Badge count={record.equipos?.length || 0} showZero color="blue">
          <TeamOutlined />
        </Badge>
      )
    },
    {
      title: 'Partidos',
      render: (_, record) => (
        <Badge count={record.partidos?.length || 0} showZero color="green">
          <CalendarOutlined />
        </Badge>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalle">
            <Button type="text" icon={<EyeOutlined />} onClick={() => verDetalle(record)} />
          </Tooltip>
          <Tooltip title="Editar">
            <Button type="text" icon={<EditOutlined />} onClick={() => abrirModal(record)} />
          </Tooltip>
        
          
          <Popconfirm
            title="¿Eliminar campeonato?"
            onConfirm={() => handleEliminar(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Eliminar">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ], []);

  return (
    <ConfigProvider locale={locale}>
      <Card title={<><TrophyOutlined /> Gestión de Campeonatos</>} variant="filled">
        {/* Filtros y acciones */}
        <Card style={{ marginBottom: '1rem', backgroundColor: '#fafafa' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Space wrap>
                <Select
                  style={{ width: 120 }}
                  placeholder="Formato"
                  allowClear
                  value={filtros.formato}
                  onChange={(value) => handleFiltroChange('formato', value)}
                >
                  <Option value="5v5">5v5</Option>
                  <Option value="7v7">7v7</Option>
                  <Option value="11v11">11v11</Option>
                </Select>

                <Select
                  style={{ width: 130 }}
                  placeholder="Género"
                  allowClear
                  value={filtros.genero}
                  onChange={(value) => handleFiltroChange('genero', value)}
                >
                  <Option value="masculino">Masculino</Option>
                  <Option value="femenino">Femenino</Option>
                  <Option value="mixto">Mixto</Option>
                </Select>

                <Select
                  style={{ width: 100 }}
                  placeholder="Año"
                  allowClear
                  value={filtros.anio}
                  onChange={(value) => handleFiltroChange('anio', value)}
                >
                  {aniosDisponibles.map(anio => (
                    <Option key={anio} value={anio}>{anio}</Option>
                  ))}
                </Select>

                <Select
                  style={{ width: 110 }}
                  placeholder="Semestre"
                  allowClear
                  value={filtros.semestre}
                  onChange={(value) => handleFiltroChange('semestre', value)}
                >
                  <Option value={1}>Semestre 1</Option>
                  <Option value={2}>Semestre 2</Option>
                </Select>

                <Select
                  style={{ width: 130 }}
                  placeholder="Estado"
                  allowClear
                  value={filtros.estado}
                  onChange={(value) => handleFiltroChange('estado', value)}
                >
                  <Option value="creado">Creado</Option>
                  <Option value="en_juego">En Juego</Option>
                  <Option value="finalizado">Finalizado</Option>
                  <Option value="cancelado">Cancelado</Option>
                </Select>

                <Button 
                  icon={<ClearOutlined />} 
                  onClick={limpiarFiltros}
                  disabled={!Object.values(filtros).some(v => v !== null)}
                >
                  Limpiar
                </Button>
              </Space>
            </Col>
            <Col>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
                Nuevo Campeonato
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Tabla principal */}
        <Card>
          <Table
            columns={columns}
            dataSource={campeonatos}
            loading={loading}
            rowKey="id"
            pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} campeonatos`,
            pageSizeOptions: ['5', '10', '20'],
            onChange: (page, size) => {
              setPagination({ ...pagination, current: page, pageSize: size });
            },
            position: ['bottomLeft'] // Para que quede centrado como lo tenías
          }}
            scroll={{ x: 1000 }}
            size="middle"
            locale={{ emptyText: <Empty description="No hay campeonatos" /> }}
          />

         
        </Card>

        {/* Modal Crear/Editar */}
        <Modal
          title={editingId ? 'Editar Campeonato' : 'Nuevo Campeonato'}
          open={modalVisible}
          onCancel={cerrarModal}
          footer={null}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
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

            <Form.Item style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={cerrarModal}>Cancelar</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingId ? 'Guardar Cambios' : 'Crear Campeonato'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </ConfigProvider>
  );
}

// 🎯 Componente principal que envuelve con MainLayout
export default function Campeonatos() {
  return (
    <MainLayout>
      <CampeonatosContent />
    </MainLayout>
  );
}