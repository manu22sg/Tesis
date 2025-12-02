import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Button, Table, Modal, Form, Input, Select, Space, App,
  Popconfirm, Tag, Descriptions, Empty, Drawer, InputNumber, Divider,
  List, Avatar, Badge, Tooltip, Row, Col, Dropdown, ConfigProvider, Spin
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined,
  UserAddOutlined, UserDeleteOutlined, EyeOutlined, TrophyOutlined,
  NumberOutlined, FileExcelOutlined, FilePdfOutlined, DownloadOutlined
} from '@ant-design/icons';
import locale from 'antd/locale/es_ES';

import { equipoService } from '../services/equipo.services.js';
import { buscarUsuarios } from '../services/auth.services.js';
import { carreraService } from '../services/carrera.services.js';

const { Option } = Select;

const EquipoManager = ({ campeonatoId, campeonatoInfo, onUpdate }) => {
  const [equipos, setEquipos] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const { message } = App.useApp();

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalJugadorVisible, setModalJugadorVisible] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [jugadoresEquipo, setJugadoresEquipo] = useState([]);

  const [form] = Form.useForm();
  const [formJugador] = Form.useForm();

  // Estados para la búsqueda mejorada
  const [usuarios, setUsuarios] = useState([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  
  const searchTimeout = useRef(null);

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
  // 📌 Cleanup del timeout
  // --------------------------
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
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
    setBusquedaUsuario('');
    setUsuarioSeleccionado(null);
    setUsuarios([]);
    setModalJugadorVisible(true);
  };

  // --------------------------
  // 🆕 Búsqueda de usuarios mejorada
  // --------------------------
  const handleBuscarUsuarios = (value) => {
    setBusquedaUsuario(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!value || value.trim().length < 2) {
      setUsuarios([]);
      setBuscandoUsuarios(false);
      return;
    }

    setBuscandoUsuarios(true);

    searchTimeout.current = setTimeout(() => {
      buscarUsuariosAPI(value.trim());
    }, 500);
  };

  const buscarUsuariosAPI = async (q) => {
    setBuscandoUsuarios(true);
    try {
      const resultados = await buscarUsuarios(q, {
        roles: ['estudiante', 'academico'],
        carreraId: equipoSeleccionado?.carreraId
      });

      const rutosEnEquipo = jugadoresEquipo.map(j => j.rut);
      const usuariosFiltrados = resultados.filter(r => !rutosEnEquipo.includes(r.rut));
      
      setUsuarios(Array.isArray(usuariosFiltrados) ? usuariosFiltrados : []);
    } catch (error) {
      console.error('Error buscando usuarios:', error);
      message.error('Error al buscar usuarios');
      setUsuarios([]);
    } finally {
      setBuscandoUsuarios(false);
    }
  };

  const handleUsuarioChange = (usuarioId) => {
    const usuario = usuarios.find(u => u.id === usuarioId);
    setUsuarioSeleccionado(usuario || null);
  };

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
        numeroCamiseta: values.numeroCamiseta || null,
        posicion: values.posicion || null
      });

      message.success('Jugador agregado');

      const response = await equipoService.listarJugadores(equipoSeleccionado.id);
      const data = response.data?.data || response.data || response;
      const jugadoresActualizados = Array.isArray(data) ? data : data.jugadores || [];
      setJugadoresEquipo(jugadoresActualizados);

      await cargarEquipos();
      onUpdate && onUpdate();

      if (continuar) {
        formJugador.resetFields();
        setUsuarioSeleccionado(null);
        setBusquedaUsuario('');
        setUsuarios([]);
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

  const handleExportarExcel = async () => {
    setExportando(true);
    try {
      const result = await equipoService.exportarExcel(campeonatoId, true);

      if (result.modo === "web" && result.blob) {
        descargarArchivo(result.blob, result.nombre);
        message.success("Excel descargado correctamente");
      } else if (result.modo === "mobile" && result.base64) {
        console.log("BASE64 recibido:", result.base64);
        message.success("Archivo generado (mobile)");
      }

    } catch (error) {
      console.error('Error exportando a Excel:', error);
      message.error(error.message || 'Error al exportar equipos a Excel');
    } finally {
      setExportando(false);
    }
  };

  const handleExportarPDF = async () => {
    setExportando(true);
    try {
      const result = await equipoService.exportarPDF(campeonatoId, true);

      if (result.modo === "web" && result.blob) {
        descargarArchivo(result.blob, result.nombre);
        message.success("PDF descargado correctamente");
      } else if (result.modo === "mobile" && result.base64) {
        console.log("BASE64 recibido:", result.base64);
        message.success("Archivo generado (mobile)");
      }

    } catch (error) {
      console.error('Error exportando a PDF:', error);
      message.error(error.message || 'Error al exportar equipos a PDF');
    } finally {
      setExportando(false);
    }
  };

  function descargarArchivo(blob, nombre) {
    if (typeof window === 'undefined' || !window.URL?.createObjectURL) {
      console.error('createObjectURL no disponible');
      return;
    }

    try {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
    }
  }

  // --------------------------
  // 📊 Columnas de tabla
  // --------------------------
  const columns = [
    {
      title: 'Equipo',
      dataIndex: 'nombre',
      key: 'nombre',
      render: text => (
        <Space>
          <TeamOutlined style={{ fontSize: 18, color: '#014898' }} />
          <strong>{text}</strong>
        </Space>
      )
    },
    {
      title: 'Carrera',
      dataIndex: 'carrera',
      key: 'carrera',
      render: carrera => (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid #B9BBBB',
          backgroundColor: '#f5f5f5'
        }}>
          {carrera?.nombre || 'Sin carrera'}
        </span>
      )
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: tipo => (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid #B9BBBB',
          backgroundColor: '#f5f5f5'
        }}>
          {tipo?.charAt(0).toUpperCase() + tipo?.slice(1)}
        </span>
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
              style={{ color: '#006B5B' }}
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

  // --------------------------
  // 📌 RENDER
  // --------------------------
  return (
    <ConfigProvider locale={locale}>
      <div>
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <TeamOutlined style={{ fontSize: 24, color: '#014898' }} />
              <h3>Equipos del Campeonato</h3>
              <Badge count={equipos.length} showZero style={{ backgroundColor: '#006B5B' }} />
            </Space>

            <Space>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'excel',
                      icon: <FileExcelOutlined />,
                      label: 'Exportar a Excel',
                      onClick: handleExportarExcel,
                    },
                    {
                      key: 'pdf',
                      icon: <FilePdfOutlined />,
                      label: 'Exportar a PDF',
                      onClick: handleExportarPDF,
                    },
                  ],
                }}
                placement="bottomRight"
                disabled={equipos.length === 0}
              >
                <Button icon={<DownloadOutlined />} disabled={equipos.length === 0}>
                  Exportar
                </Button>
              </Dropdown>

              <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
                Nuevo Equipo
              </Button>
            </Space>
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
                <Option value="masculino">
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '12px',
                    fontWeight: 500,
                    border: '1px solid #B9BBBB',
                    backgroundColor: '#f5f5f5'
                  }}>
                    Masculino
                  </span>
                </Option>
                <Option value="femenino">
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '12px',
                    fontWeight: 500,
                    border: '1px solid #B9BBBB',
                    backgroundColor: '#f5f5f5'
                  }}>
                    Femenino
                  </span>
                </Option>
                <Option value="mixto">
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '12px',
                    fontWeight: 500,
                    border: '1px solid #B9BBBB',
                    backgroundColor: '#f5f5f5'
                  }}>
                    Mixto
                  </span>
                </Option>
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
              <Badge count={jugadoresEquipo.length} style={{ backgroundColor: '#006B5B' }} />
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
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '12px',
                    fontWeight: 500,
                    border: '1px solid #B9BBBB',
                    backgroundColor: '#f5f5f5'
                  }}>
                    {equipoSeleccionado.carrera?.nombre}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Tipo">
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '12px',
                    fontWeight: 500,
                    border: '1px solid #B9BBBB',
                    backgroundColor: '#f5f5f5'
                  }}>
                    {equipoSeleccionado.tipo.charAt(0).toUpperCase() + equipoSeleccionado.tipo.slice(1)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Total Jugadores">
                  <Badge count={jugadoresEquipo.length} style={{ backgroundColor: '#006B5B' }} />
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
                          <Avatar style={{ backgroundColor: '#014898' }} size={50}>
                            {jugador.numeroCamiseta || '?'}
                          </Avatar>
                        }
                        title={
                          <Space>
                            {`${jugador.nombre} ${jugador.apellido || ''}`}
                            {jugador.numeroCamiseta && (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: '12px',
                                fontWeight: 500,
                                border: '1px solid #B9BBBB',
                                backgroundColor: '#f5f5f5',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <NumberOutlined /> {jugador.numeroCamiseta}
                              </span>
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
            MODAL AGREGAR JUGADOR (🆕 MEJORADO)
        ---------------------- */}
        <Modal
          title={<><UserAddOutlined /> Agregar Jugador</>}
          open={modalJugadorVisible}
          onCancel={() => {
            setModalJugadorVisible(false);
            formJugador.resetFields();
            setUsuarioSeleccionado(null);
            setBusquedaUsuario('');
            setUsuarios([]);
          }}
          footer={[
            <Button key="cancel" onClick={() => setModalJugadorVisible(false)}>
              Cancelar
            </Button>,
            <Button
              key="add"
              type="default"
              disabled={!usuarioSeleccionado}
              onClick={() => formJugador.submit()}
            >
              Agregar y Continuar
            </Button>,
            <Button
              key="add-close"
              type="primary"
              disabled={!usuarioSeleccionado}
              onClick={() => formJugador.validateFields().then(values => handleAgregarJugador(values, false))}
            >
              Agregar y Cerrar
            </Button>,
          ]}
        >
          <Form
            form={formJugador}
            layout="vertical"
            onFinish={(values) => handleAgregarJugador(values, true)}
          >
            {/* 🆕 Selector mejorado de usuario */}
            <Form.Item
              name="usuarioId"
              label="Jugador"
              rules={[{ required: true, message: 'Selecciona un jugador' }]}
            >
              <Select
                showSearch
                placeholder="Buscar jugador por nombre o RUT..."
                filterOption={false}
                searchValue={busquedaUsuario}
                onSearch={handleBuscarUsuarios}
                onChange={handleUsuarioChange}
                loading={buscandoUsuarios}
                notFoundContent={
                  buscandoUsuarios ? (
                    <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <Spin size="small" />
                    </div>
                  ) : busquedaUsuario.trim().length > 0 && busquedaUsuario.trim().length < 2 ? (
                    <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                      Escribe al menos 2 caracteres
                    </div>
                  ) : busquedaUsuario.trim().length >= 2 && usuarios.length === 0 ? (
                    <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                      No se encontraron usuarios
                    </div>
                  ) : usuarios.length === 0 ? (
                    <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                      Escribe para buscar...
                    </div>
                  ) : null
                }
              >
                {usuarios.map((u) => (
                  <Select.Option key={u.id} value={u.id}>
                    {`${u.nombre || 'Sin nombre'} ${u.apellido || ''} — ${u.rut || 'Sin RUT'}`}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Información del usuario seleccionado */}
            {usuarioSeleccionado && (
              <div style={{
                padding: 12,
                background: '#e6f7ff',
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #91d5ff'
              }}>
                <strong>{usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}</strong>
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
                  label="Número (Opcional)"
                  rules={[{ type: 'number', min: 1, max: 99 }]}
                >
                  <InputNumber
                    min={1}
                    max={99}
                    placeholder="Número de camiseta"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="posicion"
                  label="Posición (Opcional)"
                >
                  <Select allowClear placeholder="Selecciona una posición">
                    {[
                      'Portero', 'Defensa Central', 'Defensa Central Izquierdo', 'Defensa Central Derecho',
                      'Lateral Derecho', 'Lateral Izquierdo', 'Mediocampista Defensivo',
                      'Mediocampista Central', 'Mediocampista Ofensivo',
                      'Extremo Derecho', 'Extremo Izquierdo', 'Delantero Centro'
                    ].map(pos => <Option key={pos} value={pos}>{pos}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default EquipoManager;