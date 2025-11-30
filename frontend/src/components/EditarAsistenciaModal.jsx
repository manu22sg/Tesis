import { Modal, Button, Select, Radio, Space, Typography } from 'antd';
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
  setNuevoEstado,
  nuevoMaterial,
  setNuevoMaterial,
  loading,
  onClose,
  onConfirm
}) {

  // Preparar valores iniciales al abrir
  const entregoInicial = asistencia?.entregoMaterial;
  const valorMaterial = 
      entregoInicial === true ? "true" :
      entregoInicial === false ? "false" : "null";

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
          onClick={() =>
            onConfirm({
              estado: nuevoEstado,
              entregoMaterial: 
                nuevoMaterial === "null"
                  ? null
                  : nuevoMaterial === "true"
            })
          }
        >
          Actualizar
        </Button>,
      ]}
    >
      {asistencia && (
        <div>
          {/* Jugador */}
          <div style={{ marginBottom: 16 }}>
            <Text strong>Jugador: </Text>
            <Text>
              {asistencia.jugador?.usuario?.nombre || 'Sin nombre'}{" "}
              {asistencia.jugador?.usuario?.apellido || ""}
            </Text>
          </div>

          {/* Estado */}
          <div style={{ marginBottom: 24 }}>
            <Text strong>Nuevo Estado:</Text>
            <Select
  value={nuevoEstado}
  onChange={setNuevoEstado}
  style={{ width: '100%', marginTop: 8 }}
  size="medium"
>
  {Object.entries(ESTADOS).map(([key, config]) => (
    <Select.Option key={key} value={key}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    </Select.Option>
  ))}
</Select>
          </div>

          {/* NUEVO → Entrego Material */}
          <div style={{ marginBottom: 24 }}>
            <Text strong>¿Entregó Material? </Text>
            <Radio.Group
              defaultValue={valorMaterial}
              style={{ marginTop: 8 }}
              onChange={(e) => setNuevoMaterial(e.target.value)}
            >
              <Space direction="vertical">
                <Radio value="true">Sí</Radio>
                <Radio value="false">No</Radio>
                <Radio value="null">No aplica</Radio>
              </Space>
            </Radio.Group>
          </div>
        </div>
      )}
    </Modal>
  );
}
