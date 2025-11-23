import { useState, useEffect } from "react";
import { Form, Input, Button, Card, Typography, message, Alert } from "antd";
import { EyeOutlined, EyeInvisibleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { restablecerPasswordRequest } from "../services/auth.services.js";

const { Title, Text } = Typography;


const passwordRequirements = [
  { test: (p) => p.length >= 8, text: "Mínimo 8 caracteres" },
  { test: (p) => /[A-Z]/.test(p), text: "Una mayúscula (A-Z)" },
  { test: (p) => /[a-z]/.test(p), text: "Una minúscula (a-z)" },
  { test: (p) => /[0-9]/.test(p), text: "Un número (0-9)" },
  { test: (p) => /[@$!%*?&_.#\-'"]/.test(p), text: "Un símbolo (@$!%*?&_.#-'\")" },
];

const passwordScore = (password) =>
  passwordRequirements.filter((r) => r.test(password)).length;

const getStrengthColor = (score) => {
  if (score <= 2) return "#ff4d4f";
  if (score === 3) return "#faad14";
  if (score === 4) return "#52c41a";
  if (score === 5) return "#389e0d";
};

const getStrengthText = (score) => {
  if (score <= 2) return "Débil";
  if (score === 3) return "Media";
  if (score === 4) return "Fuerte";
  if (score === 5) return "Muy fuerte";
};

export default function RestablecerPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [tokenValido, setTokenValido] = useState(true);

  useEffect(() => {
    if (!token) {
      message.error("Token inválido");
      setTokenValido(false);
    }
  }, [token]);

  const onFinish = async (values) => {
    if (passwordScore(values.password) < 5) {
      message.error("La contraseña no cumple todos los requisitos");
      return;
    }

    setLoading(true);

    try {
      await restablecerPasswordRequest(token, values.password);
      
      message.success("¡Contraseña restablecida exitosamente!");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      console.error("Error:", error);
      
      if (error?.message?.includes("expirado")) {
        message.error("El enlace ha expirado. Solicita uno nuevo.");
        setTokenValido(false);
      } else if (error?.message?.includes("inválido")) {
        message.error("El enlace no es válido.");
        setTokenValido(false);
      } else {
        message.error(
          error?.message || 
          "Error al restablecer la contraseña. Intenta nuevamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValido) {
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
            textAlign: "center",
          }}
        >
          <Alert
            message="Enlace inválido o expirado"
            description="El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita uno nuevo."
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/solicitar-restablecimiento")}
            style={{
              backgroundColor: "#014898",
              borderColor: "#014898",
              borderRadius: 8,
            }}
          >
            Solicitar nuevo enlace
          </Button>
        </Card>
      </div>
    );
  }

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
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ color: "#014898", marginBottom: 4 }}>
            Nueva contraseña
          </Title>
          <Text type="secondary">
            Ingresa una contraseña segura para tu cuenta
          </Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* CONTRASEÑA */}
          <Form.Item
            label="Nueva contraseña"
            name="password"
            rules={[
              { required: true, message: "Ingresa una contraseña" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (passwordScore(value) < 5) {
                    return Promise.reject(
                      new Error("La contraseña no cumple todos los requisitos")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password
              placeholder="••••••••"
              size="large"
              iconRender={(visible) =>
                visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
              }
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          {/* CONFIRMAR CONTRASEÑA */}
          <Form.Item
            label="Confirmar contraseña"
            name="confirmPassword"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Confirma tu contraseña" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Las contraseñas no coinciden"));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="••••••••"
              size="large"
              iconRender={(visible) =>
                visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          {/* BARRA DE FORTALEZA */}
          {password && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  height: 8,
                  width: "100%",
                  borderRadius: 4,
                  background: "#eee",
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(passwordScore(password) / 5) * 100}%`,
                    background: getStrengthColor(passwordScore(password)),
                    transition: "0.3s",
                  }}
                />
              </div>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: getStrengthColor(passwordScore(password)),
                }}
              >
                Fortaleza: {getStrengthText(passwordScore(password))}
              </Text>
            </div>
          )}

          {/* REQUISITOS */}
          {password && (
            <div
              style={{
                background: "#f5f5f5",
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Requisitos:
              </Text>
              {passwordRequirements.map((req, idx) => {
                const isValid = req.test(password);
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    {isValid ? (
                      <CheckCircleOutlined style={{ color: "#8CC63F" }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: "#B9BBBB" }} />
                    )}
                    <Text
                      style={{
                        fontSize: 13,
                        color: isValid ? "#8CC63F" : "#8c8c8c",
                      }}
                    >
                      {req.text}
                    </Text>
                  </div>
                );
              })}
            </div>
          )}

          {/* BOTÓN */}
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
            Cambiar contraseña
          </Button>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Text>
              <a href="/login" style={{ color: "#003a8c" }}>
                Volver al inicio de sesión
              </a>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}