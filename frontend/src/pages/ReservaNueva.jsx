import { useState, useEffect } from 'react';
import {
  Card,
  DatePicker,
  TimePicker,
  Select,
  Input,
  Button,
  Form,
  message,
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
import { useAuth } from '../context/AuthContext.jsx';
import locale from 'antd/locale/es_ES';
import 'dayjs/locale/es';

dayjs.locale('es');

const { TextArea } = Input;

export default function ReservaNueva() {
  const [loading, setLoading] = useState(false);
  const [canchas, setCanchas] = useState([]);
  const [horaFin, setHoraFin] = useState(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const { user } = useAuth();
  const [participantes, setParticipantes] = useState([]);
  const [participantesInfo, setParticipantesInfo] = useState({});
  const [buscandoParticipantes, setBuscandoParticipantes] = useState(false);
  const [capacidadMaxima, setCapacidadMaxima] = useState(12); // Por defecto 12
  
  // Estados para el autocomplete
  const [opcionesAutoComplete, setOpcionesAutoComplete] = useState([]);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState('');

  // Agregar automáticamente al usuario que reserva
  useEffect(() => {
    if (user && user.rut && !participantes.includes(user.rut)) {
      setParticipantes([user.rut]);
      setParticipantesInfo({
        [user.rut]: {
          rut: user.rut,
          nombre: user.nombre,
          email: user.email
        }
      });
    }
  }, [user]);

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
      if (valorBusqueda.length < 2) {
        setOpcionesAutoComplete([]);
        return;
      }

      setBuscandoSugerencias(true);
      try {
        const resultados = await buscarUsuarios(valorBusqueda);
        
        // Filtrar usuarios que ya están agregados
        const resultadosFiltrados = resultados.filter(
          r => !participantes.includes(r.rut)
        );
        
        // Formatear opciones para el AutoComplete
        const opcionesFormateadas = resultadosFiltrados.map(usuario => ({
          value: usuario.rut,
          label: `${usuario.rut} - ${usuario.nombre}`,
          rut: usuario.rut,
          nombre: usuario.nombre,
          email: usuario.email
        }));
        
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

  const handleHoraInicioChange = (time) => {
    if (time) {
      const nuevaHoraFin = time.add(1, 'hour').add(30, 'minute');
      setHoraFin(nuevaHoraFin);
      form.setFieldsValue({ horaFin: nuevaHoraFin });
    } else {
      setHoraFin(null);
      form.setFieldsValue({ horaFin: null });
    }
  };

  // Agregar participante desde el autocomplete
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
    setValorBusqueda(''); // Limpiar el campo de búsqueda
    
    // Guardar info del participante
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
    // Validar que haya exactamente la cantidad de participantes requerida
    if (participantes.length !== capacidadMaxima) {
      message.error(`Se requieren exactamente ${capacidadMaxima} participantes para esta cancha. Actualmente tienes ${participantes.length}`);
      return;
    }

    try {
      setLoading(true);

      // Agregar el RUT del usuario que reserva si no está en la lista
      const participantesCompletos = [...participantes];
      if (user && user.rut && !participantesCompletos.includes(user.rut)) {
        participantesCompletos.unshift(user.rut);
      }

      const data = {
        canchaId: Number(values.canchaId),
        fecha: values.fecha.format('YYYY-MM-DD'),
        horaInicio: values.horaInicio.format('HH:mm'),
        horaFin: values.horaFin.format('HH:mm'),
        motivo: values.motivo || '',
        participantes: participantesCompletos, // Enviar con el solicitante incluido
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

  const participantesRestantes = capacidadMaxima - participantes.length;

  return (
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
          {user && (
            <Alert
              message={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserOutlined />
                  <span>
                    <strong>Solicitante:</strong> {user.nombre} ({user.rut || 'Sin RUT'})
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
                  
                  // Actualizar capacidad máxima y reiniciar participantes si es necesario
                  if (cancha) {
                    const nuevaCapacidad = cancha.capacidad || 12;
                    setCapacidadMaxima(nuevaCapacidad);
                    
                    // Si hay más participantes de los permitidos, recortar la lista
                    if (participantes.length > nuevaCapacidad - 1) {
                      setParticipantes(participantes.slice(0, nuevaCapacidad - 1));
                      message.warning(`La cancha permite máximo ${nuevaCapacidad - 1} compañeros. Se han eliminado los excedentes.`);
                    }
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
            >
              <TimePicker
                format="HH:mm"
                minuteStep={30}
                onChange={handleHoraInicioChange}
                disabledTime={() => ({
                  disabledHours: () => [0,1,2,3,4,5,6,7,15,16,17,18,19,20,21,22,23],
                  disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i).filter(m => m !== 0 && m !== 30),
                })}
                hideDisabledOptions
                showNow={false}
                classNames={{ popup: 'timepicker-academico' }}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="Hora de fin"
              name="horaFin"
              extra="Se calcula automáticamente (1h 30min después del inicio)"
            >
              <TimePicker format="HH:mm" value={horaFin} disabled style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Motivo (opcional)" name="motivo">
              <TextArea rows={2} placeholder="Motivo de la reserva" />
            </Form.Item>

            {/* AutoComplete para buscar participantes */}
            <Form.Item
              label={`Participantes`}
            >
              <AutoComplete
                value={valorBusqueda}
                options={opcionesAutoComplete}
                onSearch={setValorBusqueda}
                onSelect={(value, option) => agregarParticipante(value, option)}
                style={{ width: '100%' }}
                disabled={participantes.length >= capacidadMaxima}
                notFoundContent={
                  buscandoSugerencias ? 'Buscando...' :
                  valorBusqueda.length < 2 ? 'Buscar por nombre o RUT' :
                  'No se encontraron usuarios'
                }
              >
                <Input
                  placeholder={`Buscar por nombre o RUT (${participantes.length}/${capacidadMaxima} agregados)`}
                  allowClear
                />
              </AutoComplete>
            </Form.Item>

            {/* Vista de participantes agregados */}
            {participantes.length > 0 && (
              <div style={{ 
                marginBottom: 16, 
                padding: 12, 
                background: '#fafafa', 
                borderRadius: 8,
                border: '1px solid #d9d9d9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong>Participantes agregados:</strong>
                  <span style={{ color: '#666' }}>{participantes.length}/{capacidadMaxima}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {participantes.map((rut, index) => {
                    const info = participantesInfo[rut];
                    const esSolicitante = user && user.rut === rut;

                    return (
                      <span 
                        key={index} 
                        className="participante-tag"
                        style={esSolicitante ? {
                          background: '#e6f7ff',
                          border: '1px solid #91d5ff'
                        } : {}}
                      >
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
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
                  disabled={participantes.length !== capacidadMaxima}
                >
                  Reservar cancha
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
}