import { Form, Input, InputNumber, Button, message, Select, Spin } from 'antd';
import { crearEvaluacion, actualizarEvaluacion } from '../services/evaluacion.services.js';
import { useEffect, useState } from 'react';
import { obtenerJugadores } from '../services/jugador.services.js';
import { obtenerSesiones } from '../services/sesion.services.js';

export default function EvaluacionForm({ initialValues, onSuccess }) {
  const [form] = Form.useForm();
  const [jugadores, setJugadores] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [loadingJugadores, setLoadingJugadores] = useState(false);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const editando = !!initialValues;

  // 🔹 Cargar valores iniciales
  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
  }, [initialValues]);

  // 🔹 Cargar datos base
  useEffect(() => {
    if (!editando) {
      loadJugadores();
      loadSesiones();
    }
  }, [editando]);

  const loadJugadores = async (q = '') => {
  setLoadingJugadores(true);
  try {
    const data = await obtenerJugadores({ q });
    console.log('🔍 Respuesta completa de obtenerJugadores:', data);
    // ✅ Usa la propiedad jugadores
    setJugadores(Array.isArray(data.jugadores) ? data.jugadores : []);
  } catch (error) {
    console.error('❌ Error cargando jugadores:', error);
    setJugadores([]);
  } finally {
    setLoadingJugadores(false);
  }
};


  const loadSesiones = async (q = '') => {
    setLoadingSesiones(true);
    try {
      const sesionesData = await obtenerSesiones({ q });
      // ⚠️ tus sesiones vienen en un objeto con { sesiones, pagination }
      setSesiones(Array.isArray(sesionesData.sesiones) ? sesionesData.sesiones : []);
    } catch (error) {
      console.error('Error cargando sesiones:', error);
      setSesiones([]);
    } finally {
      setLoadingSesiones(false);
    }
  };

  // 🔹 Envío del formulario
  const onFinish = async (values) => {
    try {
      if (editando) {
        await actualizarEvaluacion({ id: initialValues.id, ...values });
        console.log('Evaluación actualizada:', initialValues.id, values);
        message.success('Evaluación actualizada');
      } else {
        await crearEvaluacion(values);
        message.success('Evaluación creada');
      }
      onSuccess();
    } catch (err) {
      console.error('Error guardando evaluación:', err);
      message.error('Error al guardar');
    }
  };

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={onFinish}
    >
      {/* 🔍 Jugador con búsqueda */}
      {!editando && (
        <Form.Item name="jugadorId" label="Jugador" rules={[{ required: true, message: 'Selecciona un jugador' }]}>
  <Select
    showSearch
    placeholder="Buscar jugador por nombre o RUT..."
    filterOption={false}
    onSearch={loadJugadores}
    notFoundContent={loadingJugadores ? <Spin size="small" /> : 'No encontrado'}
    optionFilterProp="children"
  >
    {jugadores.map(j => (
      <Select.Option key={j.id} value={j.id}>
        {j.usuario?.nombre || `Jugador #${j.id}`} — {j.usuario?.rut || 'Sin RUT'}
      </Select.Option>
    ))}
  </Select>
</Form.Item>
      )}

      {/* 🔍 Sesión con búsqueda */}
      {!editando && (
        <Form.Item name="sesionId" label="Sesión" rules={[{ required: true, message: 'Selecciona una sesión' }]}>
          <Select
            showSearch
            placeholder="Buscar sesión..."
            filterOption={false}
            onSearch={loadSesiones}
            notFoundContent={loadingSesiones ? <Spin size="small" /> : 'No encontrada'}
          >
            {sesiones.map(s => (
              <Select.Option key={s.id} value={s.id}>
                {s.fecha} ({s.horaInicio})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {/* 🧱 Campos numéricos */}
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
