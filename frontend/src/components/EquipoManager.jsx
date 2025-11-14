import React, { useState, useEffect } from 'react';
import {
  Card, Button, Table, Modal, Form, Input, Select, Space, message,
  Popconfirm, Tag, Descriptions, Empty, Drawer, InputNumber, Divider,
  List, Avatar, Badge, Tooltip, Row, Col, AutoComplete
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined,
  UserAddOutlined, UserDeleteOutlined, EyeOutlined, TrophyOutlined,
  NumberOutlined
} from '@ant-design/icons';

// SERVICES
import { equipoService } from '../services/equipo.services.js';
import { buscarUsuarios } from '../services/auth.services.js';
import { carreraService } from '../services/carrera.services.js';

const { Option } = Select;

const EquipoManager = ({ campeonatoId, campeonatoInfo, onUpdate }) => {
  const [equipos, setEquipos] = useState([]);
  const [carreras, setCarreras] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalJugadorVisible, setModalJugadorVisible] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [jugadoresEquipo, setJugadoresEquipo] = useState([]);

  const [form] = Form.useForm();
  const [formJugador] = Form.useForm();

  const [opcionesAutoComplete, setOpcionesAutoComplete] = useState([]);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [formularioCompleto, setFormularioCompleto] = useState(false);

  // --------------------------
  // 📌 Cargar equipos
  // --------------------------
  useEffect(() => {
    if (campeonatoId) cargarEquipos();
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

  // --------------------------
  // 📌 Cargar carreras
  // --------------------------
  useEffect(() => {
    const getCarreras = async () => {
      try {
        const data = await carreraService.listar();
        setCarreras(data);
      } catch (error) {
        message.error("Error al cargar carreras");
      }
    };

    getCarreras();
  }, []);

  // --------------------------
  // 📌 Abrir modal de equipo
  // --------------------------
  const abrirModal = (equipo = null) => {
    if (equipo) {
      setEditingId(equipo.id);
      form.setFieldsValue({
        nombre: equipo.nombre,
        carreraId: equipo.carreraId,
        tipo: equipo.tipo
      });
    } else {
      setEditingId(null);
      form.resetFields();

      // Preseleccionar tipo según el género del campeonato
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

  // --------------------------
  // 📌 Guardar equipo
  // --------------------------
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
      onUpdate && onUpdate();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al guardar equipo');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // 📌 Eliminar equipo
  // --------------------------
  const handleEliminar = async (id) => {
    setLoading(true);
    try {
      await equipoService.eliminar(id);
      message.success('Equipo eliminado exitosamente');
      cargarEquipos();
      onUpdate && onUpdate();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al eliminar equipo');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // 📌 Ver jugadores
  // --------------------------
 const verJugadores = async (equipo) => {
  setLoading(true);
  setEquipoSeleccionado(equipo);

  try {
    const response = await equipoService.listarJugadores(equipo.id);

    const data = response.data?.data || response.data || response;

    console.log("DATA:", data); 

    setJugadoresEquipo(Array.isArray(data) ? data : data.jugadores || []);

    setDrawerVisible(true);
  } catch (error) {
    message.error('Error al cargar jugadores');
  } finally {
    setLoading(false);
  }
};


  // --------------------------
  // 📌 Abrir modal jugador
  // --------------------------
  const abrirModalJugador = (equipo) => {
    setEquipoSeleccionado(equipo);
    formJugador.resetFields();
    setValorBusqueda('');
    setUsuarioSeleccionado(null);
    setOpcionesAutoComplete([]);
    setFormularioCompleto(false);
    setModalJugadorVisible(true);
  };

  // --------------------------
  // 📌 Autocomplete usuarios
  // --------------------------
  useEffect(() => {
    const buscarSugerencias = async () => {
      if (!valorBusqueda) return;

      setBuscandoSugerencias(true);
      try {
        const resultados = await buscarUsuarios(valorBusqueda, {
          roles: ['estudiante', 'academico'],
          carreraId: equipoSeleccionado?.carreraId
        });
        console.log(equipoSeleccionado?.carreraId);

        const rutosEnEquipo = jugadoresEquipo.map(j => j.rut);

        const opciones = resultados
          .filter(r => !rutosEnEquipo.includes(r.rut))
          .map(usuario => ({
            value: `${usuario.rut} - ${usuario.nombre}`,
            label: `${usuario.rut} - ${usuario.nombre}`,
            usuario
          }));

        setOpcionesAutoComplete(opciones);

      } catch {
        setOpcionesAutoComplete([]);
      } finally {
        setBuscandoSugerencias(false);
      }
    };

    const timer = setTimeout(buscarSugerencias, 300);
    return () => clearTimeout(timer);

  }, [valorBusqueda, jugadoresEquipo, modalJugadorVisible]);

  // --------------------------
  // 📌 Agregar jugador
  // --------------------------
  const handleAgregarJugador = async (values, continuar = false) => {
    if (!usuarioSeleccionado) {
      return message.error('Debes seleccionar un usuario');
    }

    setLoading(true);
    try {
      await equipoService.agregarJugador({
        campeonatoId,
        equipoId: equipoSeleccionado.id,
        usuarioId: usuarioSeleccionado.id,
        numeroCamiseta: values.numeroCamiseta,
        posicion: values.posicion || null
      });

      message.success('Jugador agregado');

      await cargarEquipos();
      onUpdate && onUpdate();

      if (drawerVisible) {
        await verJugadores(equipoSeleccionado);
      }

      if (continuar) {
        formJugador.resetFields();
        setUsuarioSeleccionado(null);
        setValorBusqueda('');
      } else {
        setModalJugadorVisible(false);
      }

    } catch (e) {
      message.error(e?.response?.data?.error || 'Error al agregar jugador');
    } finally {
      setLoading(false);
    }
  };

  const handleQuitarJugador = async (usuarioId) => {
    setLoading(true);
    try {
      await equipoService.quitarJugador(campeonatoId, equipoSeleccionado.id, usuarioId);
      message.success("Jugador eliminado");
      await cargarEquipos();
      onUpdate && onUpdate();
      await verJugadores(equipoSeleccionado);
    } catch {
      message.error("Error al quitar jugador");
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

  // --------------------------
  // 📌 Columnas de tabla
  // --------------------------
  const columns = [
    {
      title: 'Equipo',
      dataIndex: 'nombre',
      key: 'nombre',
      render: text => (
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
      render: carrera => (
        <Tag color="purple">{carrera?.nombre || 'Sin carrera'}</Tag>
      )
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: tipo => (
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
            <Button type="text" icon={<EyeOutlined />} onClick={() => verJugadores(record)} />
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
            <Button type="text" icon={<EditOutlined />} onClick={() => abrirModal(record)} />
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
              <Button type="text" danger icon={<DeleteOutlined />} />
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

  const validarFormularioCompleto = () => {
    const valores = formJugador.getFieldsValue();
    setFormularioCompleto(
      usuarioSeleccionado &&
      valores.numeroCamiseta &&
      valores.posicion
    );
  };

  // --------------------------
  // 📌 RENDER
  // --------------------------
  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <h3>Equipos del Campeonato</h3>
            <Badge count={equipos.length} showZero style={{ backgroundColor: '#52c41a' }} />
          </Space>

          <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
            Nuevo Equipo
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={equipos}
          loading={loading}
          rowKey="id"
          pagination={{
            position: ['bottomLeft'],
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50']
          }}
          locale={{ emptyText: <Empty description="No hay equipos registrados" /> }}
        />
      </Card>

      {/* ----------------------
          MODAL CREAR/EDITAR
      ---------------------- */}
      <Modal
        title={<><TeamOutlined /> {editingId ? 'Editar Equipo' : 'Nuevo Equipo'}</>}
        open={modalVisible}
        onCancel={cerrarModal}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText={editingId ? 'Actualizar' : 'Crear'}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          
          <Form.Item name="nombre" label="Nombre del Equipo"
            rules={[{ required: true }, { min: 3 }, { max: 100 }]}>
            <Input prefix={<TeamOutlined />} placeholder="Ej: Ingeniería Comercial" />
          </Form.Item>

          {/* CAMPO CARRERAID */}
          <Form.Item
            name="carreraId"
            label="Carrera"
            rules={[{ required: true, message: 'La carrera es obligatoria' }]}
          >
            <Select placeholder="Selecciona una carrera">
              {carreras.map(c => (
                <Option key={c.id} value={c.id}>{c.nombre}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="tipo" label="Tipo de Equipo" rules={[{ required: true }]}>
            <Select>
              <Option value="masculino"><Tag color="blue">Masculino</Tag></Option>
              <Option value="femenino"><Tag color="pink">Femenino</Tag></Option>
              <Option value="mixto"><Tag color="orange">Mixto</Tag></Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* ----------------------
          DRAWER JUGADORES
      ---------------------- */}
      <Drawer
        title={
          <Space>
            <TeamOutlined /> {equipoSeleccionado?.nombre}
            <Badge count={jugadoresEquipo.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        placement="right"
        width={700}
        onClose={() => { setDrawerVisible(false); setEquipoSeleccionado(null); }}
        open={drawerVisible}
        extra={
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => abrirModalJugador(equipoSeleccionado)}>
            Agregar Jugador
          </Button>
        }
      >
        {equipoSeleccionado && (
          <>
            <Descriptions bordered size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Carrera" span={2}>
                <Tag color="purple">{equipoSeleccionado.carrera?.nombre}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tipo">
                <Tag color={getTipoColor(equipoSeleccionado.tipo)}>
    {equipoSeleccionado.tipo.charAt(0).toUpperCase() + equipoSeleccionado.tipo.slice(1)}
  </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Jugadores">
                <Badge count={jugadoresEquipo.length} style={{ backgroundColor: '#52c41a' }} />
              </Descriptions.Item>
            </Descriptions>

            <Divider>Lista de Jugadores</Divider>

            {jugadoresEquipo.length > 0 ? (
              <List
                dataSource={jugadoresEquipo}
                renderItem={(jugador) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        title="¿Quitar jugador del equipo?"
                        onConfirm={() => handleQuitarJugador(jugador.usuarioId)}
                        okButtonProps={{ danger: true }}
                      >
                        <Button type="text" danger icon={<UserDeleteOutlined />}>Quitar</Button>
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#1890ff' }} size={50}>
                          {jugador.numeroCamiseta}
                        </Avatar>
                      }
                      title={
                        <Space>
                          {jugador.nombre}
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
                          {jugador.posicion && <span>Posición: {jugador.posicion}</span>}
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

      {/* ----------------------
          MODAL AGREGAR JUGADOR
      ---------------------- */}
      <Modal
        title={<><UserAddOutlined /> Agregar Jugador</>}
        open={modalJugadorVisible}
        onCancel={() => { setModalJugadorVisible(false); formJugador.resetFields(); setUsuarioSeleccionado(null); }}
        footer={[
          <Button key="cancel" onClick={() => setModalJugadorVisible(false)}>Cancelar</Button>,
          <Button key="add" type="default" disabled={!formularioCompleto} onClick={() => formJugador.submit()}>
            Agregar y Continuar
          </Button>,
          <Button key="add-close" type="primary" disabled={!formularioCompleto}
            onClick={() => formJugador.validateFields().then(values => handleAgregarJugador(values, false))}>
            Agregar y Cerrar
          </Button>,
        ]}
      >

        <Form
          form={formJugador}
          layout="vertical"
          onFinish={(values) => handleAgregarJugador(values, true)}
          onValuesChange={validarFormularioCompleto}
        >
          <Form.Item label="Buscar Jugador" required>
            <AutoComplete
              value={valorBusqueda}
              options={opcionesAutoComplete}
              onSearch={setValorBusqueda}
              onSelect={(value, option) => {
                setUsuarioSeleccionado(option.usuario);
                setValorBusqueda(value);
                validarFormularioCompleto();
              }}
              style={{ width: '100%' }}
            >
              <Input placeholder="Buscar por nombre o RUT" allowClear
                onClear={() => { setUsuarioSeleccionado(null); setValorBusqueda(''); }}
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
              <strong>{usuarioSeleccionado.nombre}</strong>
              <br />
              <span style={{ fontSize: 12 }}>RUT: {usuarioSeleccionado.rut}</span>
              <br />
              <span style={{ fontSize: 12 }}>Email: {usuarioSeleccionado.email}</span>
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="numeroCamiseta"
                label="Número"
                rules={[{ required: true }, { type: 'number', min: 1, max: 99 }]}
              >
                <InputNumber min={1} max={99} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="posicion" label="Posición">
                <Select allowClear>
                  {[
                    'Portero', 'Defensa Central', 'Lateral Derecho', 'Lateral Izquierdo',
                    'Mediocampista Defensivo', 'Mediocampista Central', 'Mediocampista Ofensivo',
                    'Extremo Derecho', 'Extremo Izquierdo', 'Delantero Centro'
                  ].map(pos => <Option key={pos} value={pos}>{pos}</Option>)}
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
