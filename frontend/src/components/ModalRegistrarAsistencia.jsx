import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Button,
  message,
  Space,
  Alert,
  Spin
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { obtenerSesiones } from '../services/sesion.services.js';
import { obtenerJugadores } from '../services/jugador.services.js';
import { registrarAsistenciaManual } from '../services/asistencia.services.js';
import { formatearFecha, formatearHora } from '../utils/formatters.js';

const ESTADOS_ASISTENCIA = [
  { value: 'presente', label: 'Presente', icon: <CheckCircleOutlined />, color: '#52c41a' },
  { value: 'tarde', label: 'Tarde', icon: <ClockCircleOutlined />, color: '#faad14' },
  { value: 'justificado', label: 'Justificado', icon: <QuestionCircleOutlined />, color: '#1890ff' },
  { value: 'ausente', label: 'Ausente', icon: <CloseCircleOutlined />, color: '#ff4d4f' }
];

const ModalRegistrarAsistencia = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingJugadores, setLoadingJugadores] = useState(false);
  const [loadingSesiones, setLoadingSesiones] = useState(false);

  const [jugadores, setJugadores] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);

  useEffect(() => {
    if (visible) {
      cargarJugadores();
      form.resetFields();
      setJugadorSeleccionado(null);
      setSesiones([]);
    }
  }, [visible, form]);

  // Cuando cambia el jugador, cargar sus sesiones
  useEffect(() => {
    if (jugadorSeleccionado) {
      cargarSesionesPorJugador(jugadorSeleccionado);
    } else {
      setSesiones([]);
    }
  }, [jugadorSeleccionado]);

  const cargarJugadores = async (q = '') => {
    setLoadingJugadores(true);
    try {
      const data = await obtenerJugadores({ q, limit: 100 });
      setJugadores(Array.isArray(data.jugadores) ? data.jugadores : []);
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      message.error('Error al cargar los jugadores');
      setJugadores([]);
    } finally {
      setLoadingJugadores(false);
    }
  };

  const cargarSesionesPorJugador = async (jugadorId) => {
    setLoadingSesiones(true);
    try {
      const resultado = await obtenerSesiones({ jugadorId, limit: 50, page: 1 });
      const listaSesiones = Array.isArray(resultado.sesiones) ? resultado.sesiones : [];
      
      // Ordenar por fecha más reciente
      const sesionesOrdenadas = listaSesiones.sort((a, b) => {
        return new Date(b.fecha) - new Date(a.fecha);
      });
      
      setSesiones(sesionesOrdenadas);
      
      if (sesionesOrdenadas.length === 0) {
        message.warning('No hay sesiones disponibles para este jugador');
      }
    } catch (error) {
      console.error('Error cargando sesiones:', error);
      message.error('Error al cargar las sesiones del jugador');
      setSesiones([]);
    } finally {
      setLoadingSesiones(false);
    }
  };

  const handleJugadorChange = (jugadorId) => {
    setJugadorSeleccionado(jugadorId);
    form.setFieldValue('sesionId', undefined);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await registrarAsistenciaManual({
        sesionId: values.sesionId,
        jugadorId: values.jugadorId,
        estado: values.estado
      });

      message.success('Asistencia registrada correctamente');
      form.resetFields();
      setJugadorSeleccionado(null);
      setSesiones([]);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al registrar asistencia';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Registrar Asistencia"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
        {/* Selector de Jugador */}
        <Form.Item
          name="jugadorId"
          label="Jugador"
          rules={[{ required: true, message: 'Selecciona un jugador' }]}
        >
          <Select
            showSearch
            placeholder="Buscar jugador por nombre o RUT..."
            filterOption={false}
            onSearch={cargarJugadores}
            onChange={handleJugadorChange}
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


        {/* Selector de Sesión */}
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
            notFoundContent={loadingSesiones ? <Spin size="small" /> : 'No encontrada'}
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

        {/* Selector de Estado */}
        <Form.Item
          name="estado"
          label="Estado"
          rules={[{ required: true, message: 'Selecciona un estado' }]}
          initialValue="presente"
        >
          <Select placeholder="Selecciona un estado">
            {ESTADOS_ASISTENCIA.map(estado => (
              <Select.Option key={estado.value} value={estado.value}>
                <Space align="center" size={8}>
                  <span style={{ fontSize: 14, color: estado.color }}>{estado.icon}</span>
                  <span style={{ fontSize: 13 }}>{estado.label}</span>
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Botones */}
        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              disabled={!jugadorSeleccionado || sesiones.length === 0}
            >
              Registrar
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalRegistrarAsistencia;