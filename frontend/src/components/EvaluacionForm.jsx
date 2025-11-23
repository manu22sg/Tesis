import { Form, Input, InputNumber, Button, message, Select, Spin } from 'antd';
import { crearEvaluacion, actualizarEvaluacion } from '../services/evaluacion.services.js';
import { useEffect, useState } from 'react';
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
  const editando = !!initialValues;

  //  Cargar valores iniciales (modo edición)
  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
  }, [initialValues]);

  //  Cargar datos base (modo creación)
  useEffect(() => {
    if (!editando) {
      loadJugadores();
    }
  }, [editando]);

  //  Cuando cambia el jugador seleccionado, cargar SOLO sus sesiones
  useEffect(() => {
    if (jugadorSeleccionado) {
      loadSesionesPorJugador(jugadorSeleccionado);
    } else {
      setSesiones([]); // limpiar sesiones si no hay jugador
    }
  }, [jugadorSeleccionado]);

  const loadJugadores = async (q = '') => {
    setLoadingJugadores(true);
    try {
      const data = await obtenerJugadores({ q });
      setJugadores(Array.isArray(data.jugadores) ? data.jugadores : []);
    } catch (error) {
      console.error(' Error cargando jugadores:', error);
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
      setSesiones(Array.isArray(resultado.sesiones) ? resultado.sesiones : []);
    } catch (error) {
      console.error(' Error cargando sesiones por jugador:', error);
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
      {/* Jugador */}
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
            onSearch={loadJugadores}
            onChange={(value) => setJugadorSeleccionado(value)} 
            notFoundContent={loadingJugadores ? <Spin size="small" /> : 'No encontrado'}
            optionFilterProp="children"
          >
            {jugadores.map((j) => (
              <Select.Option key={j.id} value={j.id}>
{`${j.usuario?.nombre || 'Sin nombre'} ${j.usuario?.apellido || ''} — ${j.usuario?.rut || 'Sin RUT'}`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {/* Sesión dependiente del jugador */}
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
                ? 'Selecciona una sesión del grupo del jugador'
                : 'Primero selecciona un jugador'
            }
            disabled={!jugadorSeleccionado}
            notFoundContent={loadingSesiones ? <Spin size="small" /> : 'No encontrada'}
            filterOption={(input, option) =>
              String(option?.children ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {sesiones.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {formatearFecha(s.fecha)} - {formatearHora(s.horaInicio)} - {formatearHora(s.horaFin)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {/*  Campos numéricos */}
      <Form.Item name="tecnica" label="Técnica">
        <InputNumber min={1} max={10} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="tactica" label="Táctica">
        <InputNumber min={1} max={10} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="actitudinal" label="Actitudinal">
        <InputNumber min={1} max={10} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="fisica" label="Física">
        <InputNumber min={1} max={10} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="observaciones" label="Observaciones">
        <Input.TextArea rows={3} />
      </Form.Item>

      <Button type="primary" htmlType="submit" block>
        {editando ? 'Actualizar' : 'Guardar'}
      </Button>
    </Form>
  );
}
