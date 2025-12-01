import { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, Space, Steps, Alert, Spin, App } from 'antd';
import {
  ThunderboltOutlined,
  AimOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import {
  obtenerFormacionesDisponibles,
  generarAlineacionInteligente,
  eliminarAlineacion,
  obtenerAlineacionPorSesion
} from '../services/alineacion.services.js';

const ModalAlineacionInteligente = ({
  visible,
  onCancel,
  onSuccess,
  sesionId,
  grupoId
}) => {
const { message } = App.useApp(); 

  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formaciones, setFormaciones] = useState([]);
  const [loadingFormaciones, setLoadingFormaciones] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);

  // Reset modal al cerrar
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setCurrentStep(0);
      setTipoSeleccionado(null);
      setFormaciones([]);
    }
  }, [visible, form]);

  // Cargar formaciones cuando elige tipo
  const handleTipoChange = async (tipo) => {
    setTipoSeleccionado(tipo);
    setLoadingFormaciones(true);
    form.setFieldValue('formacion', undefined);

    try {
      const data = await obtenerFormacionesDisponibles(tipo);

      if (Array.isArray(data)) {
        setFormaciones(data);
      } else {
        setFormaciones([]);
        message.warning('No se encontraron formaciones disponibles');
      }

    } catch (error) {
      message.error('Error al cargar formaciones');
    } finally {
      setLoadingFormaciones(false);
    }
  };

  // Reemplazar alineación
  const handleReemplazarAlineacion = async (payload) => {
    try {
      setLoading(true);

      const alineacionExistente = await obtenerAlineacionPorSesion(sesionId)
        .then(r => r.data)
        .catch(() => null);

      const idAlineacion = alineacionExistente?.id;

      if (!idAlineacion) {
        message.error("No existe alineación para reemplazar.");
        return;
      }

      await eliminarAlineacion(idAlineacion);
      await generarAlineacionInteligente(payload);

      message.success("Alineación reemplazada con éxito");

      onCancel();
      if (onSuccess) onSuccess();

    } catch (error) {

      const backendMsg = error.response?.data?.message;
      message.error(
        backendMsg
          ? `La alineación anterior fue eliminada, pero no se pudo generar la nueva: ${backendMsg}`
          : "Error inesperado durante el reemplazo."
      );

    } finally {
      setLoading(false);
    }
  };

  // Paso siguiente
  const handleNext = async () => {
    try {
      await form.validateFields(['tipoAlineacion']);
      setCurrentStep(1);

    } catch {
      message.error('Selecciona un tipo de alineación');
    }
  };

  // Generar alineación
  const handleGenerar = async () => {
    try {
      setLoading(true);

      const values = await form.validateFields(['tipoAlineacion', 'formacion']);

      const payload = {
        sesionId: parseInt(sesionId, 10),
        grupoId: parseInt(grupoId, 10),
        tipoAlineacion: values.tipoAlineacion,
        formacion: values.formacion
      };

      // Crear
      await generarAlineacionInteligente(payload);

      message.success("Alineación generada exitosamente");

      onCancel();
      if (onSuccess) setTimeout(onSuccess, 300);

    } catch (error) {

      const status = error.response?.status;
      const backendMsg = error.response?.data?.message;
      const extra = error.response?.data?.errors;

      console.error("❌ BACKEND ERROR:", error.response?.data);

      // ---------------------
      // MANEJO DEL 409 REAL
      // ---------------------
      if (status === 409) {

        const info = extra || {};

        const alineacion = await obtenerAlineacionPorSesion(sesionId)
          .then(r => r.data)
          .catch(() => null);

        const tieneJugadores = alineacion?.jugadores?.length > 0;

        // A) Existe fila pero SIN jugadores → reemplazar directo
        if (!tieneJugadores) {
          return handleReemplazarAlineacion({
            sesionId: parseInt(sesionId, 10),
            grupoId: parseInt(grupoId, 10),
            tipoAlineacion: form.getFieldValue('tipoAlineacion'),
            formacion: form.getFieldValue('formacion')
          });
        }

        // B) Tiene jugadores → pedir confirmación
        return Modal.confirm({
          title: "Alineación existente",
          content: backendMsg || "Ya existe una alineación para esta sesión. ¿Deseas reemplazarla?",
          okText: "Reemplazar",
          cancelText: "Cancelar",
          okType: "danger",
          centered: true,
          onOk: () =>
            handleReemplazarAlineacion({
              sesionId: parseInt(sesionId, 10),
              grupoId: parseInt(grupoId, 10),
              tipoAlineacion: form.getFieldValue('tipoAlineacion'),
              formacion: form.getFieldValue('formacion')
            })
        });
      }

      // VALIDACIONES DEL BACKEND
      if (extra && Array.isArray(extra)) {
        extra.forEach(err => {
          message.error(`${err.field}: ${err.message}`);
        });
      } else {
        message.error(backendMsg || "Error al generar alineación");
      }

    } finally {
      setLoading(false);
    }
  };

  // Render contenido
  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div style={{ minHeight: 200 }}>
          <Alert
            message="Selecciona el tipo de alineación"
            description="Elige si prefieres una formación ofensiva o defensiva."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form.Item
            name="tipoAlineacion"
            label="Tipo de Alineación"
            rules={[{ required: true, message: 'Selecciona un tipo' }]}
          >
            <Select
              size="large"
              placeholder="Selecciona el tipo"
              onChange={handleTipoChange}
            >
              <Select.Option value="ofensiva">
                <Space>
                  <ThunderboltOutlined style={{ color: '#ff4d4f' }} />
                  <strong>Ofensiva</strong>
                </Space>
              </Select.Option>

              <Select.Option value="defensiva">
                <Space>
                  <AimOutlined style={{ color: '#006B5B' }} />
                  <strong>Defensiva</strong>
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>
        </div>
      );
    }

    return (
      <div style={{ minHeight: 200 }}>
        <Alert
          message={`Formaciones ${tipoSeleccionado}s disponibles`}
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Spin spinning={loadingFormaciones}>
          <Form.Item
            name="formacion"
            label="Formación"
            rules={[{ required: true, message: 'Selecciona una formación' }]}
          >
            <Select
              size="large"
              placeholder="Selecciona una formación"
              disabled={loadingFormaciones || formaciones.length === 0}
            >
              {formaciones.map((f) => (
                <Select.Option key={f.nombre} value={f.nombre}>
                  <Space direction="vertical" size={0}>
                    <strong>{f.nombre}</strong>
                    <span style={{ fontSize: 12 }}>
                      POR: {f.distribucion.POR} |
                      DEF: {f.distribucion.DEF} |
                      MED: {f.distribucion.MED} |
                      DEL: {f.distribucion.DEL}
                    </span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Spin>

        {formaciones.length === 0 && !loadingFormaciones && (
          <Alert message="No hay formaciones disponibles" type="warning" showIcon />
        )}
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined />
          Generar Alineación Inteligente
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        currentStep > 0 && (
          <Button key="back" onClick={() => setCurrentStep(0)} disabled={loading}>
            Atrás
          </Button>
        ),
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>,
        currentStep === 0 ? (
          <Button
            key="next"
            type="primary"
            disabled={!tipoSeleccionado}
            onClick={handleNext}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            key="generate"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={loading}
            disabled={formaciones.length === 0}
            onClick={handleGenerar}
          >
            Generar Alineación
          </Button>
        )
      ]}
      width={600}
      maskClosable={false}
    >
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        <Steps.Step title="Tipo" icon={<ThunderboltOutlined />} />
        <Steps.Step title="Formación" icon={<AimOutlined />} />
      </Steps>

      <Form form={form} layout="vertical">
        {renderStepContent()}
      </Form>
    </Modal>
  );
};

export default ModalAlineacionInteligente;
