import React, { useState, useEffect } from 'react';
import {
  Card, Button, Table, Modal, Form, Input, Select, Space, message,
  Popconfirm, Tag, Descriptions, Empty, Drawer, InputNumber, Divider,
  List, Avatar, Badge, Tooltip, Row, Col, AutoComplete
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined,
  UserAddOutlined, UserDeleteOutlined, EyeOutlined, TrophyOutlined,
  NumberOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import { equipoService } from '../services/equipo.services.js';
import { buscarUsuarios } from '../services/auth.services.js';

const { Option } = Select;

const EquipoManager = ({ campeonatoId, campeonatoInfo, onUpdate }) => {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalJugadorVisible, setModalJugadorVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [jugadoresEquipo, setJugadoresEquipo] = useState([]);
  const [form] = Form.useForm();
  const [formJugador] = Form.useForm();
  
  // Estados para el autocomplete de jugadores
  const [opcionesAutoComplete, setOpcionesAutoComplete] = useState([]);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  useEffect(() => {
    if (campeonatoId) {
      cargarEquipos();
    }
  }, [campeonatoId]);

  const cargarEquipos = async () => {
    setLoading(true);
    try {
      const data = await equipoService.listarPorCampeonato(campeonatoId);
      setEquipos(data);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (equipo = null) => {
    if (equipo) {
      setEditingId(equipo.id);
      form.setFieldsValue({
        nombre: equipo.nombre,
        carrera: equipo.carrera,
        tipo: equipo.tipo
      });
    } else {
      setEditingId(null);
      form.resetFields();
      // Preseleccionar el tipo según el género del campeonato
      if (campeonatoInfo?.genero) {
        form.setFieldsValue({ tipo: campeonatoInfo.genero });
      }
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
        await equipoService.actualizar(editingId, values);
        message.success('Equipo actualizado exitosamente');
      } else {
        await equipoService.crear({
          ...values,
          campeonatoId
        });
        message.success('Equipo creado exitosamente');
      }
      cerrarModal();
      cargarEquipos();
      if (onUpdate) onUpdate();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al guardar equipo');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    setLoading(true);
    try {
      await equipoService.eliminar(id);
      message.success('Equipo eliminado exitosamente');
      cargarEquipos();
      if (onUpdate) onUpdate();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al eliminar equipo');
    } finally {
      setLoading(false);
    }
  };

  const verJugadores = async (equipo) => {
    setLoading(true);
    setEquipoSeleccionado(equipo);
    try {
      const response = await equipoService.listarJugadores(equipo.id);
      // El backend devuelve { success: true, data: { equipo, totalJugadores, jugadores } }
      const data = response.data || response;
      setJugadoresEquipo(data.jugadores || []);
      setDrawerVisible(true);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al cargar jugadores');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalJugador = (equipo = null) => {
    if (equipo) {
      setEquipoSeleccionado(equipo);
    }
    formJugador.resetFields();
    setValorBusqueda('');
    setUsuarioSeleccionado(null);
    setOpcionesAutoComplete([]);
    setModalJugadorVisible(true);
  };

  // Buscar sugerencias mientras escribe
  useEffect(() => {
    const buscarSugerencias = async () => {
      
      setBuscandoSugerencias(true);
      try {
        const resultados = await buscarUsuarios(valorBusqueda, { 
          roles: ['estudiante', 'academico'] 
        });
        
        // Filtrar usuarios que ya están en el equipo
        const rutosEnEquipo = jugadoresEquipo.map(j => j.rut);
        const resultadosFiltrados = resultados.filter(
          r => !rutosEnEquipo.includes(r.rut)
        );
        
        // Formatear opciones para el AutoComplete
        const opcionesFormateadas = resultadosFiltrados.map(usuario => ({
          value: `${usuario.rut} - ${usuario.nombre}`,
          label: `${usuario.rut} - ${usuario.nombre}`,
          usuario: usuario
        }));
        
        setOpcionesAutoComplete(opcionesFormateadas);
      } catch (error) {
        console.error('Error buscando sugerencias:', error);
        setOpcionesAutoComplete([]);
      } finally {
        setBuscandoSugerencias(false);
      }
    };

    const timer = setTimeout(buscarSugerencias, 300);
    return () => clearTimeout(timer);
  }, [valorBusqueda, jugadoresEquipo, modalJugadorVisible]);

  const handleAgregarJugador = async (values) => {
    if (!usuarioSeleccionado) {
      message.error('Debes seleccionar un usuario de la lista');
      return;
    }

    setLoading(true);
    try {
      await equipoService.agregarJugador({
        campeonatoId,
        equipoId: equipoSeleccionado.id,
        usuarioId: usuarioSeleccionado.id,
        numeroCamiseta: values.numeroCamiseta || null,
        posicion: values.posicion || null
      });
      message.success('Jugador agregado exitosamente');
      setModalJugadorVisible(false);
      formJugador.resetFields();
      setValorBusqueda('');
      setUsuarioSeleccionado(null);
      
      // 🔥 FIX: Recargar tanto la lista de equipos como la de jugadores
      await cargarEquipos(); // Actualiza el contador en la tabla principal
      if (onUpdate) onUpdate(); // Notifica al componente padre
      
      // Si el drawer está abierto, recargar la lista de jugadores
      if (drawerVisible && equipoSeleccionado) {
        await verJugadores(equipoSeleccionado);
      }
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al agregar jugador');
    } finally {
      setLoading(false);
    }
  };

  const handleQuitarJugador = async (usuarioId) => {
    setLoading(true);
    try {
      await equipoService.quitarJugador(campeonatoId, equipoSeleccionado.id, usuarioId);
      message.success('Jugador eliminado del equipo');
      
      // 🔥 FIX: Recargar tanto la lista de equipos como la de jugadores
      await cargarEquipos(); // Actualiza el contador en la tabla principal
      if (onUpdate) onUpdate(); // Notifica al componente padre
      await verJugadores(equipoSeleccionado); // Recarga lista en el drawer
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al quitar jugador');
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo) => {
    const colors = {
      masculino: 'blue',
      femenino: 'pink',
      mixto: 'orange'
    };
    return colors[tipo?.toLowerCase()] || 'default';
  };

  const columns = [
    {
      title: 'Equipo',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text) => (
        <Space>
          <TeamOutlined style={{ fontSize: 18, color: '#1890ff' }} />
          <strong>{text}</strong>
        </Space>
      )
    },
    {
      title: 'Carrera',
      dataIndex: 'carrera',
      key: 'carrera',
      render: (carrera) => <Tag color="purple">{carrera}</Tag>
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo) => (
        <Tag color={getTipoColor(tipo)}>
          {tipo?.charAt(0).toUpperCase() + tipo?.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Jugadores',
      key: 'jugadores',
      render: (_, record) => (
        <Badge 
          count={record.jugadores?.length || 0} 
          showZero 
          style={{ backgroundColor: '#52c41a' }}
        >
          <TeamOutlined style={{ fontSize: 20 }} />
        </Badge>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      fixed: 'right',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver Jugadores">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => verJugadores(record)}
            />
          </Tooltip>
          <Tooltip title="Añadir Jugador">
            <Button
              type="text"
              icon={<UserAddOutlined />}
              onClick={() => abrirModalJugador(record)}
              disabled={campeonatoInfo?.estado === 'finalizado'}
              style={{ color: '#52c41a' }}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => abrirModal(record)}
              disabled={campeonatoInfo?.estado === 'finalizado'}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar equipo?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleEliminar(record.id)}
            okText="Sí"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                disabled={campeonatoInfo?.estado !== 'creado'}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const posiciones = [
    'Portero', 'Defensa Central', 'Lateral Derecho', 'Lateral Izquierdo',
    'Mediocampista Defensivo', 'Mediocampista Central', 'Mediocampista Ofensivo',
    'Extremo Derecho', 'Extremo Izquierdo', 'Delantero Centro'
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <h3 style={{ margin: 0 }}>Equipos del Campeonato</h3>
            <Badge count={equipos.length} showZero style={{ backgroundColor: '#52c41a' }} />
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => abrirModal()}
            disabled={campeonatoInfo?.estado !== 'creado'}
          >
            Nuevo Equipo
          </Button>
        </div>

        {campeonatoInfo?.estado !== 'creado' && (
          <Tag color="warning" style={{ marginBottom: 16 }}>
            Solo se pueden agregar equipos cuando el campeonato está en estado "Creado"
          </Tag>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
  <Table
    columns={columns}
    dataSource={equipos}
    loading={loading}
    rowKey="id"
    pagination={{
      position: ['bottomLeft'], 
      pageSize: 10,
      showSizeChanger: true,
      pageSizeOptions: ['5', '10', '20', '50'],
      locale: { items_per_page: '/ página' },
      
      showTotal: (total) => (
        <span style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.85)' }}>
          Total: {total} {total === 1 ? 'equipo' : 'equipos'}
        </span>
      )
    }}
    locale={{ emptyText: <Empty description="No hay equipos registrados" /> }}
  />
  
  {/* Texto total junto a la paginación */}

</div>
      </Card>

      {/* Modal Crear/Editar Equipo */}
      <Modal
        title={
          <Space>
            <TeamOutlined />
            <span>{editingId ? 'Editar Equipo' : 'Nuevo Equipo'}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={cerrarModal}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText={editingId ? 'Actualizar' : 'Crear'}
        cancelText="Cancelar"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="nombre"
            label="Nombre del Equipo"
            rules={[
              { required: true, message: 'El nombre es obligatorio' },
              { min: 3, message: 'Mínimo 3 caracteres' },
              { max: 100, message: 'Máximo 100 caracteres' }
            ]}
          >
            <Input 
              prefix={<TeamOutlined />} 
              placeholder="Ej: Ingeniería Civil Informática" 
            />
          </Form.Item>

          <Form.Item
            name="carrera"
            label="Carrera"
            rules={[
              { required: true, message: 'La carrera es obligatoria' },
              { min: 3, message: 'Mínimo 3 caracteres' }
            ]}
          >
            <Input 
              prefix={<TrophyOutlined />} 
              placeholder="Ej: Ingeniería Civil" 
            />
          </Form.Item>

          <Form.Item
            name="tipo"
            label="Tipo de Equipo"
            rules={[{ required: true, message: 'Selecciona el tipo' }]}
            tooltip={`Debe coincidir con el género del campeonato: ${campeonatoInfo?.genero || 'N/A'}`}
          >
            <Select placeholder="Seleccionar tipo">
              <Option value="masculino">
                <Tag color="blue">Masculino</Tag>
              </Option>
              <Option value="femenino">
                <Tag color="pink">Femenino</Tag>
              </Option>
              <Option value="mixto">
                <Tag color="orange">Mixto</Tag>
              </Option>
            </Select>
          </Form.Item>

          {campeonatoInfo && (
            <Descriptions size="small" bordered column={1} style={{ marginTop: 16 }}>
              <Descriptions.Item label="Formato del Campeonato">
                <Tag color="purple">{campeonatoInfo.formato}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Género del Campeonato">
                <Tag color={getTipoColor(campeonatoInfo.genero)}>
                  {campeonatoInfo.genero?.charAt(0).toUpperCase() + campeonatoInfo.genero?.slice(1)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Form>
      </Modal>

      {/* Drawer de Jugadores */}
      <Drawer
        title={
          <Space>
            <TeamOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <span>{equipoSeleccionado?.nombre}</span>
            <Badge 
              count={jugadoresEquipo.length} 
              style={{ backgroundColor: '#52c41a' }} 
            />
          </Space>
        }
        placement="right"
        width={700}
        onClose={() => {
          setDrawerVisible(false);
          setEquipoSeleccionado(null);
          setJugadoresEquipo([]);
        }}
        open={drawerVisible}
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => abrirModalJugador(equipoSeleccionado)}
            disabled={campeonatoInfo?.estado === 'finalizado'}
          >
            Agregar Jugador
          </Button>
        }
      >
        {equipoSeleccionado && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Carrera" span={2}>
                <Tag color="purple">{equipoSeleccionado.carrera}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tipo">
                <Tag color={getTipoColor(equipoSeleccionado.tipo)}>
                  {equipoSeleccionado.tipo?.charAt(0).toUpperCase() + equipoSeleccionado.tipo?.slice(1)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Jugadores">
                <Badge 
                  count={jugadoresEquipo.length} 
                  showZero 
                  style={{ backgroundColor: '#52c41a' }} 
                />
              </Descriptions.Item>
            </Descriptions>

            <Divider>Lista de Jugadores</Divider>

            {jugadoresEquipo.length > 0 ? (
              <List
                dataSource={jugadoresEquipo}
                loading={loading}
                renderItem={(jugador) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        title="¿Quitar jugador del equipo?"
                        onConfirm={() => handleQuitarJugador(jugador.usuarioId)}
                        okText="Sí"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                      >
                        <Button 
                          type="text" 
                          danger 
                          icon={<UserDeleteOutlined />}
                          disabled={campeonatoInfo?.estado === 'finalizado'}
                        >
                          Quitar
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ backgroundColor: '#1890ff' }}
                          size={50}
                        >
                          {jugador.numeroCamiseta || '?'}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <strong>{jugador.nombre}</strong>
                          {jugador.numeroCamiseta && (
                            <Tag color="blue">
                              <NumberOutlined /> {jugador.numeroCamiseta}
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <span>RUT: {jugador.rut}</span>
                          {jugador.posicion && (
                            <span>
                              Posición: {jugador.posicion}
                            </span>
                          )}
                          <Space size="large" style={{ marginTop: 4 }}>
                            <span> Goles: <strong>{jugador.goles || 0}</strong></span>
                            <span> Asistencias: <strong>{jugador.asistencias || 0}</strong></span>
                            {jugador.atajadas > 0 && (
                              <span> Atajadas: <strong>{jugador.atajadas}</strong></span>
                            )}
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No hay jugadores en este equipo" />
            )}
          </>
        )}
      </Drawer>

      {/* Modal Agregar Jugador */}
      <Modal
        title={
          <Space>
            <UserAddOutlined />
            <span>Agregar Jugador a {equipoSeleccionado?.nombre}</span>
          </Space>
        }
        open={modalJugadorVisible}
        onCancel={() => {
          setModalJugadorVisible(false);
          formJugador.resetFields();
          setValorBusqueda('');
          setUsuarioSeleccionado(null);
        }}
        onOk={() => formJugador.submit()}
        confirmLoading={loading}
        okText="Agregar"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !usuarioSeleccionado }}
      >
        <Form
          form={formJugador}
          layout="vertical"
          onFinish={handleAgregarJugador}
          autoComplete="off"
        >
          <Form.Item
            label="Buscar Jugador"
            required
            tooltip="Busca por nombre o RUT del jugador"
          >
            <AutoComplete
              value={valorBusqueda}
              options={opcionesAutoComplete}
              onSearch={setValorBusqueda}
              onSelect={(value, option) => {
                setUsuarioSeleccionado(option.usuario);
                setValorBusqueda(value);
              }}
              style={{ width: '100%' }}
              notFoundContent={
                buscandoSugerencias ? 'Buscando...' :
                'No se encontraron usuarios'
              }
            >
              <Input
                placeholder="Buscar por nombre o RUT"
                allowClear
                onClear={() => {
                  setUsuarioSeleccionado(null);
                  setValorBusqueda('');
                }}
              />
            </AutoComplete>
          </Form.Item>

          {usuarioSeleccionado && (
            <div style={{ 
              padding: 12, 
              background: '#e6f7ff', 
              borderRadius: 8, 
              marginBottom: 16,
              border: '1px solid #91d5ff'
            }}>
              <Space direction="vertical" size={0}>
                <strong>{usuarioSeleccionado.nombre}</strong>
                <span style={{ fontSize: 12, color: '#666' }}>RUT: {usuarioSeleccionado.rut}</span>
                <span style={{ fontSize: 12, color: '#666' }}>Email: {usuarioSeleccionado.email}</span>
              </Space>
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="numeroCamiseta"
                label="Número de Camiseta"
                rules={[
                  { type: 'number', min: 1, max: 99, message: 'Entre 1 y 99' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="Ej: 10"
                  min={1}
                  max={99}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="posicion"
                label="Posición"
              >
                <Select placeholder="Seleccionar posición" allowClear>
                  {posiciones.map(pos => (
                    <Option key={pos} value={pos}>{pos}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipoManager;