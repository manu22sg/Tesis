import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { getDisponibilidadPorFecha } from '../services/horarioServices';
import { useAuth } from '../context/AuthContext';

export default function DisponibilidadCanchaScreen({ navigation }) {
  const isFocused = useIsFocused();
  const { usuario } = useAuth();

  const [fecha, setFecha] = useState(new Date());
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isFocused) {
      cargarDisponibilidad();
    }
  }, [isFocused, fecha]);

  const cargarDisponibilidad = async () => {
    try {
      setLoading(true);
      const fechaStr = formatearFechaAPI(fecha);
      const response = await getDisponibilidadPorFecha(fechaStr, 1, 100);
      setDisponibilidad(response.data || []);
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
      Alert.alert('Error', 'No se pudo cargar la disponibilidad de canchas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarDisponibilidad();
  };

  const formatearFechaAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatearFechaLegible = (date) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]}`;
  };

  const cambiarDia = (dias) => {
    let nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    
    // Saltar fines de semana
    while (nuevaFecha.getDay() === 0 || nuevaFecha.getDay() === 6) {
      nuevaFecha.setDate(nuevaFecha.getDate() + (dias > 0 ? 1 : -1));
    }
    
    setFecha(nuevaFecha);
  };

  const irHoy = () => {
    setFecha(new Date());
  };

  const puedeReservar = usuario && (usuario.rol === 'estudiante' || usuario.rol === 'academico');

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Cargando disponibilidad...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚽ Disponibilidad de Canchas</Text>
      </View>

      {/* Selector de fecha */}
      <View style={styles.dateSelector}>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => cambiarDia(-1)}
        >
          <Text style={styles.dateButtonText}>◀ Anterior</Text>
        </TouchableOpacity>

        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>{formatearFechaLegible(fecha)}</Text>
        </View>

        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => cambiarDia(1)}
        >
          <Text style={styles.dateButtonText}>Siguiente ▶</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.todayButtonContainer}>
        <TouchableOpacity 
          style={styles.todayButton}
          onPress={irHoy}
        >
          <Text style={styles.todayButtonText}>📅 Hoy</Text>
        </TouchableOpacity>
      </View>

      {/* Botón Reservar */}
      {puedeReservar && (
        <View style={styles.reservarContainer}>
          <TouchableOpacity
            style={styles.reservarButton}
            onPress={() => navigation.navigate('NuevaReserva')}
          >
            <Text style={styles.reservarButtonText}>➕ Reservar cancha</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de canchas */}
      <ScrollView 
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {disponibilidad.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>
              No hay canchas disponibles para esta fecha
            </Text>
          </View>
        ) : (
          disponibilidad.map((item, index) => (
            <View key={index} style={styles.canchaCard}>
              <View style={styles.canchaHeader}>
                <Text style={styles.canchaNombre}>{item.cancha.nombre}</Text>
                <View style={styles.capacidadBadge}>
                  <Text style={styles.capacidadText}>
                    👥 {item.cancha.capacidadMaxima}
                  </Text>
                </View>
              </View>

              {item.cancha.descripcion && (
                <Text style={styles.canchaDescripcion}>
                  {item.cancha.descripcion}
                </Text>
              )}

              <View style={styles.bloquesContainer}>
                <Text style={styles.bloquesTitle}>Horarios disponibles:</Text>
                {item.bloques.map((bloque, bIndex) => (
                  <View 
                    key={bIndex} 
                    style={[
                      styles.bloqueItem,
                      bloque.disponible ? styles.bloqueDisponible : styles.bloqueOcupado
                    ]}
                  >
                    <Text style={styles.bloqueHorario}>
                      {bloque.horaInicio} - {bloque.horaFin}
                    </Text>
                    <View style={[
                      styles.bloqueEstado,
                      bloque.disponible ? styles.estadoDisponible : styles.estadoOcupado
                    ]}>
                      <Text style={styles.bloqueEstadoText}>
                        {bloque.disponible ? '✓ Disponible' : bloque.motivo || '✗ Ocupado'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  dateDisplay: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  todayButtonContainer: {
    padding: 10,
    paddingTop: 5,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  todayButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  todayButtonText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  reservarContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reservarButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  reservarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  canchaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  canchaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  canchaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  capacidadBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  capacidadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  canchaDescripcion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  bloquesContainer: {
    marginTop: 10,
  },
  bloquesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  bloqueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
  },
  bloqueDisponible: {
    backgroundColor: '#f6ffed',
    borderWidth: 1,
    borderColor: '#b7eb8f',
  },
  bloqueOcupado: {
    backgroundColor: '#fff1f0',
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  bloqueHorario: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bloqueEstado: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoDisponible: {
    backgroundColor: '#52c41a',
  },
  estadoOcupado: {
    backgroundColor: '#ff4d4f',
  },
  bloqueEstadoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});