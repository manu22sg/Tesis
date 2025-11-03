import React, { memo } from 'react';
import { Modal, Button, Spin, Tag } from 'antd';
import dayjs from 'dayjs';

const colorForTipo = (tipo) => {
  const t = (tipo || '').toLowerCase();
  const map = { tecnica: 'blue', táctica: 'green', tactica: 'green', fisica: 'orange', mixta: 'purple' };
  return map[t] || 'default';
};

const DetalleSesionModal = memo(({ open, loading, sesion, onClose }) => {
  if (!open) return null;

  return (
    <Modal
      title="Detalle de la Sesión"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Cerrar</Button>]}
      width={600}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        sesion && (
          <div>
            <h3>Información General</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><strong>Fecha:</strong> {dayjs(sesion.fecha).format('DD/MM/YYYY')}</div>
              <div><strong>Horario:</strong> {sesion.horaInicio} - {sesion.horaFin}</div>
              <div><strong>Cancha:</strong> {sesion.cancha?.nombre || 'Sin cancha'}</div>
              <div><strong>Grupo:</strong> {sesion.grupo?.nombre || 'Sin grupo'}</div>
              <div><strong>Tipo:</strong> <Tag color={colorForTipo(sesion.tipoSesion)}>{sesion.tipoSesion}</Tag></div>
            </div>
            {sesion.objetivos && (
              <div style={{ marginTop: 12 }}>
                <strong>Objetivos:</strong>
                <p style={{ marginTop: 4, color: '#666' }}>{sesion.objetivos}</p>
              </div>
            )}
          </div>
        )
      )}
    </Modal>
  );
});

export default DetalleSesionModal;
