import { Form, Input, InputNumber, Button, App, Select, Spin } from 'antd';
import { crearEvaluacion, actualizarEvaluacion } from '../services/evaluacion.services.js';
import { useEffect, useState, useRef } from 'react';
import { obtenerJugadores } from '../services/jugador.services.js';
import { obtenerSesiones } from '../services/sesion.services.js';
import { formatearFecha, formatearHora } from '../utils/formatters.js';

export default function EvaluacionForm({ initialValues, onSuccess }) {
  const [form] = Form.useForm();
  const [jugadores, setJugadores] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [loadingJugadores, setLoadingJugadores] = useState(false);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [busquedaJugador, setBusquedaJugador] = useState('');
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const { message } = App.useApp(); 

  const editando = !!initialValues;
  const searchTimeout = useRef(null);

  //  Cargar valores iniciales (modo edición)
  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
  }, [initialValues]);

  //  Cuando cambia el jugador seleccionado, cargar SOLO sus sesiones
  useEffect(() => {
    if (jugadorSeleccionado) {
      loadSesionesPorJugador(jugadorSeleccionado);
      form.setFieldValue('sesionId', undefined);
    } else {
      setSesiones([]);
    }
  }, [jugadorSeleccionado]);

  // Debounce para búsqueda de jugadores
  const handleBuscarJugadores = (value) => {
    setBusquedaJugador(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Si está vacío, limpiar
    if (!value || value.trim() === '') {
      setMostrarAdvertencia(false);
      setJugadores([]);
      setLoadingJugadores(false);
      return;
    }

    // Establecer loading inmediatamente antes del debounce
    setLoadingJugadores(true);

    // Buscar con debounce
    searchTimeout.current = setTimeout(() => {
      loadJugadores(value.trim());
      setMostrarAdvertencia(false);
    }, 500);
  };

  const loadJugadores = async (q = '') => {
    setLoadingJugadores(true);
    try {
      const params = { limit: 50 };
      if (q && q.trim()) {
        params.q = q.trim();
      }
      const data = await obtenerJugadores(params);
      setJugadores(Array.isArray(data.jugadores) ? data.jugadores : []);
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      setJugadores([]);
    } finally {
      setLoadingJugadores(false);
    }
  };

  //  Cargar sesiones filtradas por jugador
  const loadSesionesPorJugador = async (jugadorId) => {
    setLoadingSesiones(true);
    try {
      const resultado = await obtenerSesiones({ jugadorId, limit: 50, page: 1 });
      const listaSesiones = Array.isArray(resultado.sesiones) ? resultado.sesiones : [];
      
      const sesionesOrdenadas = listaSesiones.sort((a, b) => {
        return new Date(b.fecha) - new Date(a.fecha);
      });
      
      setSesiones(sesionesOrdenadas);
      
      if (sesionesOrdenadas.length === 0) {
        message.warning('No hay sesiones disponibles para este jugador');
      }
    } catch (error) {
      console.error('Error cargando sesiones por jugador:', error);
      message.error('Error al cargar las sesiones del jugador');
      setSesiones([]);
    } finally {
      setLoadingSesiones(false);
    }
  };

  //  Envío del formulario
  const onFinish = async (values) => {
    try {
      if (editando) {
        await actualizarEvaluacion({ id: initialValues.id, ...values });
        message.success('Evaluación actualizada');
      } else {
        await crearEvaluacion(values);
        message.success('Evaluación creada');
      }
      onSuccess();
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Error al guardar la evaluación';
      message.error(errorMsg);
    }
  };

  return (
    <Form layout="vertical" form={form} onFinish={onFinish}>
      {!editando && (
        <Form.Item
          name="jugadorId"
          label="Jugador"
          rules={[{ required: true, message: 'Selecciona un jugador' }]}
        >
          <Select
            showSearch
            placeholder="Buscar jugador por nombre o RUT..."
            filterOption={false}
            onSearch={handleBuscarJugadores}
            onChange={(value) => {
              setJugadorSeleccionado(value);
              setMostrarAdvertencia(false);
              setBusquedaJugador('');
            }}
            notFoundContent={
              loadingJugadores ? (
                <Spin size="small" />
              ) : jugadores.length === 0 ? (
                busquedaJugador.trim() ? (
                  'No se encontraron jugadores'
                ) : (
                  <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                    Escriba para buscar jugadores...
                  </div>
                )
              ) : null
            }
          >
            {jugadores.map((j) => (
              <Select.Option key={j.id} value={j.id}>
                {`${j.usuario?.nombre || 'Sin nombre'} ${j.usuario?.apellido || ''} — ${j.usuario?.rut || 'Sin RUT'}`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {!editando && (
        <Form.Item
          name="sesionId"
          label="Sesión"
          rules={[{ required: true, message: 'Selecciona una sesión' }]}
        >
          <Select
            showSearch
            placeholder={
              jugadorSeleccionado
                ? 'Selecciona una sesión del jugador'
                : 'Primero selecciona un jugador'
            }
            disabled={!jugadorSeleccionado}
            notFoundContent={
              loadingSesiones ? (
                <Spin size="small" />
              ) : jugadorSeleccionado && sesiones.length === 0 ? (
                'No hay sesiones disponibles para este jugador'
              ) : (
                'Selecciona un jugador primero'
              )
            }
            filterOption={(input, option) => {
              const text = String(option?.children ?? '').toLowerCase();
              return text.includes(input.toLowerCase());
            }}
          >
            {sesiones.map((s) => {
              const fecha = formatearFecha(s.fecha);
              const horaInicio = formatearHora(s.horaInicio);
              const horaFin = s.horaFin ? formatearHora(s.horaFin) : '';
              const tipoSesion = s.tipoSesion || 'Entrenamiento';
              const ubicacion = s.cancha?.nombre || s.ubicacionExterna || '';
              
              return (
                <Select.Option key={s.id} value={s.id}>
                  {`${tipoSesion} - ${fecha} - ${horaInicio}${horaFin ? ` - ${horaFin}` : ''}`}
                  {ubicacion && ` (${ubicacion})`}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
      )}

      <Form.Item 
        name="tecnica" 
        label="Técnica"
        rules={[
          { required: true, message: 'Ingrese una calificación' },
          { type: 'number', min: 1, max: 10, message: 'Debe ser entre 1 y 10' }
        ]}
      >
        <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="1-10" />
      </Form.Item>

      <Form.Item 
        name="tactica" 
        label="Táctica"
        rules={[
          { required: true, message: 'Ingrese una calificación' },
          { type: 'number', min: 1, max: 10, message: 'Debe ser entre 1 y 10' }
        ]}
      >
        <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="1-10" />
      </Form.Item>

      <Form.Item 
        name="actitudinal" 
        label="Actitudinal"
        rules={[
          { required: true, message: 'Ingrese una calificación' },
          { type: 'number', min: 1, max: 10, message: 'Debe ser entre 1 y 10' }
        ]}
      >
        <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="1-10" />
      </Form.Item>

      <Form.Item 
        name="fisica" 
        label="Física"
        rules={[
          { required: true, message: 'Ingrese una calificación' },
          { type: 'number', min: 1, max: 10, message: 'Debe ser entre 1 y 10' }
        ]}
      >
        <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="1-10" />
      </Form.Item>

      <Form.Item name="observaciones" label="Observaciones">
        <Input.TextArea rows={3} placeholder="Observaciones adicionales (opcional)" />
      </Form.Item>

      <Button type="primary" htmlType="submit" block>
        {editando ? 'Actualizar' : 'Guardar'}
      </Button>
    </Form>
  );
}