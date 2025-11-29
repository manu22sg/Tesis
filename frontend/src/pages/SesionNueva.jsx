import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  message,
  Spin,
  ConfigProvider,
  Radio,
  Space,
  Checkbox,
  Divider,
  Alert
} from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import locale from 'antd/locale/es_ES';
import MainLayout from '../components/MainLayout.jsx';
import { crearSesion, crearSesionesRecurrentes } from '../services/sesion.services.js';
import { obtenerCanchas } from '../services/cancha.services.js';
import { obtenerGrupos } from '../services/grupo.services.js';
import { verificarDisponibilidadSesion } from '../services/horario.services.js';

dayjs.locale('es');

export default function SesionNueva() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canchas, setCanchas] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [tipoUbicacion, setTipoUbicacion] = useState('cancha');
  const [esRecurrente, setEsRecurrente] = useState(false);

  // 🔎 Estado para verificación en vivo (debounced)
  const [checkingDisp, setCheckingDisp] = useState(false);
  const [dispOk, setDispOk] = useState(null); // true | false | null

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        const canchasRes = await obtenerCanchas({ estado: 'disponible', limit: 100 });
        const listaCanchas = (canchasRes?.canchas || []).map((c) => ({
          label: c.nombre,
          value: Number(c.id),
          capacidad: c.capacidadMaxima,
          descripcion: c.descripcion,
        }));
        setCanchas(listaCanchas);

        const gruposRes = await obtenerGrupos({ limit: 100 });
        const listaGrupos = (gruposRes?.data?.grupos || []).map((g) => ({
          label: g.nombre,
          value: Number(g.id),
        }));
        setGrupos(listaGrupos);
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
        message.error('Error al cargar canchas o grupos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

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

      .timepicker-academico .ant-picker-time-panel-column {
        overflow-y: scroll !important;
        max-height: 200px !important;
        scrollbar-width: none;
      }
      .timepicker-academico .ant-picker-time-panel-column::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Limpiar campos cuando cambia el tipo de ubicación
  useEffect(() => {
    if (!form) return;
    if (tipoUbicacion === 'cancha') {
      form.setFieldValue('ubicacionExterna', undefined);
    } else {
      form.setFieldValue('canchaId', undefined);
    }
    // al cambiar el modo de ubicación, reseteamos el indicador de disponibilidad
    setDispOk(null);
  }, [tipoUbicacion, form]);

  // Limpiar campos según modo (única vs recurrente)
  useEffect(() => {
    if (!form) return;
    if (esRecurrente) {
      form.setFieldValue('fecha', undefined);
    } else {
      form.setFieldValue('fechaInicio', undefined);
      form.setFieldValue('fechaFin', undefined);
      form.setFieldValue('diasSemana', undefined);
    }
    // cambiar modo también resetea indicador
    setDispOk(null);
  }, [esRecurrente, form]);

  // ====== Debounce de verificación en vivo ======
  const canchaId = Form.useWatch('canchaId', form);
  const fecha = Form.useWatch('fecha', form);
  const horario = Form.useWatch('horario', form);

  useEffect(() => {
    // Solo aplica para sesión única en cancha
    if (esRecurrente || tipoUbicacion !== 'cancha') {
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
console.log('🔍 Verificando disponibilidad:');
      console.log('  canchaId:', canchaId, typeof canchaId);
      console.log('  fecha:', fecha?.format('YYYY-MM-DD'));
      console.log('  h1:', h1?.format('HH:mm'));
      console.log('  h2:', h2?.format('HH:mm'));

        const res = await verificarDisponibilidadSesion(
          Number(canchaId),
          fecha.format('YYYY-MM-DD'),
          h1.format('HH:mm'),
          h2.format('HH:mm')
        );
        console.log('✅ Respuesta backend:', res);

        setDispOk(!!res?.disponible);
      } catch (e) {
        console.error('Error verificando disponibilidad en vivo:', e);
        setDispOk(null);
      } finally {
        setCheckingDisp(false);
      }
    }, 500); // ⏱️ debounce 500 ms

    return () => clearTimeout(t);
  }, [esRecurrente, tipoUbicacion, canchaId, fecha, horario]);

  const onFinish = async (values) => {
    try {
      setSaving(true);

      const [horaInicio, horaFin] = values.horario;

      if (horaInicio.isAfter(horaFin) || horaInicio.isSame(horaFin)) {
        message.error('La hora de inicio debe ser anterior a la hora de fin');
        setSaving(false);
        return;
      }

      let payload = {
        tipoSesion: values.tipoSesion,
        objetivos: values.objetivos,
        horaInicio: horaInicio.format('HH:mm'),
        horaFin: horaFin.format('HH:mm'),
      };

      if (values.grupoId !== undefined && values.grupoId !== null && values.grupoId !== '') {
        payload.grupoId = Number(values.grupoId);
      }

      if (tipoUbicacion === 'cancha') {
        payload.canchaId = Number(values.canchaId);
      } else {
        payload.ubicacionExterna = values.ubicacionExterna;
      }

      if (esRecurrente) {
        payload.fechaInicio = values.fechaInicio.format('YYYY-MM-DD');
        payload.fechaFin = values.fechaFin.format('YYYY-MM-DD');
        payload.diasSemana = values.diasSemana;

        const result = await crearSesionesRecurrentes(payload);

        if (result.errores && result.errores.length > 0) {
          message.warning(
            `${result.sesionesCreadas} sesiones creadas. ${result.errores.length} conflictos encontrados.`
          );
        } else {
          message.success(`${result.sesionesCreadas} sesiones creadas correctamente`);
        }
      } else {
        payload.fecha = values.fecha.format('YYYY-MM-DD');

        if (tipoUbicacion === 'cancha') {
          const disponibilidad = await verificarDisponibilidadSesion(
            payload.canchaId,
            payload.fecha,
            payload.horaInicio,
            payload.horaFin
          );
          console.log('✅ Respuesta verificarDisponibilidad:', disponibilidad );


          if (!disponibilidad.disponible) {
            message.error(disponibilidad.message || 'La cancha no está disponible en ese horario');
            setSaving(false);
            return;
          }
        }

        await crearSesion(payload);
        message.success('Sesión creada correctamente');
      }

      navigate('/sesiones');
    } catch (error) {
      console.error('Error creando sesión:', error);
      const msg = error.response?.data?.message || 'Error al crear la sesión';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const diasSemanaOpciones = [
    { label: 'Lunes', value: 1 },
    { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 },
  ];

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <Spin spinning={loading}>
          <Card
            title="Nueva Sesión"
            style={{ maxWidth: 650, margin: '0 auto' }}
          >
            <Form layout="vertical" form={form} onFinish={onFinish}>
              {/* Tipo de Sesión */}
              <Form.Item label="Tipo de programación">
                <Radio.Group
                  value={esRecurrente}
                  onChange={(e) => setEsRecurrente(e.target.value)}
                >
                  <Space direction="vertical">
                    <Radio value={false}>Sesión única</Radio>
                    <Radio value={true}>Sesiones recurrentes (múltiples fechas)</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>

              {esRecurrente && (
                <Alert
                  message="Crear múltiples sesiones automáticamente"
                  description="Se crearán sesiones para todos los días seleccionados dentro del rango de fechas."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Divider />

              {/* Ubicación */}
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

              {/* Cancha */}
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

              {/* Ubicación Externa */}
              {tipoUbicacion === 'externa' && (
                <Form.Item
                  name="ubicacionExterna"
                  label="Ubicación Externa"
                  rules={[
                    { required: true, message: 'Ingresa la ubicación externa' },
                    { max: 200, message: 'Máximo 200 caracteres' },
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

              {/* Fecha única o rango */}
              {!esRecurrente ? (
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
              ) : (
                <>
                  <Form.Item
                    name="fechaInicio"
                    label="Fecha de inicio"
                    rules={[{ required: true, message: 'Selecciona la fecha de inicio' }]}
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

                  <Form.Item
                    name="fechaFin"
                    label="Fecha de fin"
                    rules={[
                      { required: true, message: 'Selecciona la fecha de fin' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const inicio = getFieldValue('fechaInicio');
                          if (!value || !inicio || value.isAfter(inicio)) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Debe ser posterior a la fecha de inicio'));
                        },
                      }),
                    ]}
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      style={{ width: '100%' }}
                      disabledDate={(current) => {
                        if (!current) return false;
                        const day = current.day();
                        const inicio = form.getFieldValue('fechaInicio');
                        return day === 0 || day === 6 || (inicio && current.isBefore(inicio, 'day'));
                      }}
                      classNames={{ popup: { root: 'hide-weekends' } }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="diasSemana"
                    label="Días de la semana"
                    rules={[{ required: true, message: 'Selecciona al menos un día' }]}
                  >
                    <Checkbox.Group options={diasSemanaOpciones} />
                  </Form.Item>
                </>
              )}

              {/* Horario */}
              <Form.Item
                name="horario"
                label="Horario"
                rules={[{ required: true, message: 'Selecciona el horario' }]}
                extra={
                  tipoUbicacion === 'cancha' && !esRecurrente && (
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
    disabledHours: () => [0,1,2,3,4,5,6,7], 
    disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i).filter(m => m !== 0 && m !== 30),
  })}
  hideDisabledOptions
  showNow={false}
  placeholder={['Hora inicio', 'Hora fin']}
  classNames={{ popup: { root: 'timepicker-academico' } }}
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
                    disabled={
                      !esRecurrente &&
                      tipoUbicacion === 'cancha' &&
                      dispOk === false
                    }
                  >
                    {esRecurrente ? 'Crear sesiones' : 'Crear sesión'}
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Card>
        </Spin>
      </ConfigProvider>
    </MainLayout>
  );
}
