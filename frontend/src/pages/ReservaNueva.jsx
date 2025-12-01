import { useState, useEffect } from 'react';
import {
  Card,
  DatePicker,
  TimePicker,
  Select,
  Input,
  Button,
  Form,
  App,
  Space,
  ConfigProvider,
  Alert,
  AutoComplete,
} from 'antd';
import { UserOutlined, CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { crearReserva } from '../services/reserva.services.js';
import { buscarUsuariosPorRuts, buscarUsuarios } from '../services/auth.services.js';
import { useNavigate } from 'react-router-dom';
import { getDisponibilidadPorFecha } from '../services/horario.services.js';
import { verificarDisponibilidadReserva } from '../services/horario.services.js';
import { useAuth } from '../context/AuthContext.jsx';
import locale from 'antd/locale/es_ES';
import 'dayjs/locale/es';
import MainLayout from '../components/MainLayout.jsx';
dayjs.locale('es');

const { TextArea } = Input;

export default function ReservaNueva() {
  const [loading, setLoading] = useState(false);
  const [canchas, setCanchas] = useState([]);
  const [horaFin, setHoraFin] = useState(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const { usuario } = useAuth();
  const [participantes, setParticipantes] = useState([]);
  const [participantesInfo, setParticipantesInfo] = useState({});
  const [buscandoParticipantes, setBuscandoParticipantes] = useState(false);
  const [capacidadMaxima, setCapacidadMaxima] = useState(12);
  const { message } = App.useApp(); 

  // Estados para el autocomplete
  const [opcionesAutoComplete, setOpcionesAutoComplete] = useState([
    {
      value: '',
      label: 'Escribe al menos 2 caracteres para buscar...',
      disabled: true
    }
  ]);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState('');

  // Estados para verificar disponibilidad
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
  const [disponibilidadStatus, setDisponibilidadStatus] = useState(null);

  // Agregar automáticamente al usuario que reserva
  useEffect(() => {
    if (usuario && usuario.rut && !participantes.includes(usuario.rut)) {
      setParticipantes([usuario.rut]);
      setParticipantesInfo({
        [usuario.rut]: {
          rut: usuario.rut,
          nombre: usuario.nombre,
          email: usuario.email
        }
      });
    }
  }, [usuario]);

  useEffect(() => {
    const cargarCanchas = async () => {
      try {
        const fechaHoy = dayjs().add(1, 'day').format('YYYY-MM-DD');
        const response = await getDisponibilidadPorFecha(fechaHoy, 1, 100);
        
        const lista = (response.data || []).map((d) => ({
          label: d.cancha.nombre,
          value: d.cancha.id,
          capacidad: d.cancha.capacidadMaxima,
          descripcion: d.cancha.descripcion,
        }));
        setCanchas(lista);
      } catch (err) {
        console.error(err);
        message.error('No se pudieron cargar las canchas disponibles');
      }
    };
    cargarCanchas();
  }, []);

  // Buscar info completa de participantes ya agregados
  useEffect(() => {
    const buscarInfoParticipantes = async () => {
      if (participantes.length === 0) {
        setParticipantesInfo({});
        return;
      }

      setBuscandoParticipantes(true);
      try {
        const info = await buscarUsuariosPorRuts(participantes);
        setParticipantesInfo(info);
      } catch (error) {
        console.error('Error buscando participantes:', error);
      } finally {
        setBuscandoParticipantes(false);
      }
    };

    const timer = setTimeout(buscarInfoParticipantes, 500);
    return () => clearTimeout(timer);
  }, [participantes]);

  // Buscar sugerencias mientras escribe
  useEffect(() => {
    const buscarSugerencias = async () => {
      const valorTrim = valorBusqueda.trim();
      
      // Mostrar mensaje de mínimo 2 caracteres (incluso si está vacío)
      if (valorTrim.length < 2) {
        setOpcionesAutoComplete([
          {
            value: '',
            label: 'Escribe al menos 2 caracteres para buscar...',
            disabled: true
          }
        ]);
        return;
      }

      setBuscandoSugerencias(true);
      try {
        const resultados = await buscarUsuarios(valorTrim, { roles: ['estudiante', 'academico'] });
        
        const resultadosFiltrados = resultados.filter(
          r => !participantes.includes(r.rut)
        );
        
        const opcionesFormateadas = resultadosFiltrados.map(usuario => {
          const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
          return {
            value: usuario.rut,
            label: `${nombreCompleto} - ${usuario.rut}`,
            rut: usuario.rut,
            nombre: nombreCompleto,
            email: usuario.email
          };
        });
        
        setOpcionesAutoComplete(opcionesFormateadas);
      } catch (error) {
        console.error('Error buscando sugerencias:', error);
      } finally {
        setBuscandoSugerencias(false);
      }
    };

    const timer = setTimeout(buscarSugerencias, 300);
    return () => clearTimeout(timer);
  }, [valorBusqueda, participantes]);

  // ✅ Generar horas válidas según el patrón de bloques (1h uso + 10min limpieza)
  const generarHorasValidas = () => {
    const horas = [];
    let inicio = 8 * 60; // 08:00 en minutos
    const fin = 17 * 60; // 17:00 en minutos
    const bloque = 70; // 1h 10min por bloque
    
    while (inicio < fin) {
      const h = Math.floor(inicio / 60);
      const m = inicio % 60;
      horas.push({ hora: h, minuto: m });
      inicio += bloque;
    }
    
    return horas;
  };

  // ✅ CORREGIDO: Duración de 1 hora (60 minutos de uso)
  // El backend considera bloques de 1h + 10min de limpieza = 1h 10min total
  const handleHoraInicioChange = (time) => {
    if (time) {
      const nuevaHoraFin = time.add(1, 'hour'); // Solo 1 hora de uso
      setHoraFin(nuevaHoraFin);
      form.setFieldsValue({ horaFin: nuevaHoraFin });
      
      // Verificar disponibilidad automáticamente
      verificarDisponibilidad(time, nuevaHoraFin);
    } else {
      setHoraFin(null);
      form.setFieldsValue({ horaFin: null });
      setDisponibilidadStatus(null);
    }
  };

  // ✅ NUEVO: Verificar disponibilidad en tiempo real
  const verificarDisponibilidad = async (horaInicio, horaFin) => {
    const canchaId = form.getFieldValue('canchaId');
    const fecha = form.getFieldValue('fecha');

    if (!canchaId || !fecha || !horaInicio || !horaFin) {
      setDisponibilidadStatus(null);
      return;
    }

    setVerificandoDisponibilidad(true);
    try {
      const response = await verificarDisponibilidadReserva(
        canchaId,
        fecha.format('YYYY-MM-DD'),
        horaInicio.format('HH:mm'),
        horaFin.format('HH:mm')
      );

      console.log('Respuesta de disponibilidad:', response);

      // Verificar si la respuesta indica disponibilidad
      if (response.disponible === true) {
        setDisponibilidadStatus({
          type: 'success',
          message: '✅ Horario disponible para reserva'
        });
      } else if (response.disponible === false) {
        // Mostrar el motivo específico del rechazo
        const motivo = response.message || response.motivo || 'El horario no está disponible';
        setDisponibilidadStatus({
          type: 'error',
          message: `❌ ${motivo}`
        });
      } else {
        // Respuesta inesperada
        console.warn('Respuesta inesperada del servidor:', response);
        setDisponibilidadStatus({
          type: 'warning',
          message: '⚠️ No se pudo verificar la disponibilidad'
        });
      }
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      
      // Manejar errores HTTP específicos
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 409) {
          // Conflicto - horario ocupado
          setDisponibilidadStatus({
            type: 'error',
            message: `❌ ${data.message || 'El horario está ocupado'}`
          });
        } else if (status === 400) {
          // Validación fallida
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

  // ✅ NUEVO: Re-verificar cuando cambia fecha o cancha
  useEffect(() => {
    const horaInicio = form.getFieldValue('horaInicio');
    const horaFin = form.getFieldValue('horaFin');
    
    if (horaInicio && horaFin) {
      verificarDisponibilidad(horaInicio, horaFin);
    }
  }, [form.getFieldValue('canchaId'), form.getFieldValue('fecha')]);

  const agregarParticipante = (rut, option) => {
    if (participantes.length >= capacidadMaxima) {
      message.warning(`Ya tienes ${capacidadMaxima} participantes (capacidad máxima de la cancha)`);
      return;
    }

    if (participantes.includes(rut)) {
      message.warning('Este participante ya fue agregado');
      return;
    }

    const nuevosParticipantes = [...participantes, rut];
    setParticipantes(nuevosParticipantes);
    setValorBusqueda('');
    
    if (option) {
      setParticipantesInfo(prev => ({
        ...prev,
        [rut]: {
          rut: option.rut,
          nombre: option.nombre,
          email: option.email
        }
      }));
    }
  };

  const removerParticipante = (rutARemover) => {
    const nuevosParticipantes = participantes.filter(p => p !== rutARemover);
    setParticipantes(nuevosParticipantes);
  };

  const handleSubmit = async (values) => {
    // Validar disponibilidad antes de enviar
    if (disponibilidadStatus?.type !== 'success') {
      message.error('Por favor verifica que el horario esté disponible');
      return;
    }

    if (participantes.length !== capacidadMaxima) {
      message.error(`Se requieren exactamente ${capacidadMaxima} participantes para esta cancha. Actualmente tienes ${participantes.length}`);
      return;
    }

    try {
      setLoading(true);

      const participantesCompletos = [...participantes];
      if (usuario && usuario.rut && !participantesCompletos.includes(usuario.rut)) {
        participantesCompletos.unshift(usuario.rut);
      }

      const data = {
        canchaId: Number(values.canchaId),
        fecha: values.fecha.format('YYYY-MM-DD'),
        horaInicio: values.horaInicio.format('HH:mm'),
        horaFin: values.horaFin.format('HH:mm'),
        motivo: values.motivo || '',
        participantes: participantesCompletos,
      };

      await crearReserva(data);
      message.success('Reserva creada correctamente');
      navigate('/reservas/mis-reservas');
    } catch (err) {
      console.error(err.response?.data || err);
      const msg = err.response?.data?.message || 'Error al crear la reserva. Verifica los datos.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .timepicker-academico .ant-picker-time-panel-column {
        overflow-y: scroll !important;
        max-height: 200px !important;
        scrollbar-width: none;
      }
      .timepicker-academico .ant-picker-time-panel-column::-webkit-scrollbar {
        display: none;
      }

      .hide-weekends .ant-picker-cell:nth-child(7n+6),
      .hide-weekends .ant-picker-cell:nth-child(7n+7) {
        visibility: hidden;
        pointer-events: none;
      }
      .hide-weekends thead tr th:nth-child(6),
      .hide-weekends thead tr th:nth-child(7) {
        visibility: hidden;
      }

      .participante-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        margin: 4px;
        background: #f6ffed;
        border: 1px solid #b7eb8f;
        border-radius: 6px;
        font-size: 14px;
      }
      .participante-tag-remove {
        cursor: pointer;
        color: #ff4d4f;
        font-size: 16px;
      }
      .participante-tag-remove:hover {
        color: #ff7875;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div
          style={{
            minHeight: '100vh',
            padding: '2rem',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Card title="Nueva Reserva de Cancha" style={{ width: 600, borderRadius: 12 }}>
            {usuario && (
              <Alert
                message={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserOutlined />
                    <span>
                      <strong>Solicitante:</strong> {usuario.nombre} ({usuario.rut || 'Sin RUT'})
                    </span>
                  </div>
                }
                type="info"
                showIcon={false}
                style={{ marginBottom: 16 }}
              />
            )}

            <Form layout="vertical" form={form} onFinish={handleSubmit}>
              <Form.Item
                label="Cancha"
                name="canchaId"
                rules={[{ required: true, message: 'Selecciona una cancha' }]}
              >
                <Select
                  placeholder="Selecciona una cancha"
                  options={canchas}
                  loading={!canchas.length}
                  onChange={(value) => {
                    const cancha = canchas.find((c) => c.value === value);
                    setCanchaSeleccionada(cancha || null);
                    
                    if (cancha) {
                      const nuevaCapacidad = cancha.capacidad || 12;
                      setCapacidadMaxima(nuevaCapacidad);
                      
                      if (participantes.length > nuevaCapacidad) {
                        setParticipantes(participantes.slice(0, nuevaCapacidad));
                        message.warning(`La cancha permite máximo ${nuevaCapacidad} participantes. Se han eliminado los excedentes.`);
                      }
                    }
                    
                    // Re-verificar disponibilidad con nueva cancha
                    const horaInicio = form.getFieldValue('horaInicio');
                    const horaFin = form.getFieldValue('horaFin');
                    if (horaInicio && horaFin) {
                      verificarDisponibilidad(horaInicio, horaFin);
                    }
                  }}
                />
              </Form.Item>

              {canchaSeleccionada && (
                <div
                  style={{
                    background: '#f0f2f5',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 16,
                    fontSize: 14,
                    color: '#333',
                  }}
                >
                  <p style={{ marginBottom: 4 }}>
                    <strong>Capacidad máxima:</strong> {canchaSeleccionada.capacidad} jugadores
                  </p>
                  {canchaSeleccionada.descripcion && (
                    <p style={{ marginBottom: 0 }}>
                      <strong>Descripción:</strong> {canchaSeleccionada.descripcion}
                    </p>
                  )}
                </div>
              )}

              <Form.Item
                label="Fecha"
                name="fecha"
                rules={[{ required: true, message: 'Selecciona la fecha de reserva' }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  placeholder="Selecciona una fecha"
                  onChange={() => {
                    // Re-verificar disponibilidad con nueva fecha
                    const horaInicio = form.getFieldValue('horaInicio');
                    const horaFin = form.getFieldValue('horaFin');
                    if (horaInicio && horaFin) {
                      verificarDisponibilidad(horaInicio, horaFin);
                    }
                  }}
                  disabledDate={(current) => {
                    const today = dayjs().startOf('day');
                    const minDate = today.add(1, 'day');
                    const maxDate = today.add(14, 'day');
                    const day = current.day();
                    
                    return !current || current < minDate || current > maxDate || day === 0 || day === 6;
                  }}
                  classNames={{ popup: 'hide-weekends' }}
                />
              </Form.Item>

              <Form.Item
                label="Hora de inicio"
                name="horaInicio"
                rules={[{ required: true, message: 'Selecciona la hora de inicio' }]}
                extra="Bloques disponibles: 08:00, 09:10, 10:20, 11:30, 12:40, 13:50, 15:00, 16:10"
              >
                <TimePicker
                  format="HH:mm"
                  minuteStep={10}
                  onChange={handleHoraInicioChange}
                  disabledTime={() => {
                    const horasValidas = generarHorasValidas();
                    
                    return {
                      disabledHours: () => {
                        const permitidas = [...new Set(horasValidas.map(h => h.hora))];
                        return Array.from({ length: 24 }, (_, i) => i).filter(
                          h => !permitidas.includes(h)
                        );
                      },
                      disabledMinutes: (selectedHour) => {
                        const minutosPermitidos = horasValidas
                          .filter(h => h.hora === selectedHour)
                          .map(h => h.minuto);
                        
                        return Array.from({ length: 60 }, (_, i) => i).filter(
                          m => !minutosPermitidos.includes(m)
                        );
                      },
                    };
                  }}
                  hideDisabledOptions
                  showNow={false}
                  classNames={{ popup: 'timepicker-academico' }}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="Hora de fin"
                name="horaFin"
                extra="Se calcula automáticamente (1 hora después del inicio)"
              >
                <TimePicker format="HH:mm" value={horaFin} disabled style={{ width: '100%' }} />
              </Form.Item>

              {/* ✅ NUEVO: Indicador de disponibilidad */}
              {disponibilidadStatus && (
                <Alert
                  message={disponibilidadStatus.message}
                  type={disponibilidadStatus.type}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              {verificandoDisponibilidad && (
                <Alert
                  message="Verificando disponibilidad..."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form.Item label="Motivo (opcional)" name="motivo">
                <TextArea rows={2} placeholder="Motivo de la reserva" />
              </Form.Item>

              <Form.Item label="Participantes">
                <AutoComplete
                  value={valorBusqueda}
                  options={opcionesAutoComplete}
                  onSearch={setValorBusqueda}
                  onSelect={(value, option) => {
                    if (!option.disabled) {
                      agregarParticipante(value, option);
                    }
                  }}
                  style={{ width: '100%' }}
                  disabled={participantes.length >= capacidadMaxima || !canchaSeleccionada}
                  notFoundContent={buscandoSugerencias ? 'Buscando...' : 'No se encontraron usuarios'}
                >
                  <Input
                    placeholder={
                      !canchaSeleccionada 
                        ? 'Selecciona una cancha'
                        : `Buscar por nombre o RUT (${participantes.length}/${capacidadMaxima} agregados)`
                    }
                    allowClear
                  />
                </AutoComplete>
              </Form.Item>

              {participantes.length > 0 && (
                <div style={{ 
                  marginBottom: 16, 
                  padding: 12, 
                  background: '#F5F5F5', 
                  borderRadius: 8,
                  border: '1px solid #B9BBBB'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Participantes agregados:</strong>
                    <span style={{ color: '#666' }}>{participantes.length}/{capacidadMaxima}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {participantes.map((rut, index) => {
                      const info = participantesInfo[rut];
                      const esSolicitante = usuario && usuario.rut === rut;

                      return (
                        <span 
                          key={index} 
                          className="participante-tag"
                          style={esSolicitante ? {
                            background: '#e6f7ff',
                            border: '1px solid #91d5ff'
                          } : {}}
                        >
                          <CheckCircleOutlined style={{ color: '#8CC63F' }} />
                          <span>
                            {rut}
                            {info && (
                              <span style={{ marginLeft: 4, fontSize: 12, color: '#666' }}>
                                ({info.nombre})
                                {esSolicitante && <strong> - Tú</strong>}
                              </span>
                            )}
                          </span>
                          {!esSolicitante && (
                            <CloseCircleOutlined 
                              className="participante-tag-remove"
                              onClick={() => removerParticipante(rut)}
                            />
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <Form.Item>
                <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={() => navigate(-1)}>Cancelar</Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    disabled={
                      participantes.length !== capacidadMaxima || 
                      disponibilidadStatus?.type !== 'success'
                    }
                  >
                    Reservar cancha
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}