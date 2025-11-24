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
  ScrollView,
  Modal
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { registerRequest } from '../services/authServices.js';
import { carreraService } from '../services/carreraServices.js';
import { Ionicons } from '@expo/vector-icons';

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
  { test: (p) => /[@$!%*?&_.#\-'"]/.test(p), text: "un símbolo" },
];

const passwordScore = (password) =>
  passwordRequirements.filter((r) => r.test(password)).length;

const getStrengthColor = (score) => {
  if (score <= 2) return "#ff4d4f";
  if (score === 3) return "#faad14";
  if (score >= 4) return "#8CC63F";
};

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [loadingCarreras, setLoadingCarreras] = useState(true);
  const [carreras, setCarreras] = useState([]);
  const [showCarrerasPicker, setShowCarrerasPicker] = useState(false);
  const [showSexoPicker, setShowSexoPicker] = useState(false);

  // Form fields
  const [rut, setRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [sexo, setSexo] = useState('');
  const [carreraId, setCarreraId] = useState(null);
  const [carreraNombre, setCarreraNombre] = useState('');
  const [anioIngreso, setAnioIngreso] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [rutValid, setRutValid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [esEstudiante, setEsEstudiante] = useState(false);

  const sexoOpciones = [
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Femenino', label: 'Femenino' }
  ];

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

  // Detectar si es estudiante por el email
  const handleEmailChange = (text) => {
    setEmail(text);
    const isStudent = text.includes('@alumnos.ubiobio.cl');
    setEsEstudiante(isStudent);
    
    // Si no es estudiante, limpiar campos opcionales
    if (!isStudent) {
      setAnioIngreso('');
      setCarreraId(null);
      setCarreraNombre('');
    }
  };

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const handleRegister = async () => {
    // Validaciones básicas
    if (!rut || !nombre || !apellido || !email || !sexo || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
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

    // Validaciones condicionales para estudiantes
    if (esEstudiante) {
      if (!anioIngreso) {
        Alert.alert('Error', 'Los estudiantes deben ingresar su año de ingreso');
        return;
      }
      if (!carreraId) {
        Alert.alert('Error', 'Los estudiantes deben seleccionar su carrera');
        return;
      }
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
        sexo,
        password
      };

      // Agregar campos opcionales solo si es estudiante
      if (esEstudiante) {
        payload.carreraId = carreraId;
        payload.anioIngresoUniversidad = parseInt(anioIngreso);
      }

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
      const errorMsg = error.response?.data?.message || error.message || 'Error al registrarse';
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* TÍTULO */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Completa tus datos institucionales</Text>
          </View>

          {/* FORM */}
          <View style={styles.formContainer}>
            {/* RUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>RUT</Text>
              <View style={[
                styles.inputContainer,
                rutValid === true && styles.inputSuccess,
                rutValid === false && styles.inputError
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="12345678-9"
                  value={rut}
                  onChangeText={handleRutChange}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!loading}
                />
                {rutValid !== null && (
                  <Ionicons 
                    name={rutValid ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={rutValid ? "#8CC63F" : "#ff4d4f"} 
                  />
                )}
              </View>
              {rutValid === true && (
                <Text style={styles.successText}>RUT válido</Text>
              )}
              {rutValid === false && (
                <Text style={styles.errorText}>RUT inválido</Text>
              )}
            </View>

            {/* NOMBRE */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Juan"
                  value={nombre}
                  onChangeText={setNombre}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            {/* APELLIDO */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellido</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Pérez"
                  value={apellido}
                  onChangeText={setApellido}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo institucional</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="correo@alumnos.ubiobio.cl"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* SEXO */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sexo</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowSexoPicker(true)}
                disabled={loading}
              >
                <Ionicons name="male-female-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
                <Text style={sexo ? styles.inputText : styles.placeholder}>
                  {sexo || 'Seleccione su sexo'}
                </Text>
                <Ionicons name="chevron-down-outline" size={20} color="#8c8c8c" />
              </TouchableOpacity>
            </View>

            {/* CARRERA - Solo para estudiantes */}
            {esEstudiante && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Carrera</Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setShowCarrerasPicker(true)}
                  disabled={loadingCarreras || loading}
                >
                  <Ionicons name="school-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
                  <Text style={carreraNombre ? styles.inputText : styles.placeholder}>
                    {loadingCarreras ? 'Cargando...' : carreraNombre || 'Seleccione su carrera'}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={20} color="#8c8c8c" />
                </TouchableOpacity>
              </View>
            )}

            {/* AÑO INGRESO - Solo para estudiantes */}
            {esEstudiante && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Año de Ingreso a la Universidad</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={`Ej: ${new Date().getFullYear()}`}
                    value={anioIngreso}
                    onChangeText={setAnioIngreso}
                    keyboardType="numeric"
                    maxLength={4}
                    editable={!loading}
                  />
                </View>
              </View>
            )}

            {/* CONTRASEÑA */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={toggleShowPassword}
                  disabled={loading}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                    size={22} 
                    color="#8c8c8c" 
                  />
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
                    La contraseña debe tener: 8 caracteres, mayúscula, minúscula, número y símbolo.
                  </Text>
                </View>
              )}
            </View>

            {/* CONFIRMAR CONTRASEÑA */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={toggleShowConfirmPassword}
                  disabled={loading}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                    size={22} 
                    color="#8c8c8c" 
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword && password !== confirmPassword && (
                <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
              )}
            </View>

            {/* BOTÓN DE REGISTRO */}
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

            {/* LINK A LOGIN */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={loading}
              >
                <Text style={styles.registerLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODAL SEXO */}
      <Modal
        visible={showSexoPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSexoPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSexoPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccione su sexo</Text>
            {sexoOpciones.map((opcion) => (
              <TouchableOpacity
                key={opcion.value}
                style={styles.modalItem}
                onPress={() => {
                  setSexo(opcion.value);
                  setShowSexoPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{opcion.label}</Text>
                {sexo === opcion.value && (
                  <Ionicons name="checkmark" size={24} color="#014898" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSexoPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL CARRERAS */}
      <Modal
        visible={showCarrerasPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCarrerasPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCarrerasPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccione su carrera</Text>
            <ScrollView style={styles.modalScroll}>
              {carreras.map((carrera) => (
                <TouchableOpacity
                  key={carrera.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setCarreraId(carrera.id);
                    setCarreraNombre(carrera.nombre);
                    setShowCarrerasPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{carrera.nombre}</Text>
                  {carreraId === carrera.id && (
                    <Ionicons name="checkmark" size={24} color="#014898" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCarrerasPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#014898',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8c8c8c',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#262626',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 0,
  },
  inputSuccess: {
    borderWidth: 1,
    borderColor: '#8CC63F',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4d4f',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  placeholder: {
    flex: 1,
    fontSize: 16,
    color: '#999',
  },
  eyeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: 12,
    color: '#8CC63F',
    marginTop: 4,
    marginLeft: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ff4d4f',
    marginTop: 4,
    marginLeft: 16,
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
    backgroundColor: '#014898',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#014898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#262626',
  },
  registerLink: {
    fontSize: 14,
    color: '#014898',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#014898',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalCloseButton: {
    backgroundColor: '#014898',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});