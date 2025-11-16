import { useState, useEffect, useRef } from "react";
import { Form, Input, Button, Card, Typography, message, Select } from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  UserOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

import { carreraService } from "../services/carrera.services.js";
import { registerRequest } from "../services/auth.services.js"; // 👈 IMPORTANTE

const { Title, Text } = Typography;
const { Option } = Select;

// ----------------------
// Helpers
// ----------------------
export const validateRut = (rut) => {
  if (!rut) return false;

  const clean = rut.replace("-", "").toLowerCase();
  if (clean.length < 2) return false;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += multiplier * parseInt(body[i]);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expected = 11 - (sum % 11);
  const dvExpected =
    expected === 11 ? "0" : expected === 10 ? "k" : expected.toString();

  return dv === dvExpected;
};

// Password rules
const passwordRequirements = [
  { test: (p) => p.length >= 8, text: "8 caracteres" },
  { test: (p) => /[A-Z]/.test(p), text: "una mayúscula" },
  { test: (p) => /[a-z]/.test(p), text: "una minúscula" },
  { test: (p) => /[0-9]/.test(p), text: "un número" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), text: "un símbolo" },
];

const passwordScore = (password) =>
  passwordRequirements.filter((r) => r.test(password)).length;

const getStrengthColor = (score) => {
  if (score <= 2) return "#ff4d4f";
  if (score === 3) return "#faad14";
  if (score >= 4) return "#52c41a";
};

// ----------------------
// COMPONENTE
// ----------------------
export default function Register() {
  const [form] = Form.useForm();
  const rutRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [loadingCarreras, setLoadingCarreras] = useState(true);

  const [carreras, setCarreras] = useState([]);

  const [password, setPassword] = useState("");
  const [rut, setRut] = useState("");
  const [rutValid, setRutValid] = useState(null);

  // -------------------------------------
  // CARGAR CARRERAS DESDE EL BACKEND
  // -------------------------------------
  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const data = await carreraService.listar();
        setCarreras(data);
      } catch (error) {
        console.error("Error al cargar carreras:", error);
        message.error("Error al cargar las carreras");
      } finally {
        setLoadingCarreras(false);
      }
    };

    fetchCarreras();
  }, []);

  // -------------------------------------
  // RUT HANDLER
  // -------------------------------------
  const handleRutChange = (e) => {
    const inputValue = e.target.value;

    let cleaned = inputValue.replace(/[^0-9kK]/g, "");
    cleaned = cleaned.slice(0, 9);

    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = `${cleaned.slice(0, -1)}-${cleaned
        .slice(-1)
        .toLowerCase()}`;
    }

    setRut(formatted);

    if (cleaned.length === 9) {
      setRutValid(validateRut(formatted));
    } else {
      setRutValid(null);
    }

    // 🔥 Mantener el foco
    setTimeout(() => {
      rutRef.current?.focus({ cursor: "end" });
    }, 0);
  };

  // -------------------------------------
  // SUBMIT (REGISTER REAL)
  // -------------------------------------
  const onFinish = async (values) => {
    if (!rut) {
      message.error("Ingresa tu RUT");
      return;
    }

    if (!validateRut(rut)) {
      message.error("El RUT ingresado no es válido");
      return;
    }

    if (passwordScore(values.password) < 5) {
      message.error("La contraseña no cumple los requisitos");
      return;
    }
    if (values.password !== values.confirmPassword) {
  message.error("Las contraseñas no coinciden");
  return;
}

    const payload = {
      ...values,
      rut,
    };

    setLoading(true);

    try {
      const response = await registerRequest(payload); 

      message.success("Registro exitoso. Revise su correo institucional y confirme su cuenta para continuar.");

       setTimeout(() => {
    navigate("/login");
  }, 2000);

    } catch (error) {
      console.error("Error en registro:", error);

      message.error(
        error?.message ||
          error?.error ||
          "Error al registrarse. Intenta nuevamente."
      );
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
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Title level={3} style={{ color: "#003a8c", marginBottom: 4 }}>
            Crear Cuenta
          </Title>
          <Text type="secondary">Completa tus datos institucionales</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* ---------------------- RUT ---------------------- */}
          <Form.Item
            label="RUT"
            required
            validateStatus={
              rutValid === true ? "success" : rutValid === false ? "error" : ""
            }
            help={
              rutValid === true ? (
                <span style={{ color: "#52c41a" }}>
                  <CheckCircleOutlined /> RUT válido
                </span>
              ) : rutValid === false ? (
                <span style={{ color: "#ff4d4f" }}>
                  <CloseCircleOutlined /> RUT inválido
                </span>
              ) : null
            }
          >
            <Input
              ref={rutRef}
              placeholder="12345678-9"
              value={rut}
              onChange={handleRutChange}
              suffix={
                rutValid === true ? (
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                ) : rutValid === false ? (
                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                ) : null
              }
            />
          </Form.Item>

          {/* NOMBRE */}
          <Form.Item
            label="Nombre"
            name="nombre"
            rules={[{ required: true, message: "Ingresa tu nombre" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Ej: Juan" />
          </Form.Item>

          {/* APELLIDO */}
          <Form.Item
            label="Apellido"
            name="apellido"
            rules={[{ required: true, message: "Ingresa tu apellido" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Ej: Pérez" />
          </Form.Item>

          {/* CORREO */}
          <Form.Item
            label="Correo institucional"
            name="email"
            rules={[
              { required: true, message: "Ingresa tu correo" },
              {
                pattern: /.+@(alumnos\.)?ubiobio\.cl$/,
                message: "Debe ser un correo institucional UBB",
              },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Ingrese su correo institucional"
            />
          </Form.Item>

          {/* CARRERA */}
          <Form.Item
            label="Carrera"
            name="carreraId"
            rules={[{ required: true, message: "Seleccione su carrera" }]}
          >
            <Select
              placeholder="Seleccione su carrera"
              loading={loadingCarreras}
            >
              {carreras.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* CONTRASEÑA */}
          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: "Ingresa una contraseña" }]}
          >
            <Input.Password
              placeholder="••••••••"
              iconRender={(visible) =>
                visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
              }
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
          <Form.Item
  label="Confirmar contraseña"
  name="confirmPassword"
  dependencies={['password']}
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
    iconRender={(visible) =>
      visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
    }
  />
</Form.Item>

          {/* Barra de fuerza */}
          {password && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  height: 6,
                  width: "100%",
                  borderRadius: 4,
                  background: "#eee",
                  overflow: "hidden",
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
              <Text type="secondary" style={{ fontSize: 12 }}>
                La contraseña debe tener: 8 caracteres, mayúscula, minúscula,
                número y símbolo.
              </Text>
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
              backgroundColor: "#003a8c",
              borderColor: "#003a8c",
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            Registrarse
          </Button>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Text>
              ¿Ya tienes cuenta?{" "}
              <a href="/login" style={{ color: "#003a8c" }}>
                Inicia sesión
              </a>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
