import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { registerRequest } from "../services/auth.services";
import { carreraService } from "../services/carrera.services";

export default function Register() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  
  // Estados del formulario
  const [rut, setRut] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [carreraId, setCarreraId] = useState("");
  
  // Estados de UI
  const [carreras, setCarreras] = useState([]);
  const [loadingCarreras, setLoadingCarreras] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);

  // Cargar carreras al montar el componente
  useEffect(() => {
    cargarCarreras();
  }, []);

  const cargarCarreras = async () => {
    try {
      const data = await carreraService.listar();
      setCarreras(data);
    } catch (error) {
      console.error("Error cargando carreras:", error);
      messageApi.error("Error al cargar las carreras");
    } finally {
      setLoadingCarreras(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validar fortaleza de la contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(`La contraseña debe cumplir: ${passwordValidation.missingRequirements.join(", ")}`);
      return;
    }

    // Validar que se haya seleccionado una carrera
    if (!carreraId) {
      setError("Debes seleccionar una carrera");
      return;
    }

    setLoading(true);

    try {
      const response = await registerRequest({
        rut,
        nombre,
        apellido,
        email,
        password,
        carreraId: parseInt(carreraId)
      });

      messageApi.success({
        content: "✅ Registro exitoso. Revisa tu correo institucional para verificar tu cuenta.",
        duration: 3,
        onClose: () => {
          navigate("/login");
        }
      });

    } catch (err) {
      console.error("Error de registro:", err.response?.data);
      
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.details || 
                      "Error al registrarse";
      
      messageApi.error({
        content: errorMsg,
        duration: 3,
      });
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear RUT mientras se escribe
  const formatRut = (value) => {
    const clean = value.replace(/[^0-9kK]/g, '');
    
    if (clean.length > 1) {
      const body = clean.slice(0, -1);
      const dv = clean.slice(-1);
      return `${body}-${dv}`;
    }
    
    return clean;
  };

  const handleRutChange = (e) => {
    const formatted = formatRut(e.target.value);
    setRut(formatted);
  };

  return (
    <>
      {contextHolder}
      <div style={containerStyle}>
        <div style={formWrapperStyle}>
          <div style={headerStyle}>
            <img
              src="/escudo-color-gradiente-oscuro.png"
              alt="Logo UBB"
              style={logoStyle}
            />
            <h1 style={titleStyle}>Registrarse en SPORTUBB</h1>
            <p style={subtitleStyle}>Completa tus datos institucionales</p>
          </div>

          <form onSubmit={handleSubmit} style={formStyle}>
            
            {/* RUT */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>RUT</label>
              <input
                type="text"
                value={rut}
                onChange={handleRutChange}
                placeholder="12345678-9"
                required
                maxLength={10}
                style={inputStyle}
              />
            </div>

            {/* Nombre y Apellido en una fila */}
            <div style={rowStyle}>
              <div style={{ ...fieldGroupStyle, flex: 1 }}>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ ...fieldGroupStyle, flex: 1 }}>
                <label style={labelStyle}>Apellido</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Ej: Pérez"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Email */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Correo institucional</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@alumnos.ubiobio.cl"
                pattern=".+@(alumnos\.)?ubiobio\.cl"
                required
                style={inputStyle}
                title="El correo debe ser institucional (@alumnos.ubiobio.cl o @ubiobio.cl)"
              />
            </div>

            {/* Select de Carrera */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Carrera</label>
              <select
                value={carreraId}
                onChange={(e) => setCarreraId(e.target.value)}
                required
                disabled={loadingCarreras}
                style={{
                  ...inputStyle,
                  cursor: loadingCarreras ? "wait" : "pointer",
                  backgroundColor: loadingCarreras ? "#f5f5f5" : "#fff"
                }}
              >
                <option value="">
                  {loadingCarreras ? "Cargando carreras..." : "Selecciona tu carrera"}
                </option>
                {carreras.map((carrera) => (
                  <option key={carrera.id} value={carrera.id}>
                    {carrera.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Contraseña */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Contraseña</label>
              <div style={passwordContainerStyle}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordStrength(getPasswordStrength(e.target.value));
                  }}
                  placeholder="********"
                  required
                  style={passwordInputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={eyeButtonStyle}
                >
                  {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
              </div>

              {/* Barra de progreso de contraseña */}
              {password && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "6px"
                  }}>
                    <div style={{ fontSize: "13px", color: getColorStrength(passwordStrength) }}>
                      Seguridad: {passwordStrength}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {validatePassword(password).score}/5
                      </div>
                      {!validatePassword(password).isValid && (
                        <div 
                          style={infoIconStyle}
                          onMouseEnter={() => setShowPasswordTooltip(true)}
                          onMouseLeave={() => setShowPasswordTooltip(false)}
                        >
                          !
                          {showPasswordTooltip && (
                            <div style={tooltipStyle}>
                              <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px", color: "#333" }}>
                                Faltan requisitos:
                              </div>
                              {validatePassword(password).missingRequirements.map((req, index) => (
                                <div key={index} style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>
                                  • {req}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    width: "100%",
                    height: "6px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "3px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${(validatePassword(password).score / 5) * 100}%`,
                      height: "100%",
                      backgroundColor: getProgressColor(validatePassword(password).score),
                      transition: "all 0.3s ease",
                      borderRadius: "3px"
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Confirmar contraseña</label>
              <div style={passwordContainerStyle}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="********"
                  style={passwordInputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={eyeButtonStyle}
                >
                  {showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div style={errorBoxStyle}>
                {error}
              </div>
            )}

            {/* Botón de submit */}
            <button 
              type="submit" 
              disabled={loading || loadingCarreras}
              style={{
                ...buttonStyle,
                opacity: (loading || loadingCarreras) ? 0.6 : 1,
                cursor: (loading || loadingCarreras) ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </form>

          <p style={footerTextStyle}>
            ¿Ya tienes una cuenta?{" "}
            <a href="/login" style={linkStyle}>
              Inicia sesión aquí
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

// 🎨 ESTILOS
const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#f5f7fa",
  padding: "20px",
  fontFamily: "Segoe UI, sans-serif"
};

const formWrapperStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  padding: "40px",
  width: "100%",
  maxWidth: "500px"
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "30px"
};

const logoStyle = {
  width: "180px",
  marginBottom: "16px"
};

const titleStyle = {
  color: "#1e3a8a",
  fontSize: "28px",
  fontWeight: 700,
  marginBottom: "8px"
};

const subtitleStyle = {
  color: "#666",
  fontSize: "14px",
  marginTop: "0"
};

const formStyle = {
  width: "100%"
};

const fieldGroupStyle = {
  marginBottom: "20px"
};

const rowStyle = {
  display: "flex",
  gap: "16px"
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "14px",
  fontWeight: "500",
  color: "#333"
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  transition: "border-color 0.2s, box-shadow 0.2s",
  outline: "none",
  ":focus": {
    borderColor: "#1e3a8a",
    boxShadow: "0 0 0 3px rgba(30, 58, 138, 0.1)"
  }
};

const passwordContainerStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center"
};

const passwordInputStyle = {
  width: "100%",
  padding: "11px 40px 11px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none"
};

const eyeButtonStyle = {
  position: "absolute",
  right: "12px",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#666",
  fontSize: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0",
  zIndex: 1
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  backgroundColor: "#1e3a8a",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  fontSize: "16px",
  cursor: "pointer",
  transition: "background-color 0.2s, transform 0.1s",
  marginTop: "8px"
};

const errorBoxStyle = {
  color: "#dc2626",
  fontSize: "14px",
  padding: "12px",
  backgroundColor: "#fef2f2",
  borderRadius: "6px",
  border: "1px solid #fecaca",
  marginBottom: "16px"
};

const footerTextStyle = {
  marginTop: "24px",
  fontSize: "14px",
  color: "#666",
  textAlign: "center"
};

const linkStyle = {
  color: "#1e3a8a",
  fontWeight: "600",
  textDecoration: "none"
};

const tooltipStyle = {
  position: "absolute",
  top: "100%",
  right: "0",
  backgroundColor: "#fff",
  border: "1px solid #ddd",
  borderRadius: "6px",
  padding: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  zIndex: 10,
  marginTop: "4px",
  minWidth: "200px"
};

const infoIconStyle = {
  position: "relative",
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  backgroundColor: "#ff4d4f",
  color: "white",
  fontSize: "12px",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "help"
};

// 🔧 FUNCIONES AUXILIARES
function getProgressColor(score) {
  if (score <= 2) return "#ff4d4f";
  if (score <= 3) return "#faad14";
  if (score <= 4) return "#52c41a";
  return "#389e0d";
}

function getPasswordStrength(password) {
  const validation = validatePassword(password);
  
  if (password.length === 0) return "";
  if (validation.score <= 2) return "débil";
  if (validation.score <= 4) return "media";
  return "fuerte";
}

function validatePassword(password) {
  const requirements = [
    { name: "mínimo 8 caracteres", test: password.length >= 8 },
    { name: "una mayúscula", test: /[A-Z]/.test(password) },
    { name: "una minúscula", test: /[a-z]/.test(password) },
    { name: "un número", test: /[0-9]/.test(password) },
    { name: "un símbolo", test: /[!@#$%^&*(),.?":{}|<>\-_\[\]\/\\+=~;']/.test(password) }
  ];

  const passedRequirements = requirements.filter(req => req.test);
  const missingRequirements = requirements.filter(req => !req.test).map(req => req.name);

  return {
    isValid: requirements.every(req => req.test),
    score: passedRequirements.length,
    missingRequirements
  };
}

function getColorStrength(strength) {
  switch (strength) {
    case "débil": return "crimson";
    case "media": return "#e69b00";
    case "fuerte": return "limegreen";
    default: return "#333";
  }
}