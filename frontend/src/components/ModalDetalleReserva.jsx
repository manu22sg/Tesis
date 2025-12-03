import React from 'react';
import { formatearFecha, formatearFechaHora, formatearRangoHoras } from '../utils/formatters.js';
import { Modal, Button, Descriptions, Card, Badge, Alert, Spin, Empty } from 'antd';
import { EyeOutlined, UserOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';

const ModalDetalleReserva = ({ visible, reserva, onClose, usuarioActual, loading }) => {
  const ucfirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');

  // Determinar permisos
  const esDuenio = usuarioActual?.id === reserva?.usuarioId;
  const esAdmin = ['admin', 'tecnico', 'entrenador'].includes(usuarioActual?.rol);
  const puedeVerTodo = esAdmin || esDuenio;

  // Filtrar historial según rol
  const historialCompleto = reserva?.historial || [];
  
  const historialParaMostrar = esAdmin 
    ? historialCompleto // Admin ve TODO
    : historialCompleto.filter(h => 
        ['rechazada', 'aprobada', 'completada', 'expirada', 'cancelada'].includes(h.accion?.toLowerCase())
      );

  // Verificar si hay historial para mostrar
  const tieneHistorial = historialParaMostrar.length > 0;

 

  return (
    <Modal
      title={<span><EyeOutlined /> Detalle de Reserva</span>}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>
      ]}
      width={700}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#888' }}>Cargando detalles...</div>
        </div>
      ) : reserva ? (
        <>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Usuario" span={2}>
              <div>
                <UserOutlined /> {reserva.usuario?.nombre} {reserva.usuario?.apellido}
              </div>
              {/* Email: solo para admin/técnico o dueño */}
              {puedeVerTodo && reserva.usuario?.email && (
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {reserva.usuario.email}
                </div>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Cancha" span={2}>
              {reserva.cancha?.nombre}
            </Descriptions.Item>

            <Descriptions.Item label="Fecha de Reserva">
              {formatearFecha(reserva.fechaReserva)}
            </Descriptions.Item>

            <Descriptions.Item label="Fecha de Creación">
              {formatearFechaHora(reserva.fechaCreacion)}
            </Descriptions.Item>

            <Descriptions.Item label="Horario">
              {formatearRangoHoras(reserva.horaInicio, reserva.horaFin)}
            </Descriptions.Item>

            <Descriptions.Item label="Estado" span={2}>
              <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '12px',
                fontWeight: 500,
                border: '1px solid #B9BBBB',
                backgroundColor: '#f5f5f5'
              }}>
                {ucfirst(reserva.estado || '')}
              </span>
            </Descriptions.Item>

            {/* Mostrar motivo de rechazo si aplica */}
            {reserva.estado === 'rechazada' && reserva.motivoRechazo && (
              <Descriptions.Item label="Motivo de Rechazo" span={2}>
                <Alert
                  message={reserva.motivoRechazo}
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                />
              </Descriptions.Item>
            )}

            <Descriptions.Item label="Participantes" span={2}>
              <Badge count={reserva.participantes?.length || 0} showZero />
              {reserva.participantes?.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {reserva.participantes.map((p, idx) => (
                    <span 
                      key={idx}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '12px',
                        fontWeight: 500,
                        border: '1px solid #B9BBBB',
                        backgroundColor: '#f5f5f5',
                        marginRight: '4px',
                        marginBottom: '4px',
                        display: 'inline-block'
                      }}
                    >
                      {p.usuario?.nombre || 'N/A'} {p.usuario?.apellido || ''}
                    </span>
                  ))}
                </div>
              )}
            </Descriptions.Item>
          </Descriptions>

          {/* Historial: mostrar según rol */}
          <div style={{ marginTop: '16px' }}>
            <h4>
              {esAdmin ? 'Historial Completo:' : 'Información de la Reserva:'}
              {esAdmin && (
                <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#888', marginLeft: '8px' }}>
                  (Solo visible para técnicos)
                </span>
              )}
            </h4>

            {tieneHistorial ? (
              <>
                {historialParaMostrar.map((h, idx) => (
                  <Card key={idx} size="small" style={{ marginBottom: '8px' }}>
                    <div><strong>{esAdmin ? 'Acción' : 'Estado'}:</strong> {ucfirst(h.accion)}</div>
                    {h.observacion && (
                      <div><strong>{esAdmin ? 'Observación' : 'Motivo'}:</strong> {h.observacion}</div>
                    )}
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {esAdmin && h.usuario?.nombre && (
                        <>
                          <strong>Por:</strong> {h.usuario.nombre} {h.usuario.apellido}
                          {' - '}
                        </>
                      )}
                      {h.fechaAccion && formatearFechaHora(h.fechaAccion)}
                    </div>
                  </Card>
                ))}
              </>
            ) : (
              <Card size="small">
                {reserva.estado === 'pendiente' ? (
                  <Empty
                    image={<ClockCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />}
                    imageStyle={{ height: 60 }}
                    description={
                      <span style={{ color: '#888' }}>
                        {esAdmin 
                          ? 'Esta reserva está pendiente de aprobación. El historial se actualizará cuando se tome una decisión.'
                          : 'Tu reserva está siendo revisada. Te notificaremos cuando sea aprobada o rechazada.'}
                      </span>
                    }
                  />
                ) : (
                  <Empty
                    description={
                      <span style={{ color: '#888' }}>
                        No hay historial disponible para esta reserva
                      </span>
                    }
                  />
                )}
              </Card>
            )}
          </div>
        </>
      ) : null}
    </Modal>
  );
};

export default ModalDetalleReserva;