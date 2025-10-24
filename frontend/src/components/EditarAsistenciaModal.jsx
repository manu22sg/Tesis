import { Modal, Button, Select, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const ESTADOS = {
  presente: { label: 'Presente', color: 'success', icon: <CheckCircleOutlined /> },
  ausente: { label: 'Ausente', color: 'error', icon: <CloseCircleOutlined /> },
  justificado: { label: 'Justificado', color: 'warning', icon: <QuestionCircleOutlined /> },
};

export default function EditarAsistenciaModal({
  open,
  asistencia,
  nuevoEstado,
  onEstadoChange,
  loading,
  onClose,
  onConfirm
}) {
  return (
    <Modal
      title="Editar Estado de Asistencia"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={onConfirm}
        >
          Actualizar
        </Button>,
      ]}
    >
      {asistencia && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Jugador: </Text>
            <Text>{asistencia.jugador?.usuario?.nombre || 'Sin nombre'}</Text>
          </div>
          
          <div>
            <Text strong>Nuevo Estado:</Text>
            <Select
              value={nuevoEstado}
              onChange={onEstadoChange}
              style={{ width: '100%', marginTop: 8 }}
              size="large"
            >
              {Object.entries(ESTADOS).map(([key, config]) => (
                <Select.Option key={key} value={key}>
                  <Tag color={config.color} icon={config.icon}>
                    {config.label}
                  </Tag>
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </Modal>
  );
}