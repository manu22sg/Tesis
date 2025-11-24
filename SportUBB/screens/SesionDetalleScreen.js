import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import TokenSesionModal from "../components/TokenSesionModal.jsx";

import { useState, useEffect } from 'react';
import { obtenerSesionPorId,activarTokenSesion, desactivarTokenSesion } from '../services/sesionServices';

export default function SesionDetalleScreen({ route, navigation }) {
  const { sesionId, sesion: sesionInicial } = route.params;
  const [sesion, setSesion] = useState(sesionInicial || null);
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [ttlMin, setTtlMin] = useState(30);
  const [tokenLength, setTokenLength] = useState(6);
  const [loadingToken, setLoadingToken] = useState(false);

  const [loading, setLoading] = useState(!sesionInicial);
  const isFocused = useIsFocused();

  useEffect(() => {
  if (isFocused) {
    cargarDetalleSesion();
  }
}, [isFocused]);

const handleActivarToken = async (params) => {
  try {
    setLoadingToken(true);

    await activarTokenSesion(sesion.id, params);

    await cargarDetalleSesion(); // refresca datos
    setTokenModalVisible(true);

  } catch (err) {
    console.log(err);
    Alert.alert("Error", "No se pudo activar el token");
  } finally {
    setLoadingToken(false);
  }
};

const handleDesactivarToken = () => {
  Alert.alert(
    "Desactivar Token",
    "¿Estás seguro de que deseas desactivar este token?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Desactivar",
        style: "destructive",
        onPress: async () => {
          try {
            setLoadingToken(true);

            await desactivarTokenSesion(sesion.id);
            await cargarDetalleSesion();

            Alert.alert("Token desactivado");
            setTokenModalVisible(false);

          } catch (err) {
            Alert.alert("Error", "No se pudo desactivar el token");
          } finally {
            setLoadingToken(false);
          }
        },
      },
    ]
  );
};


  const cargarDetalleSesion = async () => {
    try {
      setLoading(true);
      const data = await obtenerSesionPorId(sesionId);
      setSesion(data);
    } catch (error) {
      console.error('Error cargando sesión:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de la sesión');
       navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
  if (!fecha) return '';

  // Evita el bug del timezone
  const [year, month, day] = fecha.split('-').map(Number);

  const d = new Date(year, month - 1, day); // <-- ESTE YA NO RESTA EL DÍA

  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`;
};

  const formatearHora = (hora) => {
    if (!hora) return '';
    return hora.substring(0, 5);
  };

  const getBadgeColor = (tipo) => {
    const colores = {
      'tecnica': '#014898',
      'táctica': '#4caf50',
      'tactica': '#4caf50',
      'fisica': '#ff9800',
      'mixta': '#9c27b0',
      'entrenamiento': '#f44336',
      'partido': '#e91e63'
    };
    return colores[tipo?.toLowerCase()] || '#757575';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#014898" />
        <Text style={styles.loadingText}>Cargando sesión...</Text>
      </View>
    );
  }

  if (!sesion) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontró la sesión</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header con tipo de sesión */}
      <View style={[styles.header, { backgroundColor: getBadgeColor(sesion.tipoSesion) }]}>
        <Text style={styles.tipoSesion}>{sesion.tipoSesion}</Text>
        <Text style={styles.fecha}>{formatearFecha(sesion.fecha)}</Text>
        <Text style={styles.horario}>
          {formatearHora(sesion.horaInicio)} - {formatearHora(sesion.horaFin)}
        </Text>
        <Text style={styles.cancha}>
  {sesion.cancha?.nombre || sesion.ubicacionExterna || 'Ubicación no definida'}
</Text>
      </View>

      {/* Botones de acciones */}
      <View style={styles.actionsContainer}>
       <TouchableOpacity 
  style={styles.actionButton}
  onPress={() =>
  navigation.navigate("Alineacion", {
    sesionId: sesion.id,
    grupoId: sesion.grupo?.id,
  })
}

>
  <Text style={styles.actionIcon}>👥</Text>
  <Text style={styles.actionText}>Alineación</Text>
</TouchableOpacity>



        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setTokenModalVisible(true)}

        >
          <Text style={styles.actionIcon}>🔑</Text>
          <Text style={styles.actionText}>Token</Text>
        </TouchableOpacity>

        <TouchableOpacity 
  style={styles.actionButton}
  onPress={() => navigation.navigate('Asistencias', {
    sesionId: sesion.id,
    sesion: sesion
  })}
>
          <Text style={styles.actionIcon}>✅</Text>
          <Text style={styles.actionText}>Asistencia</Text>
        </TouchableOpacity>

        <TouchableOpacity 
  style={styles.actionButton}
  onPress={() => navigation.navigate('Entrenamientos', {
    sesionId: sesion.id,
    sesion: sesion
  })}
>
          <Text style={styles.actionIcon}>⚽</Text>
          <Text style={styles.actionText}>Entrenamientos</Text>
        </TouchableOpacity>
      </View>

      {/* Detalles de la sesión */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>📋 Detalles</Text>

        {/* Lugar */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Lugar</Text>
          <Text style={styles.detailValue}>
            {sesion.ubicacionExterna || sesion.cancha?.nombre || 'Sin ubicación'}
          </Text>
        </View>

        {/* Grupo */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>👥 Grupo</Text>
          <Text style={styles.detailValue}>
            {sesion.grupo?.nombre || 'Sin grupo'}
          </Text>
        </View>

        {/* Estado del token */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🔑 Estado del Token</Text>
          <View style={[
            styles.tokenBadge,
            sesion.tokenVigente 
              ? styles.tokenActivo 
              : sesion.tokenActivo 
                ? styles.tokenExpirado 
                : styles.tokenInactivo
          ]}>
            <Text style={styles.tokenText}>
              {sesion.tokenVigente 
                ? 'Activo' 
                : sesion.tokenActivo 
                  ? 'Expirado' 
                  : 'Inactivo'}
            </Text>
          </View>
        </View>
      </View>

      {/* Objetivos */}
      {sesion.objetivos && (
        <View style={styles.objetivosContainer}>
          <Text style={styles.sectionTitle}>🎯 Objetivos</Text>
          <Text style={styles.objetivosText}>{sesion.objetivos}</Text>
        </View>
      )}

      {/* Botones inferiores */}
      <View style={styles.bottomActions}>
       <TouchableOpacity 
  style={[styles.bottomButton, styles.editButton]}
  onPress={() => navigation.navigate('EditarSesion', {
    sesionId: sesion.id
  })}
>
          <Text style={styles.bottomButtonText}>✏️ Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bottomButton, styles.deleteButton]}
          onPress={() => Alert.alert(
            'Eliminar Sesión',
            '¿Estás seguro de eliminar esta sesión?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive' }
            ]
          )}
        >
          <Text style={styles.bottomButtonText}>🗑️ Eliminar</Text>
        </TouchableOpacity>
      </View>
      <TokenSesionModal
  open={tokenModalVisible}
  sesion={sesion}
  ttlMin={ttlMin}
  setTtlMin={setTtlMin}
  tokenLength={tokenLength}
  setTokenLength={setTokenLength}
  loadingToken={loadingToken}
  onClose={() => setTokenModalVisible(false)}
  onActivar={handleActivarToken}
  onDesactivar={handleDesactivarToken}
/>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#014898',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  tipoSesion: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
    marginBottom: 10,
  },
  fecha: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 5,
  },
  horario: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 5,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  tokenBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tokenActivo: {
    backgroundColor: '#4caf50',
  },
  tokenExpirado: {
    backgroundColor: '#ff9800',
  },
  tokenInactivo: {
    backgroundColor: '#9e9e9e',
  },
  tokenText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  objetivosContainer: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 5,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  objetivosText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    marginBottom: 30,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#014898',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});