import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  App,
  Spin,
  ConfigProvider,
  Radio,
  Space,
  Alert
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
  const [tipoUbicacion, setTipoUbicacion] = useState('cancha');

  // 🔎 Estado para verificación en vivo (debounced)
  const [checkingDisp, setCheckingDisp] = useState(false);
  const [dispOk, setDispOk] = useState(null);
  const [dispMessage, setDispMessage] = useState(''); // 🆕 Guardar mensaje específico
  const [duracionExcedida, setDuracionExcedida] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        const sesion = await obtenerSesionPorId(Number(id));
        if (!sesion) {
          message.error('Sesión no encontrada');
          navigate('/sesiones');
          return;
        }

        const tipoInicial = sesion.ubicacionExterna ? 'externa' : 'cancha';
        setTipoUbicacion(tipoInicial);

        const canchasRes = await obtenerCanchas({ estado: 'disponible', limit: 100 });
        const listaCanchas = (canchasRes.canchas || [])
  .filter(c => c.capacidadMaxima === 64) // 👈 SOLO la principal
  .map((c) => ({
    label: c.nombre,
    value: Number(c.id),
    capacidad: c.capacidadMaxima,
    descripcion: c.descripcion,
  }));

setCanchas(listaCanchas);

        const gruposRes = await obtenerGrupos();
        const listaGrupos = (gruposRes?.data?.grupos || gruposRes?.grupos || []).map((g) => ({
          label: g.nombre,
          value: Number(g.id),
        }));
        setGrupos(listaGrupos);

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
    setDispOk(null);
    setDispMessage(''); // 🆕 Limpiar mensaje
    setDuracionExcedida(false);
  }, [tipoUbicacion, form]);

  // ====== Debounce de verificación en vivo ======
  const canchaId = Form.useWatch('canchaId', form);
  const fecha = Form.useWatch('fecha', form);
  const horario = Form.useWatch('horario', form);

  useEffect(() => {
    if (tipoUbicacion !== 'cancha') {
      setDispOk(null);
      setDispMessage(''); // 🆕 Limpiar mensaje
      setDuracionExcedida(false);
      return;
    }

    const canCheck =
      canchaId && fecha && Array.isArray(horario) && horario[0] && horario[1];

    if (!canCheck) {
      setDispOk(null);
      setDispMessage(''); // 🆕 Limpiar mensaje
      setDuracionExcedida(false);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setCheckingDisp(true);
        const [h1, h2] = horario;

        if (!h1 || !h2 || h1.isSame(h2) || h1.isAfter(h2)) {
          setDispOk(null);
          setDispMessage(''); // 🆕 Limpiar mensaje
          setDuracionExcedida(false);
          setCheckingDisp(false);
          return;
        }

        // ✅ Validación de duración máxima (3 horas)
        const duracionMinutos = h2.diff(h1, 'minutes');
        if (duracionMinutos > 180) {
          setDuracionExcedida(true);
          setDispOk(null);
          setDispMessage(''); // 🆕 Limpiar mensaje
          setCheckingDisp(false);
          return;
        } else {
          setDuracionExcedida(false);
        }

        // 🔥 Llamada al API
        const res = await verificarDisponibilidadSesion(
          Number(canchaId),
          fecha.format('YYYY-MM-DD'),
          h1.format('HH:mm'),
          h2.format('HH:mm'),
          Number(id) // Excluir la sesión actual
        );

        setDispOk(!!res?.disponible);
        setDispMessage(res?.message || ''); // 🆕 Guardar mensaje específico
        
      } catch (e) {
        console.error('Error verificando disponibilidad en vivo:', e);
        setDispOk(false);
        setDispMessage('Error al verificar disponibilidad'); // 🆕 Mensaje de error
      } finally {
        setCheckingDisp(false);
      }
    }, 500);

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

      const duracionMinutos = horaFin.diff(horaInicio, 'minutes');
      if (duracionMinutos > 180) {
        message.error('La duración máxima permitida es de 3 horas (180 minutos)');
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

      if (tipoUbicacion === 'cancha') {
        payload.canchaId = Number(values.canchaId);
        payload.ubicacionExterna = null;

        const disponibilidad = await verificarDisponibilidadSesion(
          payload.canchaId,
          payload.fecha,
          payload.horaInicio,
          payload.horaFin,
          Number(id)
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

      let errorMsg = 'Error al actualizar la sesión';

      if (error.response?.data) {
        const data = error.response.data;

        if (data.errors) {
          if (Array.isArray(data.errors)) {
            errorMsg = data.errors[0]?.msg || errorMsg;
          } else if (typeof data.errors === 'object') {
            errorMsg = Object.values(data.errors)[0] || errorMsg;
          }
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.message) {
          errorMsg = data.message;
        }
      }

      message.error(errorMsg);
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

              {tipoUbicacion === 'cancha' && (
                <Form.Item
                  name="canchaId"
                  label="Cancha"
                  rules={[{ required: true, message: 'Seleccione una cancha' }]}
                >
                  <Select
                    placeholder="Seleccione una cancha"
                    options={canchas}
                    loading={!canchas.length}
                    showSearch
                    optionFilterProp="label"
                    allowClear
                  />
                </Form.Item>
              )}

              {tipoUbicacion === 'externa' && (
                <Form.Item
                  name="ubicacionExterna"
                  label="Ubicación Externa"
                  rules={[
                    { required: true, message: 'Ingrese la ubicación externa' },
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

              <Form.Item name="grupoId" label="Grupo (opcional)">
                <Select
                  allowClear
                  placeholder="Seleccione un grupo"
                  options={grupos}
                  loading={!grupos.length}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>

              <Form.Item
                name="fecha"
                label="Fecha"
                rules={[{ required: true, message: 'Seleccione una fecha' }]}
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
                name="horario"
                label="Horario"
                rules={[
  { required: true, message: 'Seleccione el horario' },
  {
    validator(_, value) {
      if (!value || !value[0] || !value[1]) return Promise.resolve();

      const inicio = value[0];
      const fin = value[1];

      // ❌ Bloquear inicio = 22:00
      if (inicio.hour() === 22) {
        return Promise.reject(
          new Error("La sesión no puede comenzar a las 22:00")
        );
      }

      // ❌ No permitir que termine después de 22:00
      if (fin.hour() > 22 || (fin.hour() === 22 && fin.minute() > 0)) {
        return Promise.reject(
          new Error("La sesión no puede terminar después de las 22:00")
        );
      }

      return Promise.resolve();
    }
  }
]}

              >
                <TimePicker.RangePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                  minuteStep={30}
                  disabledTime={() => ({
  disabledHours: () => {
    const disabled = [];

    // ❌ Bloquear horas 0–7 (antes de 08:00)
    for (let h = 0; h < 8; h++) disabled.push(h);

    // ❌ Bloquear hora 22 para inicio, pero permitida solo para FIN
    // Para que el usuario NO pueda elegir 22 como hora de inicio
    // → Esto se bloquea con validator, sigue abajo.

    // ❌ Bloquear hora 23
    disabled.push(23);

    return disabled;
  },

  disabledMinutes: (selectedHour, selectedType) => {
    // selectedType = "start" | "end"
    // solo en RangePicker

    // 🛑 Si es FIN y la hora es 22 → permitir SOLO 00
    if (selectedType === "end" && selectedHour === 22) {
      return Array.from({ length: 60 }, (_, i) => i).filter(m => m !== 0);
    }

    // 🛑 Si es INICIO y la hora es 22 → bloquear TODOS los minutos
    if (selectedType === "start" && selectedHour === 22) {
      return Array.from({ length: 60 }, (_, i) => i); // todos bloqueados
    }

    // 🛑 Todas las demás horas → solo permitir :00 y :30
    return Array.from({ length: 60 }, (_, i) => i).filter(
      (m) => m !== 0 && m !== 30
    );
  },
})}
                  hideDisabledOptions
                  showNow={false}
                  placeholder={['Hora inicio', 'Hora fin']}
                  classNames={{ popup: { root: 'timepicker-editar' } }}
                />
              </Form.Item>

              {/* ✅ Alertas de validación separadas con mensajes dinámicos */}
              {tipoUbicacion === 'cancha' && (
                <>
                  {/* Alerta de duración excedida */}
                  {duracionExcedida && (
                    <Alert
                      message="La duración máxima permitida es de 3 horas (180 minutos)"
                      type="warning"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  {/* Alerta de verificación de disponibilidad */}
                  {!duracionExcedida && (
                    <>
                      {checkingDisp && (
                        <Alert
                          message="Verificando disponibilidad..."
                          type="info"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      )}

                      {!checkingDisp && dispOk === true && (
                        <Alert
                          message=" Cancha disponible"
                          type="success"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      )}

                      {!checkingDisp && dispOk === false && (
                        <Alert
                          message={dispMessage || 'Cancha NO disponible en este horario'} // 🆕 MENSAJE DINÁMICO
                          type="error"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              <Form.Item
                name="tipoSesion"
                label="Tipo de sesión"
                rules={[{ required: true, message: 'Seleccione el tipo de sesión' }]}
              >
                <Select placeholder="Seleccione el tipo de sesión">
                  <Select.Option value="Entrenamiento">Entrenamiento</Select.Option>
                  <Select.Option value="Partido">Partido</Select.Option>
                  <Select.Option value="Partido Amistoso">Partido Amistoso</Select.Option>
                  <Select.Option value="Charla Técnica">Charla Técnica</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="objetivos" label="Objetivos (opcional)">
                <Input.TextArea rows={3} placeholder="Describe los objetivos de la sesión" />
              </Form.Item>

              <Form.Item>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button onClick={() => navigate(-1)}>Cancelar</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    disabled={
                      (tipoUbicacion === 'cancha' && (dispOk === false || duracionExcedida))
                    }
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