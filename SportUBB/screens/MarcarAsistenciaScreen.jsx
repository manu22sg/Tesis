// screens/MarcarAsistenciaScreen.jsx
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Switch
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import { obtenerSesionesEstudiante } from '../services/sesionServices';
import { marcarAsistenciaPorToken } from '../services/asistenciaServices';
import { useAuth } from '../context/AuthContext';

// Helpers para coordenadas
const toNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const hasCoords = (lat, lon) => toNum(lat) !== null && toNum(lon) !== null;

export default function MarcarAsistenciaScreen() {
  const isFocused = useIsFocused();
  const { usuario } = useAuth();

  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [token, setToken] = useState('');
  const [selectedSesion, setSelectedSesion] = useState(null);
  const [marcando, setMarcando] = useState(false);

  // Ubicación
  const [usarUbicacion, setUsarUbicacion] = useState(false);
  const [ubicacion, setUbicacion] = useState({ latitud: null, longitud: null });
  const [loadingUbicacion, setLoadingUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState(null);

  // Detectar si la sesión requiere ubicación
  const requiereGeoSesion = useMemo(() => {
    if (!selectedSesion) return false;

    // Flag explícito del backend
    if (selectedSesion.requiereUbicacion === true) return true;
    if (selectedSesion.requiereUbicacion === false) return false;

    // Fallback: token activo + coords válidas
    const lat = toNum(selectedSesion?.latitudToken);
    const lon = toNum(selectedSesion?.longitudToken);
    return Boolean(selectedSesion?.tokenActivo) && lat !== null && lon !== null;
  }, [selectedSesion]);

  useEffect(() => {
    if (isFocused) {
      cargarSesiones();
    }
  }, [isFocused]);

  // Sincronizar switch según requisitos de la sesión
  useEffect(() => {
    if (!modalVisible) return;
    setUsarUbicacion(requiereGeoSesion);
  }, [modalVisible, requiereGeoSesion]);

  const cargarSesiones = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await obtenerSesionesEstudiante({ page, limit });
      
      if (response.sesiones) {
        setSesiones(response.sesiones);
        setPagination({
          current: response.pagination?.currentPage || 1,
          pageSize: response.pagination?.itemsPerPage || 10,
          total: response.pagination?.totalItems || 0,
        });
      } else {
        setSesiones(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Error cargando sesiones:', error);
      Alert.alert('Error', 'No se pudieron cargar sus sesiones');
      setSesiones([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarSesiones(pagination.current, pagination.pageSize);
  };

  const abrirModal = (sesion) => {
    setSelectedSesion(sesion);
    setModalVisible(true);
    setToken('');
    setUbicacion({ latitud: null, longitud: null });
    setErrorUbicacion(null);
  };

  const obtenerUbicacion = async () => {
    try {
      setLoadingUbicacion(true);
      setErrorUbicacion(null);

      // Pedir permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorUbicacion('Permiso de ubicación denegado');
        Alert.alert('Error', 'Permiso de ubicación denegado');
        setLoadingUbicacion(false);
        return;
      }

      // Obtener ubicación
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUbicacion({
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
      });
      Alert.alert('Éxito', 'Ubicación obtenida correctamente');
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setErrorUbicacion('No se pudo obtener la ubicación');
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setLoadingUbicacion(false);
    }
  };

  const handleMarcarAsistencia = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Debe ingresar el token de asistencia');
      return;
    }

    try {
      setMarcando(true);

      const base = {
        token: token.trim().toUpperCase(),
        estado: 'presente',
        origen: 'jugador',
      };

      if (requiereGeoSesion) {
        // Si es obligatorio, debe tener coordenadas
        if (!hasCoords(ubicacion.latitud, ubicacion.longitud)) {
          Alert.alert('Error', 'Esta sesión exige ubicación para marcar asistencia');
          setMarcando(false);
          return;
        }

        await marcarAsistenciaPorToken({
          ...base,
          latitud: toNum(ubicacion.latitud),
          longitud: toNum(ubicacion.longitud),
        });
      } else {
        // Si es opcional
        const incluir = usarUbicacion && hasCoords(ubicacion.latitud, ubicacion.longitud);
        const payload = incluir
          ? { ...base, latitud: toNum(ubicacion.latitud), longitud: toNum(ubicacion.longitud) }
          : base;

        await marcarAsistenciaPorToken(payload);
      }

      Alert.alert('Éxito', '¡Asistencia registrada correctamente!');
      setModalVisible(false);
      setToken('');
      setUbicacion({ latitud: null, longitud: null });
      await cargarSesiones(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error marcando asistencia:', error);
      const msg = error.response?.data?.message || 'Error al registrar asistencia';
      Alert.alert('Error', msg);
    } finally {
      setMarcando(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = fecha.includes('T') ? new Date(fecha) : new Date(fecha + 'T00:00:00');
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatearHora = (hora) => {
    if (!hora) return '';
    if (hora.includes('T')) {
      const d = new Date(hora);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return hora.substring(0, 5);
  };

  const getEstadoAsistencia = (sesion) => {
    if (!sesion.asistenciaMarcada) {
      return { color: '#999', text: 'Sin registrar', icon: '⏱' };
    }
    
    const estados = {
      presente: { color: '#52c41a', text: 'Presente', icon: '✓' },
      ausente: { color: '#ff4d4f', text: 'Ausente', icon: '✗' },
      justificado: { color: '#faad14', text: 'Justificado', icon: '📝' },
    };
    
    return estados[sesion.estadoAsistencia] || estados.presente;
  };

  const renderSesion = ({ item }) => {
    const estadoInfo = getEstadoAsistencia(item);

    return (
      <View style={styles.sesionCard}>
        <View style={styles.sesionHeader}>
          <View style={styles.sesionInfo}>
            <Text style={styles.tipoSesion}>{item.tipoSesion || 'Entrenamiento'}</Text>
            <Text style={styles.fecha}>📅 {formatearFecha(item.fecha)}</Text>
            <Text style={styles.horario}>
              🕐 {formatearHora(item.horaInicio)} - {formatearHora(item.horaFin)}
            </Text>
            <Text style={styles.cancha}>
              📍 {item.cancha?.nombre || item.ubicacionExterna || 'Ubicación no especificada'}
            </Text>
          </View>

          <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.color }]}>
            <Text style={styles.estadoText}>
              {estadoInfo.icon} {estadoInfo.text}
            </Text>
          </View>
        </View>

        {item.asistenciaMarcada ? (
          <View style={styles.registradaBadge}>
            <Text style={styles.registradaText}>✓ Asistencia Registrada</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.marcarButton, !item.tokenActivo && styles.marcarButtonDisabled]}
            onPress={() => abrirModal(item)}
            disabled={!item.tokenActivo}
          >
            <Text style={styles.marcarButtonText}>
              {item.tokenActivo ? '✓ Marcar Asistencia' : '🔒 Token Inactivo'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#014898" />
        <Text style={styles.loadingText}>Cargando sesiones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✓ Marcar Asistencia</Text>
        <Text style={styles.headerSubtitle}>{usuario?.nombre}</Text>
      </View>

      {/* Lista */}
      {sesiones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No tiene sesiones disponibles</Text>
        </View>
      ) : (
        <FlatList
          data={sesiones}
          renderItem={renderSesion}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => {
            setModalVisible(false);
            setToken('');
            setUbicacion({ latitud: null, longitud: null });
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>🔑 Token de Asistencia</Text>

            <View style={styles.sesionInfoModal}>
              <Text style={styles.sesionInfoText}>
                <Text style={styles.sesionInfoLabel}>Sesión: </Text>
                {selectedSesion?.tipoSesion || 'Entrenamiento'}
              </Text>
              <Text style={styles.sesionInfoText}>
                <Text style={styles.sesionInfoLabel}>Ubicación: </Text>
                {selectedSesion?.cancha?.nombre || selectedSesion?.ubicacionExterna || 'No especificada'}
              </Text>
            </View>

            <TextInput
              style={styles.tokenInput}
              value={token}
              onChangeText={(text) => setToken(text.toUpperCase())}
              placeholder="Ej: ABC123"
              placeholderTextColor="#999"
              maxLength={20}
              autoCapitalize="characters"
            />

            {requiereGeoSesion && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Esta sesión exige ubicación para marcar asistencia
                </Text>
              </View>
            )}

            <View style={styles.ubicacionSection}>
              <View style={styles.ubicacionHeader}>
                <Text style={styles.ubicacionTitle}>
                  📍 {requiereGeoSesion ? 'Ubicación (obligatorio)' : 'Ubicación (opcional)'}
                </Text>
                {!requiereGeoSesion && (
                  <Switch
                    value={usarUbicacion}
                    onValueChange={(v) => {
                      setUsarUbicacion(v);
                      if (!v) setUbicacion({ latitud: null, longitud: null });
                    }}
                    trackColor={{ false: '#ccc', true: '#014898' }}
                    thumbColor={usarUbicacion ? '#fff' : '#f4f3f4'}
                  />
                )}
              </View>

              {(requiereGeoSesion || usarUbicacion) && (
                <View style={styles.ubicacionBox}>
                  <TouchableOpacity
                    style={styles.ubicacionButton}
                    onPress={obtenerUbicacion}
                    disabled={loadingUbicacion}
                  >
                    {loadingUbicacion ? (
                      <ActivityIndicator color="#014898" />
                    ) : (
                      <Text style={styles.ubicacionButtonText}>
                        🎯 {hasCoords(ubicacion.latitud, ubicacion.longitud)
                          ? 'Actualizar ubicación'
                          : 'Obtener ubicación'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {errorUbicacion && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{errorUbicacion}</Text>
                    </View>
                  )}

                  {hasCoords(ubicacion.latitud, ubicacion.longitud) && (
                    <View style={styles.coordsBox}>
                      <Text style={styles.coordsText}>
                        Lat: {toNum(ubicacion.latitud).toFixed(6)}
                      </Text>
                      <Text style={styles.coordsText}>
                        Lng: {toNum(ubicacion.longitud).toFixed(6)}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => {
                  setModalVisible(false);
                  setToken('');
                  setUbicacion({ latitud: null, longitud: null });
                }}
              >
                <Text style={styles.cancelModalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmarButton,
                  (!token.trim() || (requiereGeoSesion && !hasCoords(ubicacion.latitud, ubicacion.longitud))) &&
                    styles.confirmarButtonDisabled,
                ]}
                onPress={handleMarcarAsistencia}
                disabled={
                  !token.trim() ||
                  marcando ||
                  (requiereGeoSesion && !hasCoords(ubicacion.latitud, ubicacion.longitud))
                }
              >
                {marcando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmarButtonText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: '#014898',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  listContent: {
    padding: 15,
  },
  sesionCard: {
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
  sesionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sesionInfo: {
    flex: 1,
  },
  tipoSesion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#014898',
    marginBottom: 6,
  },
  fecha: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  horario: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cancha: {
    fontSize: 14,
    color: '#666',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  estadoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  marcarButton: {
    backgroundColor: '#014898',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  marcarButtonDisabled: {
    backgroundColor: '#ccc',
  },
  marcarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  registradaBadge: {
    backgroundColor: '#f6ffed',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b7eb8f',
  },
  registradaText: {
    color: '#52c41a',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  sesionInfoModal: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  sesionInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  sesionInfoLabel: {
    fontWeight: '600',
  },
  tokenInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#fffbe6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ffe58f',
  },
  warningText: {
    fontSize: 13,
    color: '#ad6800',
  },
  ubicacionSection: {
    marginBottom: 15,
  },
  ubicacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ubicacionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ubicacionBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  ubicacionButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#014898',
  },
  ubicacionButtonText: {
    color: '#014898',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fff1f0',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  errorText: {
    fontSize: 13,
    color: '#ff4d4f',
  },
  coordsBox: {
    marginTop: 10,
  },
  coordsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmarButton: {
    flex: 1,
    backgroundColor: '#014898',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmarButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});