import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { registerRequest } from '../services/authServices.js';
import { carreraService } from '../services/carreraServices.js';

// Validación de RUT
const validateRut = (rut) => {
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

// Requisitos de contraseña
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

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [loadingCarreras, setLoadingCarreras] = useState(true);
  const [carreras, setCarreras] = useState([]);
  const [showCarrerasPicker, setShowCarrerasPicker] = useState(false);

  // Form fields
  const [rut, setRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [carreraId, setCarreraId] = useState(null);
  const [carreraNombre, setCarreraNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [rutValid, setRutValid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cargar carreras
  useEffect(() => {
    fetchCarreras();
  }, []);

  const fetchCarreras = async () => {
    try {
      const data = await carreraService.listar();
      setCarreras(data);
    } catch (error) {
      console.error('Error al cargar carreras:', error);
      Alert.alert('Error', 'No se pudieron cargar las carreras');
    } finally {
      setLoadingCarreras(false);
    }
  };

  // Manejar RUT
  const handleRutChange = (inputValue) => {
    let cleaned = inputValue.replace(/[^0-9kK]/g, '');
    cleaned = cleaned.slice(0, 9);

    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = `${cleaned.slice(0, -1)}-${cleaned.slice(-1).toLowerCase()}`;
    }

    setRut(formatted);

    if (cleaned.length === 9) {
      setRutValid(validateRut(formatted));
    } else {
      setRutValid(null);
    }
  };

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const handleRegister = async () => {
    // Validaciones
    if (!rut || !nombre || !apellido || !email || !carreraId || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!validateRut(rut)) {
      Alert.alert('Error', 'El RUT ingresado no es válido');
      return;
    }

    if (!/^.+@(alumnos\.)?ubiobio\.cl$/.test(email)) {
      Alert.alert('Error', 'Debe ser un correo institucional UBB');
      return;
    }

    if (passwordScore(password) < 5) {
      Alert.alert('Error', 'La contraseña no cumple todos los requisitos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        rut,
        nombre,
        apellido,
        email,
        carreraId,
        password
      };

      await registerRequest(payload);

      Alert.alert(
        'Registro exitoso',
        'Revisa tu correo institucional para verificar tu cuenta',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      console.error('Error en registro:', error);
      const errorMsg = error.response?.data?.message || 'Error al registrarse';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>🏀 SportUBB</Text>
          <Text style={styles.subtitle}>Crear cuenta</Text>

          {/* RUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>RUT</Text>
            <View style={[
              styles.input,
              rutValid === true && styles.inputSuccess,
              rutValid === false && styles.inputError
            ]}>
              <TextInput
                style={styles.textInput}
                placeholder="12345678-9"
                value={rut}
                onChangeText={handleRutChange}
                keyboardType="numeric"
                maxLength={10}
              />
              {rutValid !== null && (
                <Text style={styles.validationIcon}>
                  {rutValid ? '✓' : '✗'}
                </Text>
              )}
            </View>
            {rutValid === true && (
              <Text style={styles.successText}>RUT válido</Text>
            )}
            {rutValid === false && (
              <Text style={styles.errorText}>RUT inválido</Text>
            )}
          </View>

          {/* Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
            />
          </View>

          {/* Apellido */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Pérez"
              value={apellido}
              onChangeText={setApellido}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo institucional</Text>
            <TextInput
              style={styles.input}
              placeholder="ejemplo@ubiobio.cl"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Carrera */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Carrera</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowCarrerasPicker(true)}
              disabled={loadingCarreras}
            >
              <Text style={carreraNombre ? styles.textInput : styles.placeholder}>
                {loadingCarreras ? 'Cargando...' : carreraNombre || 'Selecciona tu carrera'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selector de carreras (simple) */}
          {showCarrerasPicker && (
            <View style={styles.pickerContainer}>
              <ScrollView style={styles.pickerScroll}>
                {carreras.map((carrera) => (
                  <TouchableOpacity
                    key={carrera.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setCarreraId(carrera.id);
                      setCarreraNombre(carrera.nombre);
                      setShowCarrerasPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{carrera.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.pickerCloseButton}
                onPress={() => setShowCarrerasPicker(false)}
              >
                <Text style={styles.pickerCloseText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={toggleShowPassword}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Barra de fuerza */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${(passwordScore(password) / 5) * 100}%`,
                        backgroundColor: getStrengthColor(passwordScore(password))
                      }
                    ]}
                  />
                </View>
                <Text style={styles.strengthText}>
                  Debe tener: 8 caracteres, mayúscula, minúscula, número y símbolo
                </Text>
              </View>
            )}
          </View>

          {/* Confirmar contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={toggleShowConfirmPassword}
              >
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {confirmPassword && password !== confirmPassword && (
              <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
            )}
          </View>

          {/* Botón de registro */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </TouchableOpacity>

          {/* Link a login */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? Inicia sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputSuccess: {
    borderColor: '#52c41a',
  },
  inputError: {
    borderColor: '#ff4d4f',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  placeholder: {
    flex: 1,
    fontSize: 16,
    color: '#999',
  },
  validationIcon: {
    fontSize: 18,
    marginLeft: 10,
  },
  successText: {
    color: '#52c41a',
    fontSize: 12,
    marginTop: 5,
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 12,
    marginTop: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeButton: {
    padding: 15,
  },
  eyeIcon: {
    fontSize: 22,
  },
  strengthContainer: {
    marginTop: 10,
  },
  strengthBar: {
    height: 6,
    width: '100%',
    borderRadius: 4,
    backgroundColor: '#eee',
    overflow: 'hidden',
    marginBottom: 5,
  },
  strengthFill: {
    height: '100%',
  },
  strengthText: {
    fontSize: 12,
    color: '#666',
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1000,
  },
  pickerScroll: {
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: 400,
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerCloseButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  pickerCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});