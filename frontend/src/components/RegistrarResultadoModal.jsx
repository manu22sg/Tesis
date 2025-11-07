import React, { useState, useEffect } from 'react';
import {
  Modal, Form, InputNumber, Alert, Space, Typography, Divider,
  message, Row, Col, Card, Statistic
} from 'antd';
import {
  TrophyOutlined, FireOutlined, WarningOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const RegistrarResultadoModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  partido, 
  equipos 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hayEmpate, setHayEmpate] = useState(false);
  const [esEliminacionDirecta, setEsEliminacionDirecta] = useState(false);

  useEffect(() => {
    if (partido && visible) {
      // Verificar si es eliminación directa
      const rondasEliminatorias = ['octavos', 'cuartos', 'semifinal', 'final'];
      const esEliminatoria = rondasEliminatorias.includes(partido.ronda?.toLowerCase());
      setEsEliminacionDirecta(esEliminatoria);

      // Cargar valores existentes si ya hay resultados
      form.setFieldsValue({
        golesA: partido.golesA || 0,
        golesB: partido.golesB || 0,
        penalesA: partido.penalesA || undefined,
        penalesB: partido.penalesB || undefined,
      });

      // Verificar si hay empate con los valores actuales
      if (partido.golesA !== null && partido.golesB !== null) {
        setHayEmpate(partido.golesA === partido.golesB);
      }
    }
  }, [partido, visible, form]);

  const equipoA = equipos?.find(e => e.id === partido?.equipoAId);
  const equipoB = equipos?.find(e => e.id === partido?.equipoBId);

  const handleValuesChange = (changedValues, allValues) => {
    const { golesA, golesB } = allValues;
    
    // Detectar empate en tiempo real
    if (golesA !== undefined && golesB !== undefined) {
      const empate = golesA === golesB;
      setHayEmpate(empate);
      
      // Si ya no hay empate, limpiar penales
      if (!empate) {
        form.setFieldsValue({
          penalesA: undefined,
          penalesB: undefined,
        });
      }
    }
  };

  const handleSubmit = async (values) => {
    const { golesA, golesB, penalesA, penalesB } = values;

    // Validación: empate en eliminación directa sin penales
    if (esEliminacionDirecta && golesA === golesB) {
      if (penalesA === undefined || penalesB === undefined) {
        message.error('Debes definir el resultado por penales');
        return;
      }
      
      if (penalesA === penalesB) {
        message.error('Los penales no pueden terminar empatados');
        return;
      }
    }

    setLoading(true);
    try {
      await onSuccess({
        partidoId: partido.id,
        golesA,
        golesB,
        penalesA: hayEmpate ? penalesA : null,
        penalesB: hayEmpate ? penalesB : null,
      });
      
      message.success('Resultado registrado exitosamente');
      form.resetFields();
      setHayEmpate(false);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al registrar resultado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <FireOutlined style={{ color: '#ff4d4f' }} />
          <span>Registrar Resultado</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Registrar"
      cancelText="Cancelar"
      width={600}
    >
      {partido && (
        <>
          {/* Info del partido */}
          <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
            <Row gutter={16}>
              <Col span={10}>
                <Statistic
                  title={equipoA?.nombre || 'Equipo A'}
                  value={equipoA?.nombre || 'Equipo A'}
                  valueStyle={{ fontSize: 16, fontWeight: 'bold' }}
                />
              </Col>
              <Col span={4} style={{ textAlign: 'center', paddingTop: 20 }}>
                <Text strong style={{ fontSize: 18 }}>VS</Text>
              </Col>
              <Col span={10}>
                <Statistic
                  title={equipoB?.nombre || 'Equipo B'}
                  value={equipoB?.nombre || 'Equipo B'}
                  valueStyle={{ fontSize: 16, fontWeight: 'bold' }}
                />
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary">
              Ronda: <strong>{partido.ronda?.toUpperCase()}</strong>
            </Text>
          </Card>

          {/* Alerta de eliminación directa */}
          {esEliminacionDirecta && (
            <Alert
              message=" Eliminación Directa"
              description="En caso de empate, deberás definir el ganador por penales."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Formulario */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={handleValuesChange}
            initialValues={{
              golesA: 0,
              golesB: 0,
            }}
          >
            {/* Marcador Regular */}
            <Card 
              title="Marcador Regular" 
              size="small" 
              style={{ marginBottom: 16 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="golesA"
                    label={equipoA?.nombre || 'Equipo A'}
                    rules={[
                      { required: true, message: 'Requerido' },
                      { type: 'number', min: 0, message: 'Mínimo 0' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      size="large"
                      min={0}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="golesB"
                    label={equipoB?.nombre || 'Equipo B'}
                    rules={[
                      { required: true, message: 'Requerido' },
                      { type: 'number', min: 0, message: 'Mínimo 0' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      size="large"
                      min={0}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Penales (solo si hay empate) */}
            {hayEmpate && esEliminacionDirecta && (
              <Card 
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    <span>Definición por Penales</span>
                  </Space>
                }
                size="small"
                style={{ 
                  marginBottom: 16,
                  borderColor: '#faad14',
                  background: '#fffbe6'
                }}
              >
                <Alert
                  message="¡Empate detectado!"
                  description="Registra el resultado de la tanda de penales para determinar el ganador."
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  style={{ marginBottom: 12 }}
                />
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="penalesA"
                      label={`Penales ${equipoA?.nombre || 'Equipo A'}`}
                      rules={[
                        { required: true, message: 'Requerido' },
                        { type: 'number', min: 0, message: 'Mínimo 0' }
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        size="large"
                        min={0}
                        placeholder="0"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="penalesB"
                      label={`Penales ${equipoB?.nombre || 'Equipo B'}`}
                      rules={[
                        { required: true, message: 'Requerido' },
                        { type: 'number', min: 0, message: 'Mínimo 0' }
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        size="large"
                        min={0}
                        placeholder="0"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Alerta si hay empate en fase de grupos */}
            {hayEmpate && !esEliminacionDirecta && (
              <Alert
                message="Empate"
                description="El partido quedará registrado como empate."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
          </Form>
        </>
      )}
    </Modal>
  );
};

export default RegistrarResultadoModal;