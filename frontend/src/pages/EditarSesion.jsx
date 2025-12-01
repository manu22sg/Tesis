import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
App,  Spin,
  ConfigProvider,
  Radio,
  Space
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import locale from 'antd/locale/es_ES';
import 'dayjs/locale/es';
import MainLayout from '../components/MainLayout.jsx';

// Servicios
import { obtenerSesionPorId, actualizarSesion } from '../services/sesion.services.js';
import { obtenerCanchas } from '../services/cancha.services.js';
import { obtenerGrupos } from '../services/grupo.services.js';
import { verificarDisponibilidadSesion } from '../services/horario.services.js';

dayjs.locale('es');

export default function EditarSesion() {
  const { id } = useParams();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp(); 

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canchas, setCanchas] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [tipoUbicacion, setTipoUbicacion] = useState('cancha'); // 'cancha' o 'externa'
  
  // 🔎 Estado para verificación en vivo (debounced)
  const [checkingDisp, setCheckingDisp] = useState(false);
  const [dispOk, setDispOk] = useState(null); // true | false | null

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        // Obtener sesión existente
        const sesion = await obtenerSesionPorId(Number(id));
        if (!sesion) {
          message.error('Sesión no encontrada');
          navigate('/sesiones');
          return;
        }

        // Determinar tipo de ubicación según los datos de la sesión
        const tipoInicial = sesion.ubicacionExterna ? 'externa' : 'cancha';
        setTipoUbicacion(tipoInicial);

        // Obtener canchas disponibles
        const canchasRes = await obtenerCanchas({ estado: 'disponible', limit: 100 });
        const listaCanchas = (canchasRes.canchas || []).map((c) => ({
          label: c.nombre,
          value: Number(c.id),
          capacidad: c.capacidadMaxima,
          descripcion: c.descripcion,
        }));
        setCanchas(listaCanchas);

        // Obtener grupos
        const gruposRes = await obtenerGrupos();
        const listaGrupos = (gruposRes?.data?.grupos || gruposRes?.grupos || []).map((g) => ({
          label: g.nombre,
          value: Number(g.id),
        }));
        setGrupos(listaGrupos);

        // Precargar formulario
        form.setFieldsValue({
          canchaId: sesion.cancha?.id || undefined,
          ubicacionExterna: sesion.ubicacionExterna || undefined,
          grupoId: sesion.grupo?.id || undefined,
          tipoSesion: sesion.tipoSesion,
          objetivos: sesion.objetivos,
          fecha: dayjs(sesion.fecha),
          horario: [
            dayjs(sesion.horaInicio, 'HH:mm'),
            dayjs(sesion.horaFin, 'HH:mm')
          ],
        });
      } catch (err) {
        console.error('Error cargando sesión:', err);
        message.error('No se pudo cargar la sesión');
        navigate('/sesiones');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id, form, navigate]);

  // Limpiar campos cuando cambia el tipo de ubicación
  useEffect(() => {
    if (tipoUbicacion === 'cancha') {
      form.setFieldValue('ubicacionExterna', undefined);
    } else {
      form.setFieldValue('canchaId', undefined);
    }
    // al cambiar el modo de ubicación, reseteamos el indicador de disponibilidad
    setDispOk(null);
  }, [tipoUbicacion, form]);

  // ====== Debounce de verificación en vivo ======
  const canchaId = Form.useWatch('canchaId', form);
  const fecha = Form.useWatch('fecha', form);
  const horario = Form.useWatch('horario', form);

  useEffect(() => {
    // Solo aplica para sesión en cancha
    if (tipoUbicacion !== 'cancha') {
      setDispOk(null);
      return;
    }

    const canCheck =
      canchaId && fecha && Array.isArray(horario) && horario[0] && horario[1];

    if (!canCheck) {
      setDispOk(null);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setCheckingDisp(true);
        const [h1, h2] = horario;
        
        // Validación local simple por si eligen horas iguales o invertidas
        if (!h1 || !h2 || h1.isSame(h2) || h1.isAfter(h2)) {
          setDispOk(null);
          setCheckingDisp(false);
          return;
        }

        // 🔥 Llamada con el parámetro sesionIdExcluir
        const res = await verificarDisponibilidadSesion(
          Number(canchaId),
          fecha.format('YYYY-MM-DD'),
          h1.format('HH:mm'),
          h2.format('HH:mm'),
          Number(id) // Excluir la sesión actual
        );
        setDispOk(!!res?.disponible);
      } catch (e) {
        console.error('Error verificando disponibilidad en vivo:', e);
        setDispOk(null);
      } finally {
        setCheckingDisp(false);
      }
    }, 500); // ⏱️ debounce 500 ms

    return () => clearTimeout(t);
  }, [tipoUbicacion, canchaId, fecha, horario, id]);

  // Guardar cambios
  const onFinish = async (values) => {
    try {
      setSaving(true);

      const [horaInicio, horaFin] = values.horario;

      if (horaInicio.isAfter(horaFin) || horaInicio.isSame(horaFin)) {
        message.error('La hora de inicio debe ser anterior a la hora de fin');
        setSaving(false);
        return;
      }

      const payload = {
        grupoId: values.grupoId || null,
        tipoSesion: values.tipoSesion,
        objetivos: values.objetivos,
        fecha: values.fecha.format('YYYY-MM-DD'),
        horaInicio: horaInicio.format('HH:mm'),
        horaFin: horaFin.format('HH:mm'),
      };

      // Agregar cancha o ubicación externa según el tipo
      if (tipoUbicacion === 'cancha') {
        payload.canchaId = Number(values.canchaId);
        payload.ubicacionExterna = null;

        // ✅ Verificar disponibilidad antes de guardar
        const disponibilidad = await verificarDisponibilidadSesion(
          payload.canchaId,
          payload.fecha,
          payload.horaInicio,
          payload.horaFin,
          Number(id) // Excluir sesión actual
        );

        if (!disponibilidad.disponible) {
          message.error(disponibilidad.message || 'La cancha no está disponible en ese horario');
          setSaving(false);
          return;
        }
      } else {
        payload.ubicacionExterna = values.ubicacionExterna;
        payload.canchaId = null;
      }

      await actualizarSesion(Number(id), payload);
      message.success('Sesión actualizada correctamente');
      navigate('/sesiones');
    } catch (error) {
      console.error('Error actualizando sesión:', error);
      const msg = error.response?.data?.message || 'Error al actualizar la sesión';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Estilos para deshabilitar fines de semana
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-weekends .ant-picker-cell:nth-child(7n+6),
      .hide-weekends .ant-picker-cell:nth-child(7n+7) {
        visibility: hidden;
        pointer-events: none;
      }
      .hide-weekends thead tr th:nth-child(6),
      .hide-weekends thead tr th:nth-child(7) {
        visibility: hidden;
      }
      .timepicker-editar .ant-picker-time-panel-column {
        overflow-y: scroll !important;
        max-height: 200px !important;
        scrollbar-width: none;
      }
      .timepicker-editar .ant-picker-time-panel-column::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (loading) {
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
            title="Editar Sesión de Entrenamiento"
            style={{ maxWidth: 650, margin: '0 auto', borderRadius: 10 }}
          >
            <Form layout="vertical" form={form} onFinish={onFinish}>
              {/* Tipo de Ubicación */}
              <Form.Item label="Ubicación">
                <Radio.Group 
                  value={tipoUbicacion} 
                  onChange={(e) => setTipoUbicacion(e.target.value)}
                >
                  <Space direction="vertical">
                    <Radio value="cancha">Cancha del club</Radio>
                    <Radio value="externa">Ubicación externa</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>

              {/* Cancha (solo si tipo === 'cancha') */}
              {tipoUbicacion === 'cancha' && (
                <Form.Item
                  name="canchaId"
                  label="Cancha"
                  rules={[{ required: true, message: 'Selecciona una cancha' }]}
                >
                  <Select
                    placeholder="Selecciona una cancha"
                    options={canchas}
                    loading={!canchas.length}
                    showSearch
                    optionFilterProp="label"
                    allowClear
                  />
                </Form.Item>
              )}

              {/* Ubicación Externa (solo si tipo === 'externa') */}
              {tipoUbicacion === 'externa' && (
                <Form.Item
                  name="ubicacionExterna"
                  label="Ubicación Externa"
                  rules={[
                    { required: true, message: 'Ingresa la ubicación externa' },
                    { max: 200, message: 'Máximo 200 caracteres' }
                  ]}
                >
                  <Input
                    showCount
                    maxLength={200}
                    placeholder="Ejemplo: Estadio Municipal, Cancha Parque O'Higgins..."
                  />
                </Form.Item>
              )}

              {/* Grupo */}
              <Form.Item name="grupoId" label="Grupo (opcional)">
                <Select
                  allowClear
                  placeholder="Selecciona un grupo"
                  options={grupos}
                  loading={!grupos.length}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>

              {/* Fecha */}
              <Form.Item
                name="fecha"
                label="Fecha"
                rules={[{ required: true, message: 'Selecciona una fecha' }]}
              >
                <DatePicker 
                  format="DD/MM/YYYY" 
                  style={{ width: '100%' }} 
                  disabledDate={(current) => {
                    if (!current) return false;
                    const day = current.day();
                    return day === 0 || day === 6;
                  }}
                  classNames={{ popup: { root: 'hide-weekends' } }}
                />
              </Form.Item>

              {/* Horario con verificación en vivo */}
              <Form.Item
                name="horario"
                label="Horario"
                rules={[{ required: true, message: 'Selecciona el horario' }]}
                extra={
                  tipoUbicacion === 'cancha' && (
                    checkingDisp
                      ? 'Verificando disponibilidad…'
                      : dispOk === true
                        ? '✅ Cancha disponible'
                        : dispOk === false
                          ? '❌ Cancha NO disponible en este horario'
                          : null
                  )
                }
              >
                <TimePicker.RangePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }} 
                  minuteStep={30}
                  disabledTime={() => ({
                    disabledHours: () => [0,1,2,3,4,5,6,7,17,18,19,20,21,22,23],
                    disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i).filter(m => m !== 0 && m !== 30),
                  })}
                  hideDisabledOptions
                  showNow={false}
                  placeholder={['Hora inicio', 'Hora fin']}
                  classNames={{ popup: { root: 'timepicker-editar' } }}
                />
              </Form.Item>

              {/* Tipo de sesión */}
               <Form.Item
                name="tipoSesion"
                label="Tipo de sesión"
                rules={[{ required: true, message: 'Selecciona el tipo de sesión' }]}
              >
                <Select placeholder="Selecciona el tipo de sesión">
                  <Select.Option value="Entrenamiento">Entrenamiento</Select.Option>
                  <Select.Option value="Partido">Partido</Select.Option>
                  <Select.Option value="Partido Amistoso">Partido Amistoso</Select.Option>
                  <Select.Option value="Charla Técnica">Charla Técnica</Select.Option>
                </Select>
              </Form.Item>

              {/* Objetivos */}
              <Form.Item name="objetivos" label="Objetivos (opcional)">
                <Input.TextArea rows={3} placeholder="Describe los objetivos de la sesión" />
              </Form.Item>

              {/* Botones */}
              <Form.Item>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button onClick={() => navigate(-1)}>Cancelar</Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={saving}
                    disabled={tipoUbicacion === 'cancha' && dispOk === false}
                  >
                    Guardar cambios
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