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
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { reenviarVerificacionRequest } from '../services/authServices';
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!email.endsWith('@ubiobio.cl') && !email.endsWith('@alumnos.ubiobio.cl')) {
      Alert.alert('Error', 'Debes usar tu correo institucional (@ubiobio.cl o @alumnos.ubiobio.cl)');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });
      
      if (result.success) {
        console.log('✅ Login exitoso');
      } else {
        // 🔥 Si necesita verificación, mostrar opción para reenviar
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
      Alert.alert('Error', 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Función para reenviar verificación
  const handleReenviarVerificacion = async (emailToVerify) => {
    try {
      await reenviarVerificacionRequest(emailToVerify);
      Alert.alert(
        '✅ Correo enviado',
        'Se ha enviado un nuevo correo de verificación. Revisa tu bandeja de entrada.'
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo reenviar el correo. Verifica que el email sea correcto.'
      );
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
          <Text style={styles.title}>SportUBB</Text>
          <Text style={styles.subtitle}>Inicie sesión con su correo institucional</Text>

          <TextInput
            style={styles.input}
            placeholder="Email institucional"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="next"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Contraseña"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
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
            >
              <Text style={styles.eyeIcon}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>

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

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              ¿No tienes cuenta? Regístrate aquí
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Alert.alert('Próximamente', 'Función de recuperación de contraseña en desarrollo')}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.linkTextSecondary}>
              ¿Olvidaste tu contraseña?
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
    justifyContent: 'center',
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#000',
  },
  eyeButton: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 22,
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
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
  linkTextSecondary: {
    color: '#999',
    fontSize: 13,
  },
});