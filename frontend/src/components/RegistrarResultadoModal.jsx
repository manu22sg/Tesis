import React, { useState, useEffect } from 'react';
import {
  Modal, Form, InputNumber, Alert, Space, Typography, Divider,
  message, Row, Col, Card, Tag
} from 'antd';
import {
  TrophyOutlined, FireOutlined, WarningOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const capitalize = (str) =>
  typeof str === 'string' && str.length
    ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    : '';

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
      const rondasEliminatorias = ['octavos', 'cuartos', 'semifinal', 'final'];
      const esEliminatoria = rondasEliminatorias.includes(partido.ronda?.toLowerCase());
      setEsEliminacionDirecta(esEliminatoria);

      form.setFieldsValue({
        golesA: partido.golesA !== null ? partido.golesA : null,
        golesB: partido.golesB !== null ? partido.golesB : null,
        penalesA: partido.penalesA ?? undefined,
        penalesB: partido.penalesB ?? undefined,
      });

      if (partido.golesA !== null && partido.golesB !== null) {
        setHayEmpate(partido.golesA === partido.golesB);
      } else {
        setHayEmpate(false);
      }
    }
  }, [partido, visible, form]);

  const equipoA = equipos?.find(e => e.id === partido?.equipoAId);
  const equipoB = equipos?.find(e => e.id === partido?.equipoBId);

  const handleValuesChange = (_, allValues) => {
    const { golesA, golesB } = allValues;

    if (golesA !== null && golesA !== undefined &&
        golesB !== null && golesB !== undefined) {
      const empate = golesA === golesB;
      setHayEmpate(empate);

      if (!empate) {
        form.setFieldsValue({
          penalesA: undefined,
          penalesB: undefined,
        });
      }
    } else {
      setHayEmpate(false);
    }
  };

  const handleSubmit = async (values) => {
    const { golesA, golesB, penalesA, penalesB } = values;

    if (typeof golesA !== 'number' || typeof golesB !== 'number') {
      message.error('Debe ingresar ambos marcadores');
      return;
    }

    if (esEliminacionDirecta && golesA === golesB) {
      if (typeof penalesA !== 'number' || typeof penalesB !== 'number') {
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

      form.resetFields();
      setHayEmpate(false);
    } catch (error) {
      console.error('Error al registrar:', error);
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
          {/* Cabecera estilo "programar partido" */}
          <Card
            size="small"
            style={{
              marginBottom: 16,
              backgroundColor: '#f0f5ff',
              border: '1px solid #d6e4ff'
            }}
          >
            {/* Fila de Nombres de Equipo */}
            <Row gutter={16} align="middle">
              <Col span={10} style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)' }}>
                  {equipoA?.nombre || 'Equipo A'}
                </div>
              </Col>
              <Col span={4} style={{ textAlign: 'center' }}>
                <Text strong style={{ fontSize: 16 }}>VS</Text>
              </Col>
              <Col span={10} style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)' }}>
                  {equipoB?.nombre || 'Equipo B'}
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag color="purple">{capitalize(partido.ronda)}</Tag>
              <span />
            </div>
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

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={handleValuesChange}
          >
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
                      max={99}
                      placeholder="Ingrese goles"
                      controls={false}
                      keyboard
                      parser={(value) => String(value ?? '').replace(/[^\d]/g, '')}
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
                      max={99}
                      placeholder="Ingrese goles"
                      controls={false}
                      keyboard
                      parser={(value) => String(value ?? '').replace(/[^\d]/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Penales (solo si hay empate y es eliminación directa) */}
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
                        max={99}
                        placeholder="Ingrese penales"
                        controls={false}
                        keyboard
                        parser={(value) => String(value ?? '').replace(/[^\d]/g, '')}
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
                        max={99}
                        placeholder="Ingrese penales"
                        controls={false}
                        keyboard
                        parser={(value) => String(value ?? '').replace(/[^\d]/g, '')}
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
