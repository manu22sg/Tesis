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
  ConfigProvider
} from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import locale from 'antd/locale/es_ES';
import MainLayout from '../components/MainLayout.jsx';
// Servicios
import { crearSesion } from '../services/sesion.services.js';
import { obtenerCanchas } from '../services/cancha.services.js';
import { obtenerGrupos } from '../services/grupo.services.js';
import { verificarDisponibilidad } from '../services/horario.services.js';

dayjs.locale('es');

export default function SesionNueva() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canchas, setCanchas] = useState([]);
  const [grupos, setGrupos] = useState([]);

  // 🔹 Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        // Obtener canchas disponibles
        const canchasRes = await obtenerCanchas({ estado: 'disponible', limit: 100 });
        const listaCanchas = (canchasRes || []).map((c) => ({
          label: c.nombre,
          value: c.id,
          capacidad: c.capacidadMaxima,
          descripcion: c.descripcion,
        }));
        setCanchas(listaCanchas);

        // Obtener grupos
        const gruposRes = await obtenerGrupos();
        const listaGrupos = (gruposRes || []).map((g) => ({
          label: g.nombre,
          value: g.id,
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

  // 🔹 Estilos para ocultar fines de semana
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

  // 🔹 Crear nueva sesión con validación de disponibilidad
  const onFinish = async (values) => {
    try {
      setSaving(true);

      // ✅ Validación Frontend: Hora inicio < Hora fin
      if (values.horaInicio.isAfter(values.horaFin) || values.horaInicio.isSame(values.horaFin)) {
        message.error('La hora de inicio debe ser anterior a la hora de fin');
        setSaving(false);
        return;
      }

      const payload = {
        canchaId: values.canchaId,
        grupoId: values.grupoId || null,
        tipoSesion: values.tipoSesion,
        objetivos: values.objetivos,
        fecha: values.fecha.format('YYYY-MM-DD'),
        horaInicio: values.horaInicio.format('HH:mm'),
        horaFin: values.horaFin.format('HH:mm'),
      };

      // 🧩 Verificar disponibilidad antes de crear
      const disponibilidad = await verificarDisponibilidad(
        payload.canchaId,
        payload.fecha,
        payload.horaInicio,
        payload.horaFin
      );

      if (!disponibilidad.disponible) {
        message.error(disponibilidad.message || 'La cancha no está disponible en ese horario');
        setSaving(false);
        return;
      }

      // Crear sesión
      await crearSesion(payload);
      message.success('Sesión creada correctamente');
      navigate('/sesiones');
    } catch (error) {
      console.error('Error creando sesión:', error);
      const msg = error.response?.data?.message || 'Error al crear la sesión';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ConfigProvider locale={locale}> 
        <Card
          title="Nueva Sesión de Entrenamiento"
          style={{ maxWidth: 650, margin: '0 auto' }}
        >
          <Form layout="vertical" form={form} onFinish={onFinish}>
            {/* 🔸 Cancha */}
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
              />
            </Form.Item>

            {/* 🔸 Grupo */}
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

            {/* 🔸 Fecha - Solo días de semana */}
            <Form.Item
              name="fecha"
              label="Fecha"
              rules={[{ required: true, message: 'Selecciona una fecha' }]}
            >
              <DatePicker 
                format="DD/MM/YYYY" 
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  if (!current) return true;
                  const day = current.day();
                  return day === 0 || day === 6;
                }}
                classNames={{ popup: 'hide-weekends' }}
              />
            </Form.Item>

            {/* 🔸 Hora Inicio - Horario laboral 8:00 - 14:30 */}
            <Form.Item
              name="horaInicio"
              label="Hora de inicio"
              rules={[{ required: true, message: 'Selecciona hora de inicio' }]}
            >
              <TimePicker 
                format="HH:mm" 
                style={{ width: '100%' }} 
                minuteStep={30}
                disabledTime={() => ({
                  disabledHours: () => [0,1,2,3,4,5,6,7,17,18,19,20,21,22,23],
                  disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i).filter(m => m !== 0 && m !== 30),
                })}
                hideDisabledOptions
                showNow={false}
                classNames={{ popup: 'timepicker-academico' }}
              />
            </Form.Item>

            {/* 🔸 Hora Fin - Horario laboral 8:00 - 14:30 */}
            <Form.Item
              name="horaFin"
              label="Hora de fin"
              rules={[{ required: true, message: 'Selecciona hora de fin' }]}
            >
              <TimePicker 
                format="HH:mm" 
                style={{ width: '100%' }} 
                minuteStep={30}
                disabledTime={() => ({
                  disabledHours: () => [0,1,2,3,4,5,6,7,15,16,17,18,19,20,21,22,23],
                  disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i).filter(m => m !== 0 && m !== 30),
                })}
                hideDisabledOptions
                showNow={false}
                classNames={{ popup: 'timepicker-academico' }}
              />
            </Form.Item>

            {/* 🔸 Tipo */}
            <Form.Item
              name="tipoSesion"
              label="Tipo de sesión"
              rules={[{ required: true, message: 'Ingresa el tipo de sesión' }]}
            >
              <Input
                showCount
                maxLength={50}
                placeholder="Ejemplo: técnica, táctica, fuerza, resistencia..."
              />
            </Form.Item>

            {/* 🔸 Objetivos */}
            <Form.Item name="objetivos" label="Objetivos (opcional)">
              <Input.TextArea rows={3} placeholder="Describe los objetivos de la sesión" />
            </Form.Item>

            {/* 🔸 Botones */}
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button onClick={() => navigate(-1)}>Cancelar</Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Crear sesión
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </ConfigProvider>
    </MainLayout>
  );
}