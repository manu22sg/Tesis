import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  App,
  Spin,
  AutoComplete,
  DatePicker,
  ConfigProvider,
  InputNumber,
  Divider,
  Space,
  Tag
} from 'antd';
import { 
  UserOutlined, 
  SaveOutlined, 
  CheckCircleOutlined,
  TeamOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import locale from 'antd/locale/es_ES';
import {
  crearJugador,
  obtenerJugadorPorId,
  actualizarJugador,
  asignarJugadorAGrupo
} from '../services/jugador.services.js';
import { buscarUsuarios } from '../services/auth.services.js';
import { obtenerGrupos } from '../services/grupo.services.js';
import MainLayout from '../components/MainLayout.jsx';

const { Option } = Select;
dayjs.locale('es');

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

export default function JugadorForm() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { message } = App.useApp(); 

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [opcionesAutoComplete, setOpcionesAutoComplete] = useState([]);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  
  // Estados para grupos
  const [grupos, setGrupos] = useState([]);
  const [gruposSeleccionados, setGruposSeleccionados] = useState([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);

  const valorDebounced = useDebounce(valorBusqueda, 500);

  // Cargar grupos disponibles
  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      setLoadingGrupos(true);
      const gruposData = await obtenerGrupos({ limit: 100 });
      const todosLosGrupos = gruposData?.data?.grupos || gruposData?.grupos || [];
      setGrupos(Array.isArray(todosLosGrupos) ? todosLosGrupos : []);
    } catch (error) {
      console.error('Error cargando grupos:', error);
      message.error('Error al cargar los grupos disponibles');
    } finally {
      setLoadingGrupos(false);
    }
  };

  // Cargar jugador si es edición
  useEffect(() => {
    if (isEdit) cargarJugador();
  }, [id]);

  const cargarJugador = async () => {
    try {
      setLoadingData(true);
      const jugador = await obtenerJugadorPorId(parseInt(id));

      form.setFieldsValue({
        posicion: jugador.posicion,
        posicionSecundaria: jugador.posicionSecundaria,
        piernaHabil: jugador.piernaHabil,
        altura: jugador.altura ? Number(jugador.altura) : undefined,
        peso: jugador.peso ? Number(jugador.peso) : undefined,
        estado: jugador.estado,
        fechaNacimiento: jugador.fechaNacimiento ? dayjs(jugador.fechaNacimiento) : null,
        anioIngreso: jugador.anioIngreso
      });

      // Cargar grupos actuales del jugador
      if (jugador.jugadorGrupos && Array.isArray(jugador.jugadorGrupos)) {
        const gruposIds = jugador.jugadorGrupos
          .map(jg => jg.grupo?.id)
          .filter(Boolean);
        setGruposSeleccionados(gruposIds);
      }

      // Usuario con carrera
      if (jugador.usuario) {
        setUsuarioSeleccionado({
          id: jugador.usuario.id,
          nombre: `${jugador.usuario.nombre} ${jugador.usuario.apellido || ''}`.trim(),
          rut: jugador.usuario.rut,
          email: jugador.usuario.email,
          carrera: jugador.usuario.carrera?.nombre || 'Sin carrera'
        });
        setValorBusqueda(`${jugador.usuario.rut} - ${jugador.usuario.nombre} ${jugador.usuario.apellido || ''}`.trim());
      }
    } catch (error) {
      console.error('Error cargando jugador:', error);
      message.error('Error al cargar los datos del jugador');
      navigate('/jugadores');
    } finally {
      setLoadingData(false);
    }
  };

  // Buscar sugerencias con debounce aplicado
  useEffect(() => {
    const buscarSugerencias = async () => {
      if (!valorDebounced || valorDebounced.length < 2 || isEdit) {
        setOpcionesAutoComplete([]);
        return;
      }

      setBuscandoSugerencias(true);
      try {
        const resultados = await buscarUsuarios(valorDebounced, {
          roles: ['estudiante'],
          excluirJugadores: true,
          sexo: 'Masculino'
        });
          
        const opcionesFormateadas = resultados.map((usuario) => {
          const nombreCompleto = `${usuario.nombre} ${usuario.apellido || ''}`.trim();
          const labelCarrera = usuario.carrera?.nombre ? ` - ${usuario.carrera.nombre}` : '';
          
          return {
            value: `${nombreCompleto} - ${usuario.rut}`, 
            label: `${nombreCompleto} - ${usuario.rut}${labelCarrera}`, 
            rut: usuario.rut,
            nombre: nombreCompleto,
            email: usuario.email,
            carrera: usuario.carrera?.nombre || 'Sin carrera',
            usuarioId: usuario.id
          };
        });

        setOpcionesAutoComplete(opcionesFormateadas);
      } catch (error) {
        console.error('Error buscando sugerencias:', error);
      } finally {
        setBuscandoSugerencias(false);
      }
    };

    buscarSugerencias();
  }, [valorDebounced, isEdit]);

  const seleccionarUsuario = (rut, option) => {
    if (option) {
      const usuario = {
        id: option.usuarioId,
        rut: option.rut,
        nombre: option.nombre,
        email: option.email,
        carrera: option.carrera
      };
      setUsuarioSeleccionado(usuario);
      form.setFieldsValue({ usuarioId: option.usuarioId });
      setValorBusqueda('');
      setOpcionesAutoComplete([]);
    }
  };

  const handleSubmit = async (values) => {
    if (!isEdit && !usuarioSeleccionado) {
      message.error('Debe seleccionar un usuario válido');
      return;
    }

    try {
      setLoading(true);
      const datosFormulario = {
        ...values,
        fechaNacimiento: values.fechaNacimiento
          ? values.fechaNacimiento.format('YYYY-MM-DD')
          : undefined
      };

      let jugadorId;

      if (isEdit) {
        const { usuarioId, ...datosActualizacion } = datosFormulario;
        await actualizarJugador(parseInt(id), datosActualizacion);
        jugadorId = parseInt(id);
        message.success('Jugador actualizado correctamente');
      } else {
        const nuevoJugador = await crearJugador(datosFormulario);
        jugadorId = nuevoJugador.id;
        message.success('Jugador creado correctamente');
      }

      // Asignar a grupos si hay grupos seleccionados (solo en creación)
      if (!isEdit && gruposSeleccionados.length > 0) {
        try {
          const promesasGrupos = gruposSeleccionados.map(grupoId =>
            asignarJugadorAGrupo(jugadorId, grupoId)
          );
          await Promise.all(promesasGrupos);
          message.success(`Jugador asignado a ${gruposSeleccionados.length} grupo(s)`);
        } catch (error) {
          console.error('Error asignando a grupos:', error);
          message.warning('Jugador creado pero hubo un error al asignar algunos grupos');
        }
      }

      navigate('/jugadores');
    } catch (error) {
      console.error('Error guardando jugador:', error);
      const errorMsg =
        error.response?.data?.message ||
        `Error al ${isEdit ? 'actualizar' : 'crear'} el jugador`;
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const agregarGrupo = (grupoId) => {
    if (!gruposSeleccionados.includes(grupoId)) {
      setGruposSeleccionados([...gruposSeleccionados, grupoId]);
    }
  };

  const removerGrupo = (grupoId) => {
    setGruposSeleccionados(gruposSeleccionados.filter(id => id !== grupoId));
  };

  if (loadingData) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', paddingTop: 120 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ minHeight: '100vh', padding: '2rem', background: '#f5f5f5' }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <UserOutlined style={{ fontSize: 24 }} />
                <span>{isEdit ? 'Editar Jugador' : 'Nuevo Jugador'}</span>
              </div>
            }
            style={{ maxWidth: 900, margin: '0 auto' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ estado: 'activo' }}
            >
              {/* Usuario con AutoComplete (solo en creación) */}
              {!isEdit ? (
                <>
                  <Form.Item name="usuarioId" hidden>
                    <Input type="hidden" />
                  </Form.Item>

                  {usuarioSeleccionado && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: 12,
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircleOutlined style={{ color: '#006B5B', fontSize: 18 }} />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{usuarioSeleccionado.nombre}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            {usuarioSeleccionado.rut}
                            {usuarioSeleccionado.email && ` • ${usuarioSeleccionado.email}`}
                            {usuarioSeleccionado.carrera && ` • ${usuarioSeleccionado.carrera}`}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          setUsuarioSeleccionado(null);
                          form.setFieldsValue({ usuarioId: undefined });
                          setValorBusqueda('');
                        }}
                      >
                        Cambiar
                      </Button>
                    </div>
                  )}

                  {!usuarioSeleccionado && (
                    <Form.Item
                      name="usuarioId"
                      label="Usuario"
                      rules={[{ required: true, message: 'Seleccione un usuario' }]}
                      validateTrigger="onSubmit"
                    >
                      <AutoComplete
                        value={valorBusqueda}
                        options={opcionesAutoComplete}
                        onSearch={setValorBusqueda}
                        onSelect={(value, option) => seleccionarUsuario(value, option)}
                        style={{ width: '100%' }}
                        placeholder="Buscar por nombre, RUT o carrera"
                        allowClear
                        onClear={() => {
                          setValorBusqueda('');
                          setUsuarioSeleccionado(null);
                          form.setFieldsValue({ usuarioId: undefined });
                        }}
                        notFoundContent={
                          buscandoSugerencias || (valorBusqueda.length >= 2 && valorBusqueda !== valorDebounced) ? (
                            <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <Spin size="small" />
                              <span style={{ marginLeft: 8 }}>Buscando...</span>
                            </div>
                          ) : valorBusqueda.length < 2 ? (
                            <div style={{ padding: '8px 12px', color: '#999', textAlign: 'center' }}>
                              Escriba al menos 2 caracteres para buscar
                            </div>
                          ) : (
                            <div style={{ padding: '8px 12px', color: '#999', textAlign: 'center' }}>
                              No se encontraron usuarios disponibles
                            </div>
                          )
                        }
                      />
                    </Form.Item>
                  )}
                </>
              ) : (
                usuarioSeleccionado && (
                  <div
                    style={{
                      marginBottom: 24,
                      padding: 12,
                      background: '#f0f2f5',
                      borderRadius: 8
                    }}
                  >
                    <div style={{ marginBottom: 4, color: '#666', fontSize: 14 }}>Usuario</div>
                    <div style={{ fontSize: 16 }}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      <strong>{usuarioSeleccionado.nombre}</strong>
                      <span style={{ marginLeft: 8, color: '#666' }}>
                        ({usuarioSeleccionado.rut})
                      </span>
                    </div>
                    {usuarioSeleccionado.email && (
                      <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                        {usuarioSeleccionado.email}
                      </div>
                    )}
                    {usuarioSeleccionado.carrera && (
                      <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                        📚 {usuarioSeleccionado.carrera}
                      </div>
                    )}
                  </div>
                )
              )}

              <Divider />

              {/* Campos del jugador */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item 
                  name="posicion" 
                  label="Posición Principal"
                  rules={[{ required: true, message: 'Seleccione una posición principal' }]}
                >
                  <Select placeholder="Seleccione una posición" allowClear>
                    <Option value="Portero">Portero</Option>
                    <Option value="Defensa Central">Defensa Central</Option>
                    <Option value="Defensa Central Derecho">Defensa Central Derecho</Option>
                    <Option value="Defensa Central Izquierdo">Defensa Central Izquierdo</Option>
                    <Option value="Lateral Derecho">Lateral Derecho</Option>
                    <Option value="Lateral Izquierdo">Lateral Izquierdo</Option>
                    <Option value="Mediocentro Defensivo">Mediocentro Defensivo</Option>
                    <Option value="Mediocentro">Mediocentro</Option>
                    <Option value="Mediocentro Ofensivo">Mediocentro Ofensivo</Option>
                    <Option value="Extremo Derecho">Extremo Derecho</Option>
                    <Option value="Extremo Izquierdo">Extremo Izquierdo</Option>
                    <Option value="Delantero Centro">Delantero Centro</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="posicionSecundaria" label="Posición Secundaria">
                  <Select placeholder="Seleccione una posición (opcional)" allowClear>
                    <Option value="Portero">Portero</Option>
                    <Option value="Defensa Central">Defensa Central</Option>
                    <Option value="Defensa Central Derecho">Defensa Central Derecho</Option>
                    <Option value="Defensa Central Izquierdo">Defensa Central Izquierdo</Option>
                    <Option value="Lateral Derecho">Lateral Derecho</Option>
                    <Option value="Lateral Izquierdo">Lateral Izquierdo</Option>
                    <Option value="Mediocentro Defensivo">Mediocentro Defensivo</Option>
                    <Option value="Mediocentro">Mediocentro</Option>
                    <Option value="Mediocentro Ofensivo">Mediocentro Ofensivo</Option>
                    <Option value="Extremo Derecho">Extremo Derecho</Option>
                    <Option value="Extremo Izquierdo">Extremo Izquierdo</Option>
                    <Option value="Delantero Centro">Delantero Centro</Option>
                  </Select>
                </Form.Item>

                <Form.Item 
                  name="piernaHabil" 
                  label="Pierna Hábil"
                  rules={[{ required: true, message: 'Seleccione la pierna hábil' }]}
                >
                  <Select placeholder="Seleccione pierna hábil" allowClear>
                    <Option value="Derecha">Derecha</Option>
                    <Option value="Izquierda">Izquierda</Option>
                    <Option value="Ambas">Ambas</Option>
                  </Select>
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item
                  name="altura"
                  label="Altura (cm) - Opcional"
                  rules={[
                    {
                      type: 'number',
                      min: 100,
                      max: 250,
                      message: 'Altura debe estar entre 100-250 cm'
                    }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Ej: 175.5"
                    addonAfter="cm"
                    step={0.1}
                    parser={(value) =>
                      value.replace(/,/g, '.').replace(/[^0-9.]/g, '')
                    }
                    formatter={(value) => value}
                  />
                </Form.Item>

                <Form.Item
                  name="peso"
                  label="Peso (kg) - Opcional"
                  rules={[
                    {
                      type: 'number',
                      min: 30,
                      max: 200,
                      message: 'Peso debe estar entre 30-200 kg'
                    }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Ej: 70.5"
                    addonAfter="kg"
                    step={0.1}
                    parser={(value) =>
                      value.replace(/,/g, '.').replace(/[^0-9.]/g, '')
                    }
                    formatter={(value) => value}
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="estado"
                label="Estado"
                rules={[{ required: true, message: 'Seleccione el estado' }]}
              >
                <Select placeholder="Seleccione el estado">
                  <Option value="activo">Activo</Option>
                  <Option value="inactivo">Inactivo</Option>
                  <Option value="lesionado">Lesionado</Option>
                  <Option value="suspendido">Suspendido</Option>
                </Select>
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item 
                  name="fechaNacimiento" 
                  label="Fecha de Nacimiento"
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="Seleccione una fecha"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item 
                  name="anioIngreso" 
                  label="Año de Ingreso"
                  rules={[{ required: true, message: 'Seleccione el año de ingreso al sistema' }]}
                >
                  <Select placeholder="Seleccione el año" showSearch>
                    {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(
                      (year) => (
                        <Option key={year} value={year}>
                          {year}
                        </Option>
                      )
                    )}
                  </Select>
                </Form.Item>
              </div>

              {/* Nueva sección: Asignación a Grupos (solo en creación) */}
              {!isEdit && (
                <>
                  <Divider orientation="left">
                    <Space>
                      <TeamOutlined style={{ fontSize: 18, color: '#014898' }} />
                      <span>Asignar a Grupos (Opcional)</span>
                    </Space>
                  </Divider>

                  <Form.Item
                    label="Seleccionar grupos"
                    tooltip="Puede asignar el jugador a uno o más grupos al momento de crearlo"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Seleccione los grupos (opcional)"
                      value={gruposSeleccionados}
                      onChange={setGruposSeleccionados}
                      style={{ width: '100%' }}
                      loading={loadingGrupos}
                      showSearch
                      filterOption={(input, option) => {
                        const grupo = grupos.find(g => g.id === option.value);
                        if (!grupo) return false;
                        const searchText = input.toLowerCase();
                        return (
                          grupo.nombre?.toLowerCase().includes(searchText) ||
                          grupo.descripcion?.toLowerCase().includes(searchText) ||
                          grupo.categoria?.toLowerCase().includes(searchText)
                        );
                      }}
                      tagRender={(props) => {
                        const { label, value, closable, onClose } = props;
                        const grupo = grupos.find(g => g.id === value);
                        return (
                          <Tag
                            color="blue"
                            closable={closable}
                            onClose={onClose}
                            style={{ marginRight: 4 }}
                          >
                            <TeamOutlined style={{ marginRight: 4 }} />
                            {grupo?.nombre || label}
                          </Tag>
                        );
                      }}
                    >
                      {grupos.map(grupo => (
                        <Option key={grupo.id} value={grupo.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TeamOutlined />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500 }}>{grupo.nombre}</div>
                              {grupo.descripcion && (
                                <div style={{ fontSize: 12, color: '#666' }}>
                                  {grupo.descripcion}
                                </div>
                              )}
                            </div>
                            {grupo.categoria && (
                              <Tag style={{ marginLeft: 'auto' }}>
                                {grupo.categoria}
                              </Tag>
                            )}
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {gruposSeleccionados.length > 0 && (
                    <div
                      style={{
                        padding: 12,
                        background: '#e6f4ff',
                        border: '1px solid #91caff',
                        borderRadius: 8,
                        marginTop: 8
                      }}
                    >
                      <div style={{ marginBottom: 8, fontWeight: 500, color: '#014898' }}>
                        <TeamOutlined style={{ marginRight: 8 }} />
                        Grupos seleccionados ({gruposSeleccionados.length}):
                      </div>
                      <Space size={[8, 8]} wrap>
                        {gruposSeleccionados.map(grupoId => {
                          const grupo = grupos.find(g => g.id === grupoId);
                          return grupo ? (
                            <Tag
                              key={grupoId}
                              color="blue"
                              closable
                              onClose={() => removerGrupo(grupoId)}
                            >
                              {grupo.nombre}
                            </Tag>
                          ) : null;
                        })}
                      </Space>
                    </div>
                  )}
                </>
              )}

              <Form.Item style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button onClick={() => navigate('/jugadores')}>Cancelar</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                    disabled={!isEdit && !usuarioSeleccionado}
                  >
                    {isEdit ? 'Actualizar' : 'Crear'} Jugador
                    {!isEdit && gruposSeleccionados.length > 0 && ` y Asignar a ${gruposSeleccionados.length} Grupo(s)`}
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}