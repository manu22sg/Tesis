import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { useState, useEffect } from 'react';
import {
  listarAsistenciasDeSesion,
  actualizarAsistencia,
  eliminarAsistencia,
  exportarAsistenciasExcel,
  exportarAsistenciasPDF
} from '../services/asistenciaServices';

const ESTADOS = {
  presente: { label: 'Presente', color: '#4caf50', emoji: '✅' },
  ausente: { label: 'Ausente', color: '#f44336', emoji: '❌' },
  justificado: { label: 'Justificado', color: '#ff9800', emoji: '⚠️' },
};

export default function AsistenciasScreen({ route, navigation }) {
  const { sesionId, sesion } = route.params;
  
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal editar
  const [modalEditar, setModalEditar] = useState(false);
  const [asistenciaSeleccionada, setAsistenciaSeleccionada] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    cargarAsistencias();
  }, []);

  const cargarAsistencias = async (page = 1) => {
    try {
      setLoading(true);
      const data = await listarAsistenciasDeSesion(sesionId, {
        pagina: page,
        limite: 10
      });

      setAsistencias(data.asistencias || []);
      setPagination({
        current: data.pagina,
        pageSize: data.limite,
        total: data.total
      });
    } catch (error) {
      console.error('Error cargando asistencias:', error);
      Alert.alert('Error', 'No se pudieron cargar las asistencias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarAsistencias(pagination.current);
  };

  const abrirModalEditar = (asistencia) => {
    setAsistenciaSeleccionada(asistencia);
    setNuevoEstado(asistencia.estado);
    setModalEditar(true);
  };

  const handleActualizar = async () => {
    try {
      await actualizarAsistencia(asistenciaSeleccionada.id, {
        estado: nuevoEstado,
        origen: 'entrenador'
      });

      Alert.alert('Éxito', 'Asistencia actualizada correctamente');
      setModalEditar(false);
      cargarAsistencias(pagination.current);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo actualizar la asistencia');
    }
  };

  const handleEliminar = (asistenciaId) => {
    Alert.alert(
      'Eliminar Asistencia',
      '¿Estás seguro de eliminar esta asistencia?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarAsistencia(asistenciaId);
              Alert.alert('Éxito', 'Asistencia eliminada');
              cargarAsistencias(pagination.current);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          }
        }
      ]
    );
  };

  const handleExportExcel = async () => {
    try {
      Alert.alert('Exportando', 'Generando archivo Excel...');
      await exportarAsistenciasExcel({ sesionId });
      Alert.alert('Éxito', 'Excel exportado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar el Excel');
    }
  };

  const handleExportPDF = async () => {
    try {
      Alert.alert('Exportando', 'Generando archivo PDF...');
      await exportarAsistenciasPDF({ sesionId });
      Alert.alert('Éxito', 'PDF exportado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar el PDF');
    }
  };

  const estadisticas = {
    presente: asistencias.filter(a => a.estado === 'presente').length,
    ausente: asistencias.filter(a => a.estado === 'ausente').length,
    justificado: asistencias.filter(a => a.estado === 'justificado').length,
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    if (typeof fecha === 'string' && fecha.includes('-')) {
      const [year, month, day] = fecha.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return `${dias[d.getDay()]} ${d.getDate()}/${month}/${year}`;
    }
    return fecha;
  };

  if (loading && asistencias.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Cargando asistencias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con info de sesión */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{sesion?.tipoSesion || 'Sesión'}</Text>
        <Text style={styles.headerSubtitle}>
          {formatearFecha(sesion?.fecha)} • {sesion?.cancha?.nombre || 'Sin cancha'}
        </Text>
        
        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{estadisticas.presente}</Text>
            <Text style={styles.statLabel}>Presentes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{estadisticas.ausente}</Text>
            <Text style={styles.statLabel}>Ausentes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{estadisticas.justificado}</Text>
            <Text style={styles.statLabel}>Justificados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pagination.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExportExcel}
          >
            <Text style={styles.exportButtonText}>📊 Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExportPDF}
          >
            <Text style={styles.exportButtonText}>📄 PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de asistencias */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1976d2']}
          />
        }
      >
        {asistencias.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No hay asistencias registradas</Text>
            <Text style={styles.emptySubtext}>
              Los jugadores deben marcar su asistencia usando el token activo
            </Text>
          </View>
        ) : (
          asistencias.map((asistencia) => (
            <View key={asistencia.id} style={styles.asistenciaCard}>
              {/* Info del jugador */}
              <View style={styles.jugadorInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {asistencia.jugador?.usuario?.nombre?.charAt(0) || '?'}
                  </Text>
                </View>
                <View style={styles.jugadorTexto}>
                  <Text style={styles.jugadorNombre}>
                    {asistencia.jugador?.usuario?.nombre || 'Sin nombre'}
                  </Text>
                  <Text style={styles.jugadorRut}>
                    {asistencia.jugador?.usuario?.rut || 'Sin RUT'}
                  </Text>
                </View>
              </View>

              {/* Estado y detalles */}
              <View style={styles.detalles}>
                <View 
                  style={[
                    styles.estadoBadge, 
                    { backgroundColor: ESTADOS[asistencia.estado]?.color || '#757575' }
                  ]}
                >
                  <Text style={styles.estadoText}>
                    {ESTADOS[asistencia.estado]?.emoji} {ESTADOS[asistencia.estado]?.label}
                  </Text>
                </View>

                <View style={styles.metaInfo}>
                  <Text style={styles.metaText}>
                    📍 {asistencia.latitud && asistencia.longitud ? 'Con ubicación' : 'Sin ubicación'}
                  </Text>
                  <Text style={styles.metaText}>
                    🕐 {new Date(asistencia.fechaRegistro).toLocaleString('es-ES')}
                  </Text>
                  <Text style={styles.metaText}>
                    👤 Registrado por: {asistencia.origen === 'jugador' ? 'Jugador' : 'Entrenador'}
                  </Text>
                </View>
              </View>

              {/* Acciones */}
              <View style={styles.accionesRow}>
                <TouchableOpacity
                  style={styles.botonEditar}
                  onPress={() => abrirModalEditar(asistencia)}
                >
                  <Text style={styles.botonEditarText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonEliminar}
                  onPress={() => handleEliminar(asistencia.id)}
                >
                  <Text style={styles.botonEliminarText}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Editar */}
      <Modal
        visible={modalEditar}
        transparent
        animationType="slide"
        onRequestClose={() => setModalEditar(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalEditar(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Editar Estado de Asistencia</Text>

            <Text style={styles.modalJugador}>
              {asistenciaSeleccionada?.jugador?.usuario?.nombre}
            </Text>

            <View style={styles.estadoSelector}>
              {Object.entries(ESTADOS).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.estadoOption,
                    nuevoEstado === key && styles.estadoOptionSelected,
                    { borderColor: config.color }
                  ]}
                  onPress={() => setNuevoEstado(key)}
                >
                  <Text style={styles.estadoOptionEmoji}>{config.emoji}</Text>
                  <Text style={styles.estadoOptionText}>{config.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setModalEditar(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleActualizar}
              >
                <Text style={styles.modalButtonConfirmText}>Guardar</Text>
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
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  asistenciaCard: {
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
  jugadorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  jugadorTexto: {
    flex: 1,
  },
  jugadorNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  jugadorRut: {
    fontSize: 13,
    color: '#666',
  },
  detalles: {
    marginBottom: 12,
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  estadoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metaInfo: {
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  accionesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  botonEditar: {
    flex: 1,
    backgroundColor: '#1976d2',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonEditarText: {
    color: '#fff',
    fontWeight: '600',
  },
  botonEliminar: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonEliminarText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalJugador: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  estadoSelector: {
    gap: 10,
    marginBottom: 20,
  },
  estadoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  estadoOptionSelected: {
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
  },
  estadoOptionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  estadoOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});