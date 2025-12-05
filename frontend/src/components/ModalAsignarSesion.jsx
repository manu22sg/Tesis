import React, { useState } from 'react';
import { Modal, Button, Select, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { formatearFecha, formatearHora } from '../utils/formatters.js';

const { Text } = Typography;

export default function ModalAsignarSesion({ 
  visible, 
  onClose, 
  entrenamiento, 
  sesionesDisponibles, 
  loadingSesiones, 
  onAsignar 
}) {
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAsignar = async () => {
    if (!sesionSeleccionada) return;
    
    setLoading(true);
    try {
      await onAsignar(sesionSeleccionada);
      setSesionSeleccionada(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSesionSeleccionada(null);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LinkOutlined />
          <span>Asignar entrenamiento a sesión</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancelar
        </Button>,
        <Button
          key="ok"
          type="primary"
          loading={loading}
          onClick={handleAsignar}
          disabled={!sesionSeleccionada}
        >
          Asignar
        </Button>,
      ]}
      width={600}
    >
      {entrenamiento && (
        <>
          <p>
            <Text strong>Entrenamiento:</Text> {entrenamiento.titulo}
          </p>
          <p style={{ marginBottom: 12 }}>
            <Text type="secondary">
              Seleccione la sesión activa a la que deseas asignarlo:
            </Text>
          </p>

          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder="Seleccione una sesión activa"
            allowClear
            value={sesionSeleccionada}
            onChange={setSesionSeleccionada}
            loading={loadingSesiones}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={sesionesDisponibles.map((s) => ({
              value: s.id,
              label: `${formatearFecha(s.fecha)} - ${formatearHora(s.horaInicio)} - ${formatearHora(s.horaFin)} - ${s.grupo?.nombre}`,
            }))}
          />

          {!loadingSesiones && sesionesDisponibles.length === 0 && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary">
                No se encontraron sesiones activas para asignar.
              </Text>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}