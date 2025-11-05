import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Button, Select, message, Row, Col } from 'antd';
import { upsertEstadistica } from '../services/estadistica.services.js';
import { obtenerSesiones } from '../services/sesion.services.js';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
dayjs.locale('es');

const { Option } = Select;

const FormularioEstadistica = ({
  estadistica = null,
  jugadores = [],
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [cargando, setCargando] = useState(false);
  const [cargandoSesiones, setCargandoSesiones] = useState(false);
  const [sesiones, setSesiones] = useState([]);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (estadistica) {
      form.setFieldsValue({
        jugadorId: estadistica.jugadorId,
        sesionId: estadistica.sesionId,
        goles: estadistica.goles || 0,
        asistencias: estadistica.asistencias || 0,
        tarjetasAmarillas: estadistica.tarjetasAmarillas || 0,
        tarjetasRojas: estadistica.tarjetasRojas || 0,
        minutosJugados: estadistica.minutosJugados || 0,
        arcosInvictos: estadistica.arcosInvictos || 0,
      });
      setJugadorSeleccionado(estadistica.jugadorId);
      cargarSesionesPorJugador(estadistica.jugadorId);
    }
  }, [estadistica]);

  // 🔹 Cuando cambia el jugador, cargar solo sus sesiones
  useEffect(() => {
    if (jugadorSeleccionado) {
      cargarSesionesPorJugador(jugadorSeleccionado);
    } else if (!jugadorSeleccionado && !estadistica) {
      setSesiones([]);
      form.setFieldsValue({ sesionId: undefined }); // Limpiar sesión al limpiar jugador
    }
  }, [jugadorSeleccionado]);

  // 🔹 Cargar sesiones filtradas por jugador
  const cargarSesionesPorJugador = async (jugadorId) => {
    setCargandoSesiones(true);
    try {
      const resultado = await obtenerSesiones({ jugadorId, limit: 50, page: 1 });
      setSesiones(Array.isArray(resultado.sesiones) ? resultado.sesiones : []);
    } catch (error) {
      console.error('❌ Error cargando sesiones por jugador:', error);
      message.error('Error al cargar las sesiones del jugador');
      setSesiones([]);
    } finally {
      setCargandoSesiones(false);
    }
  };

  // 🔹 Manejar cambio de jugador
  const manejarCambioJugador = (value) => {
    setJugadorSeleccionado(value || null);
    // Limpiar la sesión cuando cambia el jugador
    if (value) {
      form.setFieldsValue({ sesionId: undefined });
    }
  };

  // 🔹 Envío del formulario
  const manejarEnvio = async (values) => {
    setCargando(true);
    try {
      await upsertEstadistica(values);
      message.success(
        estadistica
          ? 'Estadística actualizada correctamente'
          : 'Estadística creada correctamente'
      );
      form.resetFields();
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error(error.message || 'Error al guardar la estadística');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={manejarEnvio}
      initialValues={{
        goles: 0,
        asistencias: 0,
        tarjetasAmarillas: 0,
        tarjetasRojas: 0,
        minutosJugados: 0,
        arcosInvictos: 0,
      }}
    >
      <Row gutter={16}>
        {/*  Jugador */}
        <Col span={12}>
          <Form.Item
            name="jugadorId"
            label="Jugador"
            rules={[{ required: true, message: 'Selecciona un jugador' }]}
          >
            <Select
              showSearch
              allowClear={!estadistica}
              placeholder="Buscar jugador por nombre o RUT..."
              filterOption={(input, option) =>
                String(option?.children ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={manejarCambioJugador}
              disabled={!!estadistica}
            >
              {[...jugadores]
                .sort((a, b) =>
                  a.usuario?.nombre?.localeCompare(b.usuario?.nombre || '') || 0
                )
                .map((jugador) => (
                  <Option key={jugador.id} value={jugador.id}>
                    {jugador.usuario?.nombre} {jugador.usuario?.apellido} —{' '}
                    {jugador.usuario?.rut || 'Sin RUT'}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="sesionId"
            label="Sesión"
            rules={[{ required: true, message: 'Selecciona una sesión' }]}
          >
            <Select
              placeholder={
                jugadorSeleccionado
                  ? 'Selecciona una sesión'
                  : 'Primero selecciona un jugador'
              }
              showSearch
              allowClear={!estadistica}
              disabled={!jugadorSeleccionado || !!estadistica}
              loading={cargandoSesiones}
              notFoundContent={
                cargandoSesiones ? 'Cargando sesiones...' : 'No hay sesiones disponibles'
              }
              filterOption={(input, option) =>
                String(option?.children ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {sesiones.map((sesion) => {
                const fecha = formatearFecha(sesion.fecha);
                const horainicio = formatearHora(sesion.horaInicio);
                const horafin = formatearHora(sesion.horaFin);
                return (
                  <Option key={sesion.id} value={sesion.id}>
                    {sesion.nombre} {fecha} — {horainicio} - {horafin}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Campos numéricos */}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="goles" label="Goles">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item name="asistencias" label="Asistencias">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item name="minutosJugados" label="Minutos Jugados">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="tarjetasAmarillas" label="Tarjetas Amarillas">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item name="tarjetasRojas" label="Tarjetas Rojas">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item name="arcosInvictos" label="Arcos Invictos">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={cargando}
          style={{ marginRight: 8 }}
        >
          {estadistica ? 'Actualizar' : 'Crear'} Estadística
        </Button>
        {onCancel && <Button onClick={onCancel}>Cancelar</Button>}
      </Form.Item>
    </Form>
  );
};

export default FormularioEstadistica;