import React, { useEffect, useState, useRef } from 'react';
import { Form, InputNumber, Button, Select, message, Row, Col, Spin, Divider, Typography } from 'antd';
import { upsertEstadistica } from '../services/estadistica.services.js';
import { obtenerSesiones } from '../services/sesion.services.js';
import { obtenerJugadores } from '../services/jugador.services.js';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { formatearFecha, formatearHora } from '../utils/formatters.js';
dayjs.locale('es');

const { Option } = Select;
const { Title } = Typography;

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
  const [esPortero, setEsPortero] = useState(false);
  
  // Estados de búsqueda de jugadores
  const [busquedaJugador, setBusquedaJugador] = useState('');
  const [jugadoresBusqueda, setJugadoresBusqueda] = useState([]);
  const [loadingBusquedaJugador, setLoadingBusquedaJugador] = useState(false);
  const searchTimeout = useRef(null);

  // Verificar si el jugador es portero
  const verificarEsPortero = (jugadorId) => {
    const jugador = [...jugadoresBusqueda, ...jugadores].find(j => j.id === jugadorId);
    if (!jugador) return false;
    
    const posicion = jugador.posicion?.toLowerCase() || '';
    const posicionSec = jugador.posicionSecundaria?.toLowerCase() || '';
    
    return posicion.includes('portero') || 
           posicion.includes('arquero') ||
           posicionSec.includes('portero') || 
           posicionSec.includes('arquero');
  };

  // Cargar datos si estamos editando
  useEffect(() => {
    if (estadistica) {
      form.setFieldsValue({
        jugadorId: estadistica.jugadorId,
        sesionId: estadistica.sesionId,
        goles: estadistica.goles || 0,
        asistencias: estadistica.asistencias || 0,
        tirosAlArco: estadistica.tirosAlArco || 0,
        tirosTotales: estadistica.tirosTotales || 0,
        regatesExitosos: estadistica.regatesExitosos || 0,
        regatesIntentados: estadistica.regatesIntentados || 0,
        pasesCompletados: estadistica.pasesCompletados || 0,
        pasesIntentados: estadistica.pasesIntentados || 0,
        intercepciones: estadistica.intercepciones || 0,
        recuperaciones: estadistica.recuperaciones || 0,
        duelosGanados: estadistica.duelosGanados || 0,
        duelosTotales: estadistica.duelosTotales || 0,
        despejes: estadistica.despejes || 0,
        atajadas: estadistica.atajadas || 0,
        golesRecibidos: estadistica.golesRecibidos || 0,
        arcosInvictos: estadistica.arcosInvictos || 0,
        tarjetasAmarillas: estadistica.tarjetasAmarillas || 0,
        tarjetasRojas: estadistica.tarjetasRojas || 0,
        minutosJugados: estadistica.minutosJugados || 0,
      });
      setJugadorSeleccionado(estadistica.jugadorId);
      setEsPortero(verificarEsPortero(estadistica.jugadorId));
      cargarSesionesPorJugador(estadistica.jugadorId);
    }
  }, [estadistica, form]);

  // Cuando cambia el jugador, cargar solo sus sesiones
  useEffect(() => {
    if (jugadorSeleccionado) {
      cargarSesionesPorJugador(jugadorSeleccionado);
      setEsPortero(verificarEsPortero(jugadorSeleccionado));
    } else if (!jugadorSeleccionado && !estadistica) {
      setSesiones([]);
      setEsPortero(false);
      form.setFieldsValue({ sesionId: undefined });
    }
  }, [jugadorSeleccionado, estadistica, form]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // 🔥 Handler de búsqueda con debounce
  const handleBuscarJugadores = (value) => {
    setBusquedaJugador(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!value || value.trim().length < 2) {
      setJugadoresBusqueda([]);
      setLoadingBusquedaJugador(false);
      return;
    }

    setLoadingBusquedaJugador(true);

    searchTimeout.current = setTimeout(() => {
      buscarJugadores(value.trim());
    }, 500);
  };

  const buscarJugadores = async (q) => {
    setLoadingBusquedaJugador(true);
    try {
      const data = await obtenerJugadores({ q, limit: 100 });
      setJugadoresBusqueda(Array.isArray(data.jugadores) ? data.jugadores : []);
    } catch (error) {
      console.error('Error buscando jugadores:', error);
      setJugadoresBusqueda([]);
    } finally {
      setLoadingBusquedaJugador(false);
    }
  };

  // Cargar sesiones filtradas por jugador
  const cargarSesionesPorJugador = async (jugadorId) => {
    setCargandoSesiones(true);
    try {
      const resultado = await obtenerSesiones({ jugadorId, limit: 50, page: 1 });
      setSesiones(Array.isArray(resultado.sesiones) ? resultado.sesiones : []);
    } catch (error) {
      console.error('Error cargando sesiones por jugador:', error);
      message.error('Error al cargar las sesiones del jugador');
      setSesiones([]);
    } finally {
      setCargandoSesiones(false);
    }
  };

  // 🔹 Manejar cambio de jugador
  const manejarCambioJugador = (value) => {
    setJugadorSeleccionado(value || null);
    setBusquedaJugador('');
    if (value) {
      form.setFieldsValue({ sesionId: undefined });
      // Limpiar estadísticas de portero si no es portero
      if (!verificarEsPortero(value)) {
        form.setFieldsValue({ 
          atajadas: 0, 
          golesRecibidos: 0, 
          arcosInvictos: 0 
        });
      }
    }
  };

  // 🔹 Validación personalizada de reglas de negocio
  const validarReglas = (_, value) => {
    const valores = form.getFieldsValue();
    
    // Validar tiros al arco <= tiros totales
    if (valores.tirosAlArco > valores.tirosTotales) {
      return Promise.reject('Los tiros al arco no pueden superar los tiros totales');
    }
    
    // Validar regates exitosos <= regates intentados
    if (valores.regatesExitosos > valores.regatesIntentados) {
      return Promise.reject('Los regates exitosos no pueden superar los regates intentados');
    }
    
    // Validar duelos ganados <= duelos totales
    if (valores.duelosGanados > valores.duelosTotales) {
      return Promise.reject('Los duelos ganados no pueden superar los duelos totales');
    }
    
    // Validar pases completados <= pases intentados
    if (valores.pasesCompletados > valores.pasesIntentados) {
      return Promise.reject('Los pases completados no pueden superar los pases intentados');
    }
    
    return Promise.resolve();
  };

  // 🔹 Envío del formulario
  const manejarEnvio = async (values) => {
    // Validaciones adicionales antes de enviar
    if (values.tirosAlArco > values.tirosTotales) {
      message.error('Los tiros al arco no pueden superar los tiros totales');
      return;
    }
    
    if (values.regatesExitosos > values.regatesIntentados) {
      message.error('Los regates exitosos no pueden superar los regates intentados');
      return;
    }
    
    if (values.duelosGanados > values.duelosTotales) {
      message.error('Los duelos ganados no pueden superar los duelos totales');
      return;
    }
    
    if (values.pasesCompletados > values.pasesIntentados) {
      message.error('Los pases completados no pueden superar los pases intentados');
      return;
    }

    setCargando(true);
    try {
      await upsertEstadistica(values);
      message.success(
        estadistica
          ? 'Estadística actualizada correctamente'
          : 'Estadística creada correctamente'
      );
      form.resetFields();
      setBusquedaJugador('');
      setJugadoresBusqueda([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error(error.message || 'Error al guardar la estadística');
    } finally {
      setCargando(false);
    }
  };

  // Determinar qué jugadores mostrar
  const jugadoresAMostrar = (() => {
    if (busquedaJugador.trim().length > 0 && busquedaJugador.trim().length < 2) {
      return [];
    }
    return busquedaJugador.trim().length >= 2 ? jugadoresBusqueda : [];
  })();

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={manejarEnvio}
      initialValues={{
        goles: 0,
        asistencias: 0,
        tirosAlArco: 0,
        tirosTotales: 0,
        regatesExitosos: 0,
        regatesIntentados: 0,
        pasesCompletados: 0,
        pasesIntentados: 0,
        intercepciones: 0,
        recuperaciones: 0,
        duelosGanados: 0,
        duelosTotales: 0,
        despejes: 0,
        atajadas: 0,
        golesRecibidos: 0,
        arcosInvictos: 0,
        tarjetasAmarillas: 0,
        tarjetasRojas: 0,
        minutosJugados: 0,
      }}
    >
      {/* Selección de Jugador y Sesión */}
      <Row gutter={16}>
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
              filterOption={false}
              searchValue={busquedaJugador}
              onSearch={handleBuscarJugadores}
              onChange={manejarCambioJugador}
              disabled={!!estadistica}
              loading={loadingBusquedaJugador}
              optionLabelProp="label"
              notFoundContent={
                loadingBusquedaJugador ? (
                  <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <Spin size="small" />
                  </div>
                ) : busquedaJugador.trim().length > 0 && busquedaJugador.trim().length < 2 ? (
                  <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                    Escribe al menos 2 caracteres
                  </div>
                ) : busquedaJugador.trim().length >= 2 && jugadoresAMostrar.length === 0 ? (
                  <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                    No se encontraron jugadores
                  </div>
                ) : jugadoresAMostrar.length === 0 ? (
                  <div style={{ padding: '8px 12px', color: '#8c8c8c' }}>
                    Escribe para buscar...
                  </div>
                ) : null
              }
            >
              {[...jugadoresAMostrar]
                .sort((a, b) =>
                  a.usuario?.nombre?.localeCompare(b.usuario?.nombre || '') || 0
                )
                .map((jugador) => (
                  <Option 
                    key={jugador.id} 
                    value={jugador.id}
                    label={`${jugador.usuario?.nombre || ''} ${jugador.usuario?.apellido || ''} — ${jugador.usuario?.rut || 'Sin RUT'}`}
                  >
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
                cargandoSesiones ? (
                  <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <Spin size="small" />
                  </div>
                ) : (
                  'No hay sesiones disponibles'
                )
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
                    {sesion.tipoSesion} {fecha} — {horainicio} - {horafin}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Divider>Estadísticas Ofensivas</Divider>
      
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="goles" label="Goles" tooltip="Máximo 15">
            <InputNumber min={0} max={15} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item name="asistencias" label="Asistencias" tooltip="Máximo 15">
            <InputNumber min={0} max={15} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item name="tirosAlArco" label="Tiros al Arco" tooltip="Máximo 50">
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="tirosTotales" label="Tiros Totales" tooltip="Máximo 100">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item name="regatesExitosos" label="Regates Exitosos" tooltip="Máximo 50">
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item name="regatesIntentados" label="Regates Intentados" tooltip="Máximo 100">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="pasesCompletados" label="Pases Completados" tooltip="Máximo 200">
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="pasesIntentados" label="Pases Intentados" tooltip="Máximo 250">
            <InputNumber min={0} max={250} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name="pasesCompletados" 
            label="Pases Completados" 
            tooltip="Máximo 200"
            rules={[
              { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
              { type: 'number', max: 200, message: 'Máximo 200 pases completados' },
              { validator: validarReglas }
            ]}
          >
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item 
            name="pasesIntentados" 
            label="Pases Intentados" 
            tooltip="Máximo 250"
            rules={[
              { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
              { type: 'number', max: 250, message: 'Máximo 250 pases intentados' },
              { validator: validarReglas }
            ]}
          >
            <InputNumber min={0} max={250} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Divider>Estadísticas Defensivas</Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name="intercepciones" 
            label="Intercepciones" 
            tooltip="Máximo 50"
            rules={[
              { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
              { type: 'number', max: 50, message: 'Máximo 50 intercepciones' }
            ]}
          >
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item 
            name="recuperaciones" 
            label="Recuperaciones" 
            tooltip="Máximo 50"
            rules={[
              { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
              { type: 'number', max: 50, message: 'Máximo 50 recuperaciones' }
            ]}
          >
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item 
            name="despejes" 
            label="Despejes" 
            tooltip="Máximo 50"
            rules={[
              { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
              { type: 'number', max: 50, message: 'Máximo 50 despejes' }
            ]}
          >
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name="duelosGanados" 
            label="Duelos Ganados" 
            tooltip="Máximo 50"
            rules={[
              { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
              { type: 'number', max: 50, message: 'Máximo 50 duelos ganados' },
              { validator: validarReglas }
            ]}
          >
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item 
            name="duelosTotales" 
            label="Duelos Totales" 
            tooltip="Máximo 100"
            rules={[
              { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
              { type: 'number', max: 100, message: 'Máximo 100 duelos totales' },
              { validator: validarReglas }
            ]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      {/* Estadísticas de Portero - Solo si es portero */}
      {esPortero && (
        <>
          <Divider>Estadísticas de Portero</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                name="atajadas" 
                label="Atajadas" 
                tooltip="Máximo 30"
                rules={[
                  { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
                  { type: 'number', max: 30, message: 'Máximo 30 atajadas' }
                ]}
              >
                <InputNumber min={0} max={30} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item 
                name="golesRecibidos" 
                label="Goles Recibidos" 
                tooltip="Máximo 20"
                rules={[
                  { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
                  { type: 'number', max: 20, message: 'Máximo 20 goles recibidos' }
                ]}
              >
                <InputNumber min={0} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item 
                name="arcosInvictos" 
                label="Arcos Invictos" 
                tooltip="0 o 1"
                rules={[
                  { type: 'number', min: 0, message: 'Debe ser 0 o 1' },
                  { type: 'number', max: 1, message: 'Debe ser 0 o 1' }
                ]}
              >
                <InputNumber min={0} max={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      <Divider>Disciplina y Tiempo</Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name="tarjetasAmarillas" 
            label="Tarjetas Amarillas" 
            tooltip="Máximo 2"
            rules={[
              { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
              { type: 'number', max: 2, message: 'Máximo 2 tarjetas amarillas' }
            ]}
          >
            <InputNumber min={0} max={2} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item 
            name="tarjetasRojas" 
            label="Tarjetas Rojas" 
            tooltip="Máximo 1"
            rules={[
              { type: 'number', min: 0, message: 'Debe ser 0 o 1' },
              { type: 'number', max: 1, message: 'Máximo 1 tarjeta roja' }
            ]}
          >
            <InputNumber min={0} max={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item 
            name="minutosJugados" 
            label="Minutos Jugados" 
            tooltip="Máximo 120"
            rules={[
              { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
              { type: 'number', max: 120, message: 'Máximo 120 minutos' }
            ]}
          >
            <InputNumber min={0} max={120} style={{ width: '100%' }} />
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