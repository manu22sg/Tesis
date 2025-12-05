import React from 'react';
import { Modal, Button, Row, Col, Statistic, Typography } from 'antd';
import { BarChartOutlined, FileTextOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function ModalEstadisticas({ visible, onClose, estadisticas }) {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChartOutlined />
          <span>Estadísticas de Entrenamientos</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>
      ]}
      width={600}
    >
      {estadisticas ? (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Statistic
              title="Total Entrenamientos"
              value={estadisticas.totalEntrenamientos}
              prefix={<FileTextOutlined />}
            />
          </Col>
          
          <Col span={12}>
            <Statistic
              title="Duración Total"
              value={estadisticas.duracionTotalMinutos}
              suffix="min"
            />
          </Col>
          
          <Col span={12}>
            <Statistic
              title="Duración Promedio"
              value={estadisticas.duracionPromedioMinutos}
              suffix="min"
              precision={1}
            />
          </Col>
        </Row>
      ) : (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Text type="secondary">Cargando estadísticas...</Text>
        </div>
      )}
    </Modal>
  );
}