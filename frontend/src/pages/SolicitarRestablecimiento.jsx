import { useState } from "react";
import { Form, Input, Button, Card, Typography, message, Alert } from "antd";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { solicitarRestablecimientoRequest } from "../services/auth.services.js";

const { Title, Text: AntText } = Typography;

export default function SolicitarRestablecimiento() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);

    try {
      const response = await solicitarRestablecimientoRequest(values.email);
      
      // ✅ Si llega aquí, el correo se envió exitosamente
      setEmailEnviado(true);
      message.success("Correo enviado exitosamente. Revisa tu bandeja de entrada.");

    } catch (error) {
      console.error("Error:", error);
      
      // ✅ Manejo de errores específicos
      const errorMessage = error?.message || error?.error || "Error al enviar el correo";
      
      if (errorMessage.includes("No existe una cuenta")) {
        message.error("No existe una cuenta registrada con este correo");
      } else if (errorMessage.includes("verificar tu cuenta")) {
        message.error("Debes verificar tu cuenta antes de restablecer la contraseña");
      } else if (errorMessage.includes("no está activa")) {
        message.error("Tu cuenta no está activa. Contacta al administrador");
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f9fb",
        padding: 24,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 12,
          padding: "24px 32px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/login")}
          style={{ marginBottom: 16, padding: 0 }}
        >
          Volver al inicio de sesión
        </Button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ color: "#014898", marginBottom: 4 }}>
            ¿Olvidó su contraseña?
          </Title>
          <AntText type="secondary">
            Ingrese su correo institucional y le enviaremos un enlace para restablecerla
          </AntText>
        </div>

        {emailEnviado ? (
          <>
            <Alert
              message="¡Correo enviado!"
              description="Hemos enviado un enlace a su correo. Revise su bandeja de entrada y la carpeta de spam. El enlace expira en 1 hora."
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Button
              type="primary"
              block
              size="large"
              onClick={() => navigate("/login")}
              style={{
                backgroundColor: "#014898",
                borderColor: "#014898",
                borderRadius: 8,
              }}
            >
              Volver al inicio de sesión
            </Button>

            <Button
              type="link"
              block
              onClick={() => {
                setEmailEnviado(false);
                form.resetFields();
              }}
              style={{ marginTop: 12 }}
            >
              ¿No recibiste el correo? Inténtalo nuevamente
            </Button>
          </>
        ) : (
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Correo institucional"
              name="email"
              rules={[
                { required: true, message: "Ingresa tu correo" },
                { type: "email", message: "Ingresa un correo válido" },
                {
                  pattern: /.+@(alumnos\.)?ubiobio\.cl$/,
                  message: "Debe ser un correo institucional UBB",
                },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Ingrese su correo institucional"
                size="large"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                backgroundColor: "#014898",
                borderColor: "#014898",
                borderRadius: 8,
              }}
            >
              Enviar enlace de restablecimiento
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
}