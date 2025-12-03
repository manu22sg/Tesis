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
  Image
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginRequest, reenviarVerificacionRequest } from '../services/authServices.js';
import { Ionicons } from '@expo/vector-icons';

 import LogoCancha from '../assets/images/figura113.png';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { login, isAuthenticated, usuario, loading: authLoading } = useAuth();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated && usuario) {
      // Navegar a la pantalla principal
      navigation.replace('Main');
    }
  }, [isAuthenticated, usuario, authLoading, navigation]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Validación de email
  const validateEmail = (text) => {
    setEmail(text);
    if (text && !/^[a-zA-Z0-9._%+-]+@(alumnos\.)?ubiobio\.cl$/.test(text)) {
      setEmailError('Debe ser un correo institucional UBB');
    } else {
      setEmailError('');
    }
  };

  // Validación de contraseña
  const validatePassword = (text) => {
    setPassword(text);
    if (text && text.length < 1) {
      setPasswordError('Por favor ingrese su contraseña');
    } else {
      setPasswordError('');
    }
  };

  const handleLogin = async () => {
    // Validaciones
    let hasError = false;

    if (!email) {
      setEmailError('Por favor ingrese su email');
      hasError = true;
    } else if (!/^[a-zA-Z0-9._%+-]+@(alumnos\.)?ubiobio\.cl$/.test(email)) {
      setEmailError('Debe ser un correo institucional UBB');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Por favor ingrese su contraseña');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const result = await login({ email, password });
      
    
      if (result.success) {
        // El AppContent detectará isAuthenticated y navegará automáticamente
      } else {
        // Si necesita verificación
        if (result.needsVerification) {
          Alert.alert(
            '📧 Verificación requerida',
            result.message,
            [
              { 
                text: 'Reenviar correo', 
                onPress: () => handleReenviarVerificacion(email)
              },
              { text: 'OK', style: 'cancel' }
            ]
          );
        } else {
          Alert.alert('Error', result.message || 'Credenciales incorrectas');
        }
      }
    } catch (error) {
      console.error(' Error en handleLogin:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para reenviar verificación
  const handleReenviarVerificacion = async (emailToVerify) => {
    try {
      await reenviarVerificacionRequest(emailToVerify);
      Alert.alert(
        '✅ Correo enviado',
        'Se ha enviado un nuevo correo de verificación. Revise su bandeja de entrada.'
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo reenviar el correo. Verifique que el email sea correcto.'
      );
    }
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#014898" />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
      </View>
    );
  }

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
          {/* LOGO */}
          <View style={styles.logoContainer}>
            {/* Descomenta y usa tu logo aquí */}
            <Image 
              source={LogoCancha} 
              style={styles.logo}
              resizeMode="contain"
            /> 
            
          </View>

          {/* TÍTULO */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Iniciar Sesión</Text>
          </View>

          {/* FORM */}
          <View style={styles.formContainer}>
            {/* EMAIL INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, emailError && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese su correo institucional UBB"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={validateEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* PASSWORD INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.inputContainer, passwordError && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese su contraseña"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={validatePassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  textContentType="password"
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={toggleShowPassword}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                    size={22} 
                    color="#8c8c8c" 
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            {/* FORGOT PASSWORD LINK */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate('SolicitarRestablecimiento')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>
                ¿Olvidó su contraseña?
              </Text>
            </TouchableOpacity>

            {/* REGISTER LINK */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tiene una cuenta? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}>Regístrate aquí</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#014898',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  logoPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 100,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 80,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#014898',
    margin: 0,
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
    borderWidth: 0,
    paddingHorizontal: 16,
    height: 50,
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
  eyeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#ff4d4f',
    marginTop: 4,
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
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#014898',
    fontSize: 14,
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
});