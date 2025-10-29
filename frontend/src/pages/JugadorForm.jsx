import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  message,
  Spin,
  AutoComplete,
  DatePicker,
  ConfigProvider
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

// Configurar dayjs en español
dayjs.locale('es');

export default function JugadorForm() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  // Estados para AutoComplete
  const [opcionesAutoComplete, setOpcionesAutoComplete] = useState([]);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  // Cargar jugador si es edición
  useEffect(() => {
    if (isEdit) {
      cargarJugador();
    }
  }, [id]);

  const cargarJugador = async () => {
    try {
      setLoadingData(true);
      const jugador = await obtenerJugadorPorId(parseInt(id));
      
      form.setFieldsValue({
        carrera: jugador.carrera,
        telefono: jugador.telefono,
        estado: jugador.estado,
        fechaNacimiento: jugador.fechaNacimiento ? dayjs(jugador.fechaNacimiento) : null,
        anioIngreso: jugador.anioIngreso
      });

      // Mostrar información del usuario en modo edición
      if (jugador.usuario) {
        setUsuarioSeleccionado({
          id: jugador.usuario.id,
          nombre: jugador.usuario.nombre,
          rut: jugador.usuario.rut,
          email: jugador.usuario.email
        });
        setValorBusqueda(`${jugador.usuario.rut} - ${jugador.usuario.nombre}`);
      }
    } catch (error) {
      console.error('Error cargando jugador:', error);
      message.error('Error al cargar los datos del jugador');
      navigate('/jugadores');
    } finally {
      setLoadingData(false);
    }
  };

  // Buscar sugerencias mientras escribe
  useEffect(() => {
    const buscarSugerencias = async () => {
      if (valorBusqueda.length < 2) {
        setOpcionesAutoComplete([]);
        return;
      }

      // No buscar si estamos en modo edición
      if (isEdit) {
        return;
      }

      setBuscandoSugerencias(true);
      try {
       
        const resultados = await buscarUsuarios(valorBusqueda, { 
          roles: ['estudiante'],
          excluirJugadores: true 
        });
        //console.log(' Resultados de búsqueda:', resultados);
        
        // Formatear opciones para el AutoComplete
        const opcionesFormateadas = resultados.map(usuario => {
          //console.log(' Formateando usuario:', usuario);
          return {
            value: usuario.rut,
            label: `${usuario.rut} - ${usuario.nombre}`,
            rut: usuario.rut,
            nombre: usuario.nombre,
            email: usuario.email,
            usuarioId: usuario.id
          };
        });
        
      //  console.log(' Opciones formateadas:', opcionesFormateadas);
        setOpcionesAutoComplete(opcionesFormateadas);
      } catch (error) {
        console.error('Error buscando sugerencias:', error);
      } finally {
        setBuscandoSugerencias(false);
      }
    };

    const timer = setTimeout(buscarSugerencias, 300);
    return () => clearTimeout(timer);
  }, [valorBusqueda, isEdit]);

  // Seleccionar usuario
  const seleccionarUsuario = (rut, option) => {
  console.log('🎯 Seleccionando usuario:', { rut, option });
  
  if (option) {
    const usuario = {
      id: option.usuarioId,
      rut: option.rut,
      nombre: option.nombre,
      email: option.email
    };
    
    setUsuarioSeleccionado(usuario);
    
    // Establecer el ID del usuario en el formulario
    form.setFieldsValue({ usuarioId: option.usuarioId });
    
    // ✅ Limpiar el campo de búsqueda después de seleccionar
    setValorBusqueda('');
    
    // ✅ Limpiar las opciones del autocomplete
    setOpcionesAutoComplete([]);
  }
};


  const handleSubmit = async (values) => {
    // Validar que se haya seleccionado un usuario en creación
    if (!isEdit && !usuarioSeleccionado) {
      message.error('Debes seleccionar un usuario válido');
      return;
    }

    try {
      setLoading(true);

      // Formatear la fecha si existe
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
        message.success('Jugador creado correctamente');
      }

      navigate('/jugadores');
    } catch (error) {
      console.error('Error guardando jugador:', error);
      const errorMsg = error.response?.data?.message || 
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
    <div style={{ 
      minHeight: '100vh', 
      padding: '2rem', 
      background: '#f5f5f5' 
    }}>
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
          initialValues={{
            estado: 'activo'
          }}
        >
          {/* Usuario con AutoComplete (solo en creación) */}
         {!isEdit ? (
  <>
  <Form.Item name="usuarioId" hidden>
      <Input type="hidden" />
    </Form.Item>
    {/* Mostrar usuario seleccionado PRIMERO */}
    {usuarioSeleccionado && (
      <div style={{
        marginBottom: 16,
        padding: 12,
        background: '#f6ffed',
        border: '1px solid #b7eb8f',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {usuarioSeleccionado.nombre}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {usuarioSeleccionado.rut}
              {usuarioSeleccionado.email && ` • ${usuarioSeleccionado.email}`}
            </div>
          </div>
        </div>
        {/* Botón para cambiar de usuario */}
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

    {/* Campo de búsqueda - solo visible si NO hay usuario seleccionado */}
    {!usuarioSeleccionado && (
      <Form.Item
        name="usuarioId"
        label="Usuario"
        rules={[{ 
          required: true, 
          message: 'Selecciona un usuario' 
        }]}
        validateTrigger="onSubmit"
      >
        <AutoComplete
          value={valorBusqueda}
          options={opcionesAutoComplete}
          onSearch={setValorBusqueda}
          onSelect={(value, option) => seleccionarUsuario(value, option)}
          style={{ width: '100%' }}
          placeholder="Buscar por nombre o RUT"
          allowClear
          onClear={() => {
            setValorBusqueda('');
            setUsuarioSeleccionado(null);
            form.setFieldsValue({ usuarioId: undefined });
          }}
          notFoundContent={
            buscandoSugerencias ? 'Buscando...' :
            valorBusqueda.length < 2 ? 'Escribe al menos 2 caracteres para buscar' :
            'No se encontraron usuarios disponibles'
          }
        />
      </Form.Item>
    )}
  </>
          ) : (
            // Mostrar usuario en modo edición (solo lectura)
            usuarioSeleccionado && (
              <div style={{
                marginBottom: 24,
                padding: 12,
                background: '#f0f2f5',
                borderRadius: 8
              }}>
                <div style={{ marginBottom: 4, color: '#666', fontSize: 14 }}>
                  Usuario
                </div>
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
              </div>
            )
          )}

          {/* Carrera */}
          <Form.Item
            name="carrera"
            label="Carrera"
          >
            <Input 
              placeholder="Ej: Ingeniería Civil Informática" 
              maxLength={100}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Teléfono */}
            <Form.Item
              name="telefono"
              label="Teléfono"
            >
              <Input 
                placeholder="Ej: +56912345678" 
                maxLength={20}
              />
            </Form.Item>

            {/* Estado */}
            <Form.Item
              name="estado"
              label="Estado"
              rules={[{ required: true, message: 'Selecciona el estado' }]}
            >
              <Select placeholder="Selecciona el estado">
                <Option value="activo">Activo</Option>
                <Option value="inactivo">Inactivo</Option>
                <Option value="lesionado">Lesionado</Option>
                <Option value="suspendido">Suspendido</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Fecha de Nacimiento */}
            <Form.Item
              name="fechaNacimiento"
              label="Fecha de Nacimiento"
            >
              <DatePicker 
                format="DD/MM/YYYY"
                placeholder="Selecciona una fecha"
                style={{ width: '100%' }}
              />
            </Form.Item>

            {/* Año de Ingreso */}
            <Form.Item
              name="anioIngreso"
              label="Año de Ingreso"
            >
              <Select placeholder="Selecciona el año" showSearch>
                {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Botones */}
          <Form.Item style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => navigate('/jugadores')}>
                Cancelar
              </Button>
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