import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Select, DatePicker, TimePicker, Row, Col,
  Card, Divider, Space, Alert, AutoComplete, Spin, Button, Input, ConfigProvider
} from 'antd';
import {
  CalendarOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import locale from 'antd/locale/es_ES';
import 'dayjs/locale/es';
import { partidoService } from '../services/partido.services.js';


dayjs.locale('es');

const { Option } = Select;

// Hook de debounce
function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

const ProgramarPartidoModal = ({
  visible,
  onCancel,
  onSuccess,
  partido,
  canchas,
  equipos,
  loading,
  buscarUsuarios,
  formatearFecha,
  formatearRangoHoras,
  getRondaNombre,
  verificarDisponibilidad
}) => {
  const [form] = Form.useForm();
  
  // Estados para árbitros
  const [opcionesArbitros, setOpcionesArbitros] = useState([]);
  const [buscandoArbitros, setBuscandoArbitros] = useState(false);
  const [valorBusquedaArbitro, setValorBusquedaArbitro] = useState('');
  const [arbitroSeleccionado, setArbitroSeleccionado] = useState(null);

  // Estados para verificar disponibilidad
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
  const [disponibilidadStatus, setDisponibilidadStatus] = useState(null);

  // Debounce para búsqueda de árbitros
  const valorDebounced = useDebounce(valorBusquedaArbitro, 500);

  // Helper para convertir hora (ISO o "HH:mm") a dayjs
  const toTimeDayjs = (v) => {
    if (!v) return null;
    if (typeof v === 'string' && v.includes('T')) return dayjs(v);
    return dayjs(v, v?.length > 5 ? 'HH:mm:ss' : 'HH:mm');
  };

  // ✅ Estilos para ocultar fines de semana
  useEffect(() => {
    if (!visible) return;

    const style = document.createElement('style');
    style.id = 'hide-weekends-style';
    style.textContent = `
      .hide-weekends-picker .ant-picker-cell:nth-child(7n+6),
      .hide-weekends-picker .ant-picker-cell:nth-child(7n+7) {
        visibility: hidden;
        pointer-events: none;
      }
      .hide-weekends-picker thead tr th:nth-child(6),
      .hide-weekends-picker thead tr th:nth-child(7) {
        visibility: hidden;
      }
    `;
    
    if (!document.getElementById('hide-weekends-style')) {
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById('hide-weekends-style');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [visible]);

  // ✅ ÚNICO useEffect para cargar datos del partido
  useEffect(() => {
    if (visible && partido) {
      // Reset inicial
      form.resetFields();
      setArbitroSeleccionado(null);
      setValorBusquedaArbitro('');
      setDisponibilidadStatus(null);

      // Establecer valores del formulario
      form.setFieldsValue({
        canchaId: partido.canchaId || undefined,
        fecha: partido.fecha ? dayjs(partido.fecha) : null,
        horaInicio: toTimeDayjs(partido.horaInicio),
        horaFin: toTimeDayjs(partido.horaFin),
        arbitroId: partido.arbitroId || undefined
      });

      // ✅ CARGAR ÁRBITRO si existe
      if (partido.arbitro && partido.arbitro.id) {
        const arbitroCompleto = {
          id: partido.arbitro.id,
          nombre: `${partido.arbitro.nombre || ''} ${partido.arbitro.apellido || ''}`.trim() || 'Sin nombre',
          rut: partido.arbitro.rut || '',
          email: partido.arbitro.email || ''
        };
        setArbitroSeleccionado(arbitroCompleto);
      } else if (partido.arbitroId) {
        setArbitroSeleccionado({
          id: partido.arbitroId,
          nombre: `⚠️ Árbitro ID: ${partido.arbitroId} (datos incompletos)`,
          rut: 'N/A',
          email: 'N/A'
        });
      }

      // Verificar disponibilidad inicial si tiene todos los datos
     if (partido.canchaId && partido.fecha && partido.horaInicio && partido.horaFin) {
  verificarDisponibilidadLocal({
    canchaId: partido.canchaId,
    fecha: dayjs(partido.fecha).format("YYYY-MM-DD"),
    horaInicio: toTimeDayjs(partido.horaInicio).format("HH:mm"),
    horaFin: toTimeDayjs(partido.horaFin).format("HH:mm"),
    partidoId: partido.id
  });
}

    }
  }, [visible, partido]);

  // Buscar árbitros con debounce
  useEffect(() => {
    const buscarArbitros = async () => {
      if (!valorDebounced || valorDebounced.length < 2) {
        setOpcionesArbitros([]);
        return;
      }

      setBuscandoArbitros(true);
      try {
        const resultados = await buscarUsuarios(valorDebounced, {});
          
        const opcionesFormateadas = resultados.map((usuario) => {
          const nombreCompleto = `${usuario.nombre} ${usuario.apellido || ''}`.trim();
          
          return {
            value: `${nombreCompleto} - ${usuario.rut}`, 
            label: `${nombreCompleto} - ${usuario.rut}`, 
            rut: usuario.rut,
            nombre: nombreCompleto,
            email: usuario.email,
            usuarioId: usuario.id
          };
        });

        setOpcionesArbitros(opcionesFormateadas);
      } catch (error) {
        console.error('Error buscando árbitros:', error);
        setOpcionesArbitros([]);
      } finally {
        setBuscandoArbitros(false);
      }
    };

    buscarArbitros();
  }, [valorDebounced, buscarUsuarios]);


const verificarDisponibilidadLocal = async ({
  canchaId,
  fecha,
  horaInicio,
  horaFin,
  partidoId
}) => {
  if (!canchaId || !fecha || !horaInicio || !horaFin) {
    setDisponibilidadStatus(null);
    return;
  }

  setVerificandoDisponibilidad(true);

  try {
    const resp = await verificarDisponibilidad({ // <-- esta es la que viene por props
      canchaId,
      fecha,
      horaInicio,
      horaFin,
      partidoId
    });

    if (resp.disponible) {
      setDisponibilidadStatus({
        type: "success",
        message: "Horario disponible para el partido"
      });
    } else {
      setDisponibilidadStatus({
        type: "error",
        message: resp.message || "Horario no disponible"
      });
    }
    
  } catch (err) {
    setDisponibilidadStatus({
      type: "error",
      message: "Error al verificar disponibilidad."
    });
  }

  setVerificandoDisponibilidad(false);
};


  // Re-verificar cuando cambia fecha, cancha o horas
  const watchedValues = Form.useWatch([], form);

useEffect(() => {
  if (!visible) return;

  const values = form.getFieldsValue(["canchaId", "fecha", "horaInicio", "horaFin"]);
  const { canchaId, fecha, horaInicio, horaFin } = values;

  if (canchaId && fecha && horaInicio && horaFin) {
    const timer = setTimeout(() => {
      verificarDisponibilidadLocal({
        canchaId,
        fecha: fecha.format("YYYY-MM-DD"),
        horaInicio: horaInicio.format("HH:mm"),
        horaFin: horaFin.format("HH:mm"),
        partidoId: partido?.id || null
      });
    }, 500);

    return () => clearTimeout(timer);
  }
}, [watchedValues, visible]);

  const seleccionarArbitro = (value, option) => {
    if (option) {
      const arbitro = {
        id: option.usuarioId,
        rut: option.rut,
        nombre: option.nombre,
        email: option.email
      };
      setArbitroSeleccionado(arbitro);
      form.setFieldsValue({ arbitroId: option.usuarioId });
      setValorBusquedaArbitro('');
      setOpcionesArbitros([]);
    }
  };

  const handleSubmit = (values) => {
    if (disponibilidadStatus?.type !== 'success') {
      return;
    }

    if (!arbitroSeleccionado) {
      return;
    }
    
    onSuccess(values, arbitroSeleccionado);
  };

  // ✅ Deshabilitar fines de semana
  const disabledDate = (current) => {
    if (!current) return false;
    if (current < dayjs().startOf('day')) return true;
    const day = current.day();
    return day === 0 || day === 6; // Domingo (0) y Sábado (6)
  };

  // ✅ Horario de 08:00 a 20:00 para partidos
const disabledTime = (current) => {
  const disabledHours = [];
  
  // ❌ deshabilitar 00–08
  for (let h = 0; h < 9; h++) disabledHours.push(h);

  // ❌ deshabilitar 18–23
  for (let h = 18; h < 24; h++) disabledHours.push(h);

  return {
    disabledHours: () => disabledHours,

    // ⛔ Si la hora es 17, solo permitir :00
    disabledMinutes: (hour) => {
      if (hour === 17) {
        return [15, 30, 45]; // solo deja :00
      }
      return [];
    }
  };
};


  const equipoA = equipos?.find(e => e.id === partido?.equipoAId);
  const equipoB = equipos?.find(e => e.id === partido?.equipoBId);

  return (
    <ConfigProvider locale={locale}>
      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>Programar Partido</span>
          </Space>
        }
        open={visible}
        onCancel={onCancel}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Programar"
        cancelText="Cancelar"
        width={600}
        okButtonProps={{ 
          disabled: !arbitroSeleccionado || disponibilidadStatus?.type !== 'success'
        }}
      >
        {partido && (
          <>
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16, 
                backgroundColor: '#f0f5ff', 
                border: '1px solid #d6e4ff' 
              }}
            >
              <Row gutter={16} align="middle">
                <Col span={10} style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)' }}>
                    {equipoA?.nombre || 'Equipo A'}
                  </div>
                </Col>
                <Col span={4} style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 'bold' }}>VS</span>
                </Col>
                <Col span={10} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)' }}>
                    {equipoB?.nombre || 'Equipo B'}
                  </div>
                </Col>
              </Row>

              <Divider style={{ margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid #B9BBBB',
                  backgroundColor: '#f5f5f5'
                }}>
                  {getRondaNombre(partido.ronda)}
                </span>    
                {(partido.fecha || partido.horaInicio) && (
                  <span style={{ fontSize: 12, color: '#666' }}>
                    {partido.fecha ? formatearFecha(partido.fecha) : ''}
                    {partido.horaInicio ? ` · ${formatearRangoHoras(partido.horaInicio, partido.horaFin || '')}` : ''}
                  </span>
                )}
              </div>
            </Card>

            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item name="arbitroId" hidden>
                <Input type="hidden" />
              </Form.Item>

              {/* Selección de Árbitro */}
              <Form.Item
                label="Árbitro"
                required
                style={{ marginBottom: arbitroSeleccionado ? 16 : 24 }}
              >
                {arbitroSeleccionado ? (
                  <div
                    style={{
                      padding: 12,
                      background: '#f6ffed',
                      border: '1px solid #b7eb8f',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{arbitroSeleccionado.nombre}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {arbitroSeleccionado.rut}
                          {arbitroSeleccionado.email && arbitroSeleccionado.email !== 'N/A' && ` • ${arbitroSeleccionado.email}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        setArbitroSeleccionado(null);
                        form.setFieldsValue({ arbitroId: undefined });
                        setValorBusquedaArbitro('');
                      }}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <AutoComplete
                    options={opcionesArbitros}
                    onSearch={setValorBusquedaArbitro}
                    onSelect={(value, option) => seleccionarArbitro(value, option)}
                    style={{ width: '100%' }}
                    placeholder="Buscar árbitro por nombre o RUT"
                    allowClear
                    onClear={() => {
                      setValorBusquedaArbitro('');
                      setArbitroSeleccionado(null);
                      form.setFieldsValue({ arbitroId: undefined });
                    }}
                    notFoundContent={
                      buscandoArbitros || (valorBusquedaArbitro.length >= 2 && valorBusquedaArbitro !== valorDebounced) ? (
                        <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <Spin size="small" />
                          <span style={{ marginLeft: 8 }}>Buscando...</span>
                        </div>
                      ) : valorBusquedaArbitro.length < 2 ? (
                        <div style={{ padding: '8px 12px', color: '#999', textAlign: 'center' }}>
                          Escriba al menos 2 caracteres para buscar
                        </div>
                      ) : (
                        <div style={{ padding: '8px 12px', color: '#999', textAlign: 'center' }}>
                          No se encontraron árbitros disponibles
                        </div>
                      )
                    }
                  />
                )}
              </Form.Item>

              <Form.Item
                name="canchaId"
                label="Cancha"
                rules={[{ required: true, message: 'Seleccione una cancha' }]}
              >
                <Select 
                  placeholder="Seleccionar cancha"
                  onChange={() => setDisponibilidadStatus(null)}
                >
                  {canchas.filter(c => c.estado === 'disponible').map(cancha => (

                    <Option key={cancha.id} value={cancha.id}>
                      <Space>
                        {cancha.nombre}
                        {cancha.estado && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: '12px',
                            fontWeight: 500,
                            border: '1px solid #B9BBBB',
                            backgroundColor: '#f5f5f5'
                          }}>
                            {cancha.estado}
                          </span>
                        )}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="fecha"
                label="Fecha"
                rules={[{ required: true, message: 'Seleccione una fecha' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  disabledDate={disabledDate}
                  placeholder="Seleccionar fecha (Lunes a Viernes)"
                  onChange={() => setDisponibilidadStatus(null)}
                  popupClassName="hide-weekends-picker"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="horaInicio"
                    label="Hora de Inicio"
                    rules={[
                      { required: true, message: 'Hora requerida' },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const hour = value.hour();
                          if (hour < 9 || hour >= 18) {
                            return Promise.reject(new Error('La hora debe estar entre 09:00 y 18:00'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      minuteStep={15}
                      placeholder="Entre 09:00 y 17:00"
                      disabledTime={disabledTime}
                      hideDisabledOptions
                      showNow={false}
                      onChange={() => setDisponibilidadStatus(null)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="horaFin"
                    label="Hora de Fin"
                    dependencies={['horaInicio']}
                    validateTrigger="onBlur"
                    rules={[
                      { required: true, message: 'Hora requerida' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value) return Promise.resolve();
                          const horaInicio = getFieldValue('horaInicio');
                          if (!horaInicio) return Promise.resolve();

                          const hour = value.hour();
                          if (hour < 9 || hour > 17) {
                            return Promise.reject(new Error('La hora debe estar entre 09:00 y 17:00'));
                          }

                          if (value.isBefore(horaInicio) || value.isSame(horaInicio)) {
                            return Promise.reject(new Error('Debe ser posterior a la hora de inicio'));
                          }

                          // ✅ Validación de duración máxima de 3 horas
                          const duracionMinutos = value.diff(horaInicio, 'minutes');
                          if (duracionMinutos > 180) {
                            return Promise.reject(new Error('La duración máxima es de 3 horas (180 minutos)'));
                          }

                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      minuteStep={15}
                      placeholder="Entre 09:00 y 17:00"
                      disabledTime={disabledTime}
                      hideDisabledOptions
                      showNow={false}
                      onChange={() => setDisponibilidadStatus(null)}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {verificandoDisponibilidad && (
                <Alert
                  message="Verificando disponibilidad..."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              {disponibilidadStatus && !verificandoDisponibilidad && (
                <Alert
                  message={disponibilidadStatus.message}
                  type={disponibilidadStatus.type}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
            </Form>
          </>
        )}
      </Modal>
    </ConfigProvider>
  );
};

export default ProgramarPartidoModal;