import { useState, useEffect } from 'react';
import {
  Modal,
  Select,
  Button,
  Space,
  Tag,
  App,
  Alert,
  Spin,
  Empty,
  Avatar,
  Divider
} from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LockOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { buscarUsuarios } from '../services/auth.services.js';
import { editarParticipantesReserva } from '../services/reserva.services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatearHora } from '../utils/formatters.js';

export default function ModalEditarParticipantes({ 
  visible, 
  onCancel, 
  reserva,
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [error, setError] = useState('');
  const { usuario } = useAuth();
  const { message } = App.useApp(); 

  // ✅ Calcular tiempo restante hasta la reserva (corregido con dayjs)
  const calcularTiempoRestante = () => {
    if (!reserva) return null;
    
    const fechaReservaDate = dayjs(reserva.fechaReserva);
    const [horas, minutos] = reserva.horaInicio.split(':').map(Number);
    
    const fechaHoraReserva = fechaReservaDate.hour(horas).minute(minutos).second(0).millisecond(0);
    const ahora = dayjs();
    
    const diferenciaMinutos = fechaHoraReserva.diff(ahora, 'minute');
    const diferenciaMs = fechaHoraReserva.diff(ahora, 'millisecond');
    
    const horasRestantes = Math.floor(diferenciaMinutos / 60);
    const minutosRestantes = diferenciaMinutos % 60;
    
    return { horas: horasRestantes, minutos: minutosRestantes, total: diferenciaMs };
  };

  const tiempoRestante = calcularTiempoRestante();
  const faltanMenosDe24h = tiempoRestante && tiempoRestante.total < (24 * 60 * 60 * 1000);

  // Inicializar participantes seleccionados
  useEffect(() => {
    if (visible && reserva) {
      const participantes = reserva.participantes?.map(p => p.rut) || [];
      setParticipantesSeleccionados(participantes);
      setError('');
    }
  }, [visible, reserva]);

  // Buscar usuarios con debounce
  useEffect(() => {
    if (!searchValue) {
      setUsuarios([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const resultados = await buscarUsuarios(searchValue, { 
          roles: ['estudiante', 'academico'],
          limit: 20 
        });
        
        const listaUsuarios = Array.isArray(resultados) 
          ? resultados 
          : (resultados.usuarios || resultados.data || []);
        
        setUsuarios(listaUsuarios);
      } catch (error) {
        console.error('Error buscando usuarios:', error);
        setUsuarios([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (!participantesSeleccionados || participantesSeleccionados.length === 0) {
        setError('Debes seleccionar al menos un participante');
        return;
      }

      const rutCreador = reserva.usuario?.rut;
      if (!participantesSeleccionados.includes(rutCreador)) {
        setError('El creador de la reserva debe estar incluido en los participantes');
        return;
      }

      const capacidadRequerida = reserva.cancha?.capacidadMaxima;
      if (participantesSeleccionados.length !== capacidadRequerida) {
        setError(`La cancha requiere exactamente ${capacidadRequerida} participantes`);
        return;
      }

      setLoading(true);
      
      await editarParticipantesReserva(reserva.id, participantesSeleccionados);
      
      message.success('Participantes actualizados correctamente');
      onSuccess?.();
      handleCancel();
      
    } catch (error) {
      console.error('Error actualizando participantes:', error);
      setError(error.message || 'Error al actualizar los participantes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setParticipantesSeleccionados([]);
    setUsuarios([]);
    setSearchValue('');
    setError('');
    onCancel();
  };

  const handleRemoveParticipante = (rut) => {
    const rutCreador = reserva.usuario?.rut;
    
    if (rut === rutCreador) {
      message.warning('No puedes eliminar al creador de la reserva');
      return;
    }

    setParticipantesSeleccionados(prev => prev.filter(p => p !== rut));
  };

  const participantesActuales = reserva?.participantes || [];
  const capacidadMaxima = reserva?.cancha?.capacidadMaxima || 0;
  const participantesCount = participantesSeleccionados.length;
  const faltanParticipantes = capacidadMaxima - participantesCount;
  const rutCreador = reserva?.usuario?.rut;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserAddOutlined />
          <span>Editar Participantes</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={faltanMenosDe24h}
        >
          Guardar Cambios
        </Button>,
      ]}
    >
      {/* Alerta si faltan menos de 24 horas */}
      {faltanMenosDe24h && (
        <Alert
          message="No se puede editar"
          description={`Faltan menos de 24 horas para la reserva (quedan ${tiempoRestante.horas}h ${tiempoRestante.minutos}m). No es posible realizar cambios.`}
          type="error"
          showIcon
          icon={<ClockCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Error de validación */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Información de la reserva */}
      <div style={{ 
        background: '#f0f2f5', 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 16 
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <strong>Fecha:</strong>{' '}
            {dayjs(reserva?.fechaReserva).format('DD/MM/YYYY')}
          </div>
          <div>
            <strong>Horario:</strong>{' '}
            {formatearHora(reserva?.horaInicio)} - {formatearHora(reserva?.horaFin)}
          </div>
          <div>
            <strong>Cancha:</strong> {reserva?.cancha?.nombre}
          </div>
          <div>
            <strong>Capacidad:</strong>{' '}
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #B9BBBB',
              backgroundColor: '#f5f5f5'
            }}>
              {participantesCount} / {capacidadMaxima}
            </span>
          </div>
        </div>
      </div>

      {/* Contador de participantes */}
      <div style={{ 
        marginBottom: 16, 
        padding: 12, 
        background: participantesCount === capacidadMaxima ? '#f6ffed' : '#fff7e6',
        border: `1px solid ${participantesCount === capacidadMaxima ? '#b7eb8f' : '#ffd591'}`,
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>
            {participantesCount === capacidadMaxima ? (
              <span style={{ color: '#006B5B' }}>
                <CheckCircleOutlined /> Capacidad completa
              </span>
            ) : (
              <span style={{ color: '#fa8c16' }}>
                Faltan {faltanParticipantes} participante{faltanParticipantes !== 1 ? 's' : ''}
              </span>
            )}
          </strong>
        </div>
        <div style={{ fontSize: 20, fontWeight: 'bold' }}>
          {participantesCount} / {capacidadMaxima}
        </div>
      </div>

      {/* Selector de participantes */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Buscar y agregar participantes <span style={{ color: 'red' }}>*</span>
        </label>
        <Select
          mode="multiple"
          placeholder="Buscar participantes por nombre o RUT..."
          value={participantesSeleccionados}
          showSearch
          searchValue={searchValue}
          onSearch={setSearchValue}
          filterOption={false}
          loading={searchLoading}
          disabled={faltanMenosDe24h}
          notFoundContent={
            searchLoading ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="small" />
              </div>
            ) : searchValue ? (
              <Empty 
                description="No se encontraron usuarios" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                <SearchOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <div>Escribe para buscar usuarios</div>
              </div>
            )
          }
          onChange={setParticipantesSeleccionados}
          maxTagCount={0}
          maxTagPlaceholder={() => `${participantesSeleccionados.length} participante${participantesSeleccionados.length !== 1 ? 's' : ''} seleccionado${participantesSeleccionados.length !== 1 ? 's' : ''}`}
          style={{ width: '100%' }}
        >
          {usuarios.map((user) => (
            <Select.Option key={user.rut} value={user.rut}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <div>
                  <div style={{ fontWeight: 500 }}>{user.nombre} {user.apellido}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {user.rut} • {user.email}
                  </div>
                </div>
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>

      <Divider style={{ margin: '16px 0' }}>Participantes seleccionados</Divider>

      {/* Lista de participantes seleccionados */}
      <div style={{ 
        maxHeight: 250, 
        overflowY: 'auto',
        border: '1px solid #B9BBBB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        background: '#f5f5f5'
      }}>
        {participantesSeleccionados.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {participantesSeleccionados.map((rut, idx) => {
  // Buscar primero en participantes actuales, luego en usuarios buscados
  const participante = participantesActuales.find(p => p.rut === rut);
  const usuarioBuscado = usuarios.find(u => u.rut === rut);
  
  const esCreador = rut === rutCreador;
  const esTu = usuario?.rut === rut;

  // Datos del usuario (priorizar participante actual, luego usuario buscado)
  const nombreUsuario = participante?.usuario?.nombre || usuarioBuscado?.nombre || '';
  const apellidoUsuario = participante?.usuario?.apellido || usuarioBuscado?.apellido || '';
  const nombreCompleto = nombreUsuario && apellidoUsuario 
    ? `${nombreUsuario} ${apellidoUsuario}` 
    : (participante?.nombreOpcional || rut);

  return (
    <div
      key={idx}
      style={{
        padding: '10px 12px',
        background: esCreador ? '#e6f7ff' : '#fff',
        borderRadius: 6,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: esCreador ? '2px solid #014898' : '1px solid #e8e8e8'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar 
          size="small" 
          icon={<UserOutlined />} 
          style={{ background: esCreador ? '#014898' : '#006B5B' }} 
        />
        <div>
          <div style={{ fontWeight: 500 }}>
            {nombreCompleto}
            {esTu && <span style={{ marginLeft: 4, color: '#014898' }}>(Tú)</span>}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>{rut}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {esCreador ? (
          <>
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #B9BBBB',
              backgroundColor: '#f5f5f5',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <LockOutlined />Creador
            </span>
          </>
        ) : (
          <>
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #B9BBBB',
              backgroundColor: '#f5f5f5',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircleOutlined />Seleccionado
            </span>
            <CloseCircleOutlined 
              onClick={() => handleRemoveParticipante(rut)}
              style={{ 
                fontSize: 18, 
                color: '#ff4d4f', 
                cursor: faltanMenosDe24h ? 'not-allowed' : 'pointer',
                opacity: faltanMenosDe24h ? 0.5 : 1,
                transition: 'all 0.3s',
                pointerEvents: faltanMenosDe24h ? 'none' : 'auto'
              }}
              onMouseEnter={(e) => !faltanMenosDe24h && (e.target.style.color = '#ff7875')}
              onMouseLeave={(e) => !faltanMenosDe24h && (e.target.style.color = '#ff4d4f')}
            />
          </>
        )}
      </div>
    </div>
              );
            })}
          </Space>
        ) : (
          <Empty 
            description="No hay participantes seleccionados" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '20px 0' }}
          />
        )}
      </div>


    </Modal>
  );
}