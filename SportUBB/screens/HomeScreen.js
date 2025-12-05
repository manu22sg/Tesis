import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { usuario, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Está seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              console.log('✅ Logout exitoso');
            } catch (error) {
              console.error('Error en logout:', error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // 🔥 Función para obtener el texto del rol
  const getRolText = (rol) => {
    const roles = {
      'estudiante': 'Estudiante',
      'academico': 'Académico',
      'entrenador': 'Entrenador'
    };
    return roles[rol?.toLowerCase()] || 'Usuario';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {usuario?.nombre?.charAt(0)}{usuario?.apellido?.charAt(0)}
            </Text>
          </View>
        </View>
        <Text style={styles.welcomeText}>
          ¡Hola, {usuario?.nombre}!
        </Text>
        <Text style={styles.subtitle}>
          {getRolText(usuario?.rol)}
        </Text>
      </View>

      {/* Tarjetas de acceso rápido */}
      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={[styles.card, styles.cardPrimary]}
          onPress={() => navigation.navigate('Sesiones')}
        >
          <Text style={styles.cardIcon}>📅</Text>
          <Text style={styles.cardTitle}>Sesiones</Text>
          <Text style={styles.cardDescription}>
            Ver y gestionar sesiones de entrenamiento
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardSecondary]}
          onPress={() => Alert.alert('Próximamente', 'Sección de jugadores en desarrollo')}
        >
          <Text style={styles.cardIcon}>👥</Text>
          <Text style={styles.cardTitle}>Jugadores</Text>
          <Text style={styles.cardDescription}>
            Ver lista de jugadores
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardTertiary]}
          onPress={() => navigation.navigate('Sesiones')}
        >
          <Text style={styles.cardIcon}>✅</Text>
          <Text style={styles.cardTitle}>Asistencia</Text>
          <Text style={styles.cardDescription}>
            Registrar asistencia
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sección de estadísticas */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Resumen</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Sesiones</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Grupos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Jugadores</Text>
          </View>
        </View>
      </View>

      {/* Botón de Logout */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#014898',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#014898',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e3f2fd',
  },
  cardsContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#014898',
  },
  cardSecondary: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  cardTertiary: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  cardQuaternary: {
    borderLeftWidth: 4,
    borderLeftColor: '#9c27b0',
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#014898',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  logoutContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});