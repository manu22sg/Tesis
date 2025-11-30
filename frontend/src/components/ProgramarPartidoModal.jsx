import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Select, DatePicker, TimePicker, Row, Col,
  Card, Divider, Space, Alert, AutoComplete, Spin, Button, Input
} from 'antd';
import {
  CalendarOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

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
  verificarDisponibilidadSesion
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
        // Caso 1: Viene con la relación completa del árbitro
        const arbitroCompleto = {
          id: partido.arbitro.id,
          nombre: `${partido.arbitro.nombre || ''} ${partido.arbitro.apellido || ''}`.trim() || 'Sin nombre',
          rut: partido.arbitro.rut || '',
          email: partido.arbitro.email || ''
        };
        setArbitroSeleccionado(arbitroCompleto);
      } else if (partido.arbitroId) {
        // Caso 2: Solo tiene el ID (esto NO debería pasar si el backend está bien)
       
        setArbitroSeleccionado({
          id: partido.arbitroId,
          nombre: `⚠️ Árbitro ID: ${partido.arbitroId} (datos incompletos)`,
          rut: 'N/A',
          email: 'N/A'
        });
      }

      // Verificar disponibilidad inicial si tiene todos los datos
      if (partido.canchaId && partido.fecha && partido.horaInicio && partido.horaFin) {
        verificarDisponibilidad(
          partido.canchaId,
          dayjs(partido.fecha),
          toTimeDayjs(partido.horaInicio),
          toTimeDayjs(partido.horaFin)
        );
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

  // Verificar disponibilidad en tiempo real
  const verificarDisponibilidad = async (canchaId, fecha, horaInicio, horaFin) => {
    if (!canchaId || !fecha || !horaInicio || !horaFin || !verificarDisponibilidadSesion) {
      setDisponibilidadStatus(null);
      return;
    }

    setVerificandoDisponibilidad(true);
    try {
      const response = await verificarDisponibilidadSesion(
        canchaId,
        fecha.format('YYYY-MM-DD'),
        horaInicio.format('HH:mm'),
        horaFin.format('HH:mm'),
        null,
        partido?.id || null
      );

      if (response.disponible === true) {
        setDisponibilidadStatus({
          type: 'success',
          message: '✅ Horario disponible para el partido'
        });
      } else if (response.disponible === false) {
        const motivo = response.message || response.motivo || 'El horario no está disponible';
        setDisponibilidadStatus({
          type: 'error',
          message: `❌ ${motivo}`
        });
      } else {
        console.warn('Respuesta inesperada del servidor:', response);
        setDisponibilidadStatus({
          type: 'warning',
          message: '⚠️ No se pudo verificar la disponibilidad'
        });
      }
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 409) {
          setDisponibilidadStatus({
            type: 'error',
            message: `❌ ${data.message || 'El horario está ocupado'}`
          });
        } else if (status === 400) {
          setDisponibilidadStatus({
            type: 'error',
            message: `❌ ${data.message || 'Horario inválido'}`
          });
        } else {
          setDisponibilidadStatus({
            type: 'error',
            message: '❌ Error al verificar disponibilidad'
          });
        }
      } else {
        setDisponibilidadStatus({
          type: 'warning',
          message: '⚠️ No se pudo conectar con el servidor'
        });
      }
    } finally {
      setVerificandoDisponibilidad(false);
    }
  };

  // Re-verificar cuando cambia fecha, cancha o horas
  const watchedValues = Form.useWatch([], form);

  useEffect(() => {
    if (!visible) return;
    
    const values = form.getFieldsValue(['canchaId', 'fecha', 'horaInicio', 'horaFin']);
    const { canchaId, fecha, horaInicio, horaFin } = values;
    
    if (canchaId && fecha && horaInicio && horaFin) {
      const timer = setTimeout(() => {
        verificarDisponibilidad(canchaId, fecha, horaInicio, horaFin);
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

  const disabledDate = (current) => {
    if (!current) return false;
    if (current < dayjs().startOf('day')) return true;
    const day = current.day();
    return day === 0 || day === 6;
  };

  const disabledTime = () => ({
    disabledHours: () => {
      const hours = [];
      for (let i = 1; i < 8; i++) hours.push(i);
      for (let i = 23; i < 24; i++) hours.push(i);
      return hours;
    },
  });

  const equipoA = equipos?.find(e => e.id === partido?.equipoAId);
  const equipoB = equipos?.find(e => e.id === partido?.equipoBId);

  return (
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

          <Alert
            message="Horario permitido: 08:00 a 22:00"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

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
                        Escribe al menos 2 caracteres para buscar
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
              rules={[{ required: true, message: 'Selecciona una cancha' }]}
            >
              <Select 
                placeholder="Seleccionar cancha"
                onChange={() => setDisponibilidadStatus(null)}
              >
                {canchas.map(cancha => (
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
              rules={[{ required: true, message: 'Selecciona una fecha' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabledDate={disabledDate}
                placeholder="Seleccionar fecha"
                onChange={() => setDisponibilidadStatus(null)}
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
                        if (hour >= 1 && hour < 8 || hour >= 23) {
                          return Promise.reject(new Error('La hora debe estar entre 08:00 y 22:00'));
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
                    placeholder="Entre 08:00 y 22:00"
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
                        if (hour >= 1 && hour < 8 || hour >= 23) {
                          return Promise.reject(new Error('La hora debe estar entre 08:00 y 22:00'));
                        }

                        if (value.isBefore(horaInicio) || value.isSame(horaInicio)) {
                          return Promise.reject(new Error('Debe ser posterior a la hora de inicio'));
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
                    placeholder="Entre 08:00 y 22:00"
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
  );
};

export default ProgramarPartidoModal;