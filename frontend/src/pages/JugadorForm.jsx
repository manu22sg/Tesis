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
  InputNumber
} from 'antd';
import { UserOutlined, SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import locale from 'antd/locale/es_ES';
import {
  crearJugador,
  obtenerJugadorPorId,
  actualizarJugador
} from '../services/jugador.services.js';
import { buscarUsuarios } from '../services/auth.services.js';
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

  // aplicar debounce al valor de búsqueda
  const valorDebounced = useDebounce(valorBusqueda, 500);

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

      if (isEdit) {
        const { usuarioId, ...datosActualizacion } = datosFormulario;
        await actualizarJugador(parseInt(id), datosActualizacion);
        message.success('Jugador actualizado correctamente');
      } else {
        await crearJugador(datosFormulario);
        message.success('Jugador agregado correctamente');
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

  if (loadingData) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 120 }}>
        <Spin size="large" />
      </div>
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
            style={{ maxWidth: 800, margin: '0 auto' }}
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

              {/* Campos actualizados */}
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

  {/* OPCIONAL */}
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
  {/* OPCIONAL */}
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

  {/* OPCIONAL */}
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
    rules={[{ required: true, message: 'Seleccione la fecha de nacimiento' }]}
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
