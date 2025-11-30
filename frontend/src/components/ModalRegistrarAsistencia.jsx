import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Form,
  Select,
  Button,
  message,
  Space,
  Spin,
  Radio
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
  const [busquedaJugador, setBusquedaJugador] = useState('');
  
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setJugadorSeleccionado(null);
      setSesiones([]);
      setBusquedaJugador('');
      setJugadores([]);
    }
  }, [visible, form]);

  useEffect(() => {
    if (jugadorSeleccionado) {
      cargarSesionesPorJugador(jugadorSeleccionado);
    } else {
      setSesiones([]);
    }
  }, [jugadorSeleccionado]);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const handleBuscarJugadores = (value) => {
    setBusquedaJugador(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!value || value.trim().length < 2) {
      setJugadores([]);
      setLoadingJugadores(false);
      return;
    }

    setLoadingJugadores(true);

    searchTimeout.current = setTimeout(() => {
      buscarJugadores(value.trim());
    }, 500);
  };

  const buscarJugadores = async (q) => {
    setLoadingJugadores(true);
    try {
      const data = await obtenerJugadores({ q, limit: 100 });
      setJugadores(Array.isArray(data.jugadores) ? data.jugadores : []);
    } catch (error) {
      console.error('Error buscando jugadores:', error);
      message.error('Error al buscar los jugadores');
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
        estado: values.estado,
        entregoMaterial: values.entregoMaterial === 'null' ? null : values.entregoMaterial === 'true'
      });

      message.success('Asistencia registrada correctamente');
      form.resetFields();
      setJugadorSeleccionado(null);
      setSesiones([]);
      setBusquedaJugador('');
      setJugadores([]);
      
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
            searchValue={busquedaJugador}
            onSearch={handleBuscarJugadores}
            onChange={handleJugadorChange}
            loading={loadingJugadores}
            notFoundContent={
              loadingJugadores ? (
                <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <Spin size="small" />
                </div>
              ) : busquedaJugador.trim().length > 0 && busquedaJugador.trim().length < 2 ? (
                <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                  Escribe al menos 2 caracteres
                </div>
              ) : busquedaJugador.trim().length >= 2 && jugadores.length === 0 ? (
                <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                  No se encontraron jugadores
                </div>
              ) : jugadores.length === 0 ? (
                <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                  Escribe para buscar...
                </div>
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
            notFoundContent={
              loadingSesiones ? (
                <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <Spin size="small" />
                </div>
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

        {/* 🆕 Entregó Material */}
        <Form.Item
          name="entregoMaterial"
          label="¿Entregó Material?"
          initialValue="null"
        >
          <Radio.Group>
            <Space direction="vertical">
              <Radio value="true">Sí</Radio>
              <Radio value="false">No</Radio>
              <Radio value="null">No aplica</Radio>
            </Space>
          </Radio.Group>
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