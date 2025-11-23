import React from 'react';
import { formatearFecha, formatearFechaHora, formatearRangoHoras } from '../utils/formatters.js';
import { Modal, Button, Descriptions, Tag, Badge, Card } from 'antd';
import { EyeOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const ModalDetalleReserva = ({ visible, reserva, onClose }) => {
  if (!reserva) return null;

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'gold',
      aprobada: 'green',
      rechazada: 'red',
      completada: 'blue',
      expirada: 'volcano'
    };
    return colors[estado] || 'default';
  };

  const ucfirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');

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
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Usuario" span={2}>
          <div>
            <UserOutlined /> {reserva.usuario?.nombre} {reserva.usuario?.apellido}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {reserva.usuario?.email}
          </div>
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
          <Tag color={getEstadoColor(reserva.estado)}>
            {ucfirst(reserva.estado || '')}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Participantes" span={2}>
          <Badge count={reserva.participantes?.length || 0} showZero />
          {reserva.participantes?.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {reserva.participantes.map((p, idx) => (
                <Tag key={idx}>{p.usuario?.nombre || 'N/A'} {p.usuario?.apellido || ''}</Tag>
              ))}
            </div>
          )}
        </Descriptions.Item>
      </Descriptions>

      {reserva.historial?.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4>Historial:</h4>
          {reserva.historial.map((h, idx) => (
            <Card key={idx} size="small" style={{ marginBottom: '8px' }}>
              <div><strong>Acción:</strong> {ucfirst(h.accion)}</div>
              <div><strong>Observación:</strong> {h.observacion}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Por: {h.usuario?.nombre || 'Sistema'} 
              </div>
            </Card>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ModalDetalleReserva;
