import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
  RefreshControl
} from 'react-native';
import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  obtenerEntrenamientosPorSesion,
  crearEntrenamiento,
  actualizarEntrenamiento,
  eliminarEntrenamiento,
  duplicarEntrenamiento,
  reordenarEntrenamientos
} from '../services/entrenamientoSesionServices';

export default function EntrenamientosScreen({ route, navigation }) {
  const { sesionId, sesion } = route.params;
  const isFocused = useIsFocused();

  const [entrenamientos, setEntrenamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal Crear/Editar
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    duracionMin: 30,
    orden: 1
  });
  const [loadingModal, setLoadingModal] = useState(false);

  // Modo reordenar
  const [modoReordenar, setModoReordenar] = useState(false);
  const [entrenamientosTemp, setEntrenamientosTemp] = useState([]);

  useEffect(() => {
    if (isFocused) {
      cargarEntrenamientos();
    }
  }, [isFocused]);

  const cargarEntrenamientos = async () => {
    try {
      setLoading(true);
      const data = await obtenerEntrenamientosPorSesion(sesionId);
      setEntrenamientos(data);
      setEntrenamientosTemp(data);
    } catch (error) {
      console.error('Error cargando entrenamientos:', error);
      Alert.alert('Error', 'No se pudo cargar los entrenamientos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarEntrenamientos();
  };

  const abrirModalCrear = () => {
    setEditando(null);
    setFormData({
      titulo: '',
      descripcion: '',
      duracionMin: 30,
      orden: entrenamientos.length + 1
    });
    setModalVisible(true);
  };

  const abrirModalEditar = (entrenamiento) => {
    setEditando(entrenamiento);
    setFormData({
      titulo: entrenamiento.titulo,
      descripcion: entrenamiento.descripcion || '',
      duracionMin: entrenamiento.duracionMin || 30,
      orden: entrenamiento.orden || 1
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    if (formData.titulo.length < 3) {
      Alert.alert('Error', 'El título debe tener al menos 3 caracteres');
      return;
    }

    try {
      setLoadingModal(true);
      const payload = {
        ...formData,
        sesionId: sesionId
      };

      if (editando) {
        await actualizarEntrenamiento(editando.id, payload);
        Alert.alert('Éxito', 'Entrenamiento actualizado correctamente');
      } else {
        await crearEntrenamiento(payload);
        Alert.alert('Éxito', 'Entrenamiento creado correctamente');
      }

      setModalVisible(false);
      cargarEntrenamientos();
    } catch (error) {
      console.error('Error guardando entrenamiento:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al guardar el entrenamiento');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleEliminar = (id) => {
    Alert.alert(
      '¿Eliminar entrenamiento?',
      'Esta acción no se puede deshacer',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarEntrenamiento(id);
              Alert.alert('Éxito', 'Entrenamiento eliminado correctamente');
              cargarEntrenamientos();
            } catch (error) {
              console.error('Error eliminando entrenamiento:', error);
              Alert.alert('Error', 'No se pudo eliminar el entrenamiento');
            }
          }
        }
      ]
    );
  };

  const handleDuplicar = async (id) => {
    try {
      await duplicarEntrenamiento(id, sesionId);
      Alert.alert('Éxito', 'Entrenamiento duplicado correctamente');
      cargarEntrenamientos();
    } catch (error) {
      console.error('Error duplicando entrenamiento:', error);
      Alert.alert('Error', 'No se pudo duplicar el entrenamiento');
    }
  };

  const moverEntrenamiento = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= entrenamientosTemp.length) return;

    const newArray = [...entrenamientosTemp];
    const [moved] = newArray.splice(index, 1);
    newArray.splice(newIndex, 0, moved);
    setEntrenamientosTemp(newArray);
  };

  const guardarReordenamiento = async () => {
    try {
      setLoading(true);
      const nuevosOrdenes = entrenamientosTemp.map((e, index) => ({
        id: e.id,
        orden: index + 1
      }));
      await reordenarEntrenamientos(sesionId, nuevosOrdenes);
      Alert.alert('Éxito', 'Entrenamientos reordenados correctamente');
      setModoReordenar(false);
      cargarEntrenamientos();
    } catch (error) {
      console.error('Error reordenando:', error);
      Alert.alert('Error', 'No se pudo guardar el nuevo orden');
      setEntrenamientosTemp(entrenamientos);
    } finally {
      setLoading(false);
    }
  };

  const cancelarReordenamiento = () => {
    setModoReordenar(false);
    setEntrenamientosTemp(entrenamientos);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]}`;
  };

  const formatearHora = (hora) => {
    if (!hora) return '';
    return hora.substring(0, 5);
  };

  const renderEntrenamiento = ({ item, index }) => {
    if (modoReordenar) {
      return (
        <View style={styles.entrenamientoCard}>
          <View style={styles.entrenamientoHeader}>
            <View style={styles.ordenBadge}>
              <Text style={styles.ordenText}>{index + 1}</Text>
            </View>
            <View style={styles.entrenamientoInfo}>
              <Text style={styles.entrenamientoTitulo}>{item.titulo}</Text>
              {item.descripcion && (
                <Text style={styles.entrenamientoDesc} numberOfLines={2}>
                  {item.descripcion}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.reordenarActions}>
            <TouchableOpacity
              style={[styles.reordenarBtn, index === 0 && styles.reordenarBtnDisabled]}
              onPress={() => moverEntrenamiento(index, 'up')}
              disabled={index === 0}
            >
              <Text style={styles.reordenarBtnText}>↑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reordenarBtn, index === entrenamientosTemp.length - 1 && styles.reordenarBtnDisabled]}
              onPress={() => moverEntrenamiento(index, 'down')}
              disabled={index === entrenamientosTemp.length - 1}
            >
              <Text style={styles.reordenarBtnText}>↓</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.entrenamientoCard}>
        <View style={styles.entrenamientoHeader}>
          <View style={styles.ordenBadge}>
            <Text style={styles.ordenText}>{item.orden || index + 1}</Text>
          </View>
          <View style={styles.entrenamientoInfo}>
            <Text style={styles.entrenamientoTitulo}>{item.titulo}</Text>
            {item.descripcion && (
              <Text style={styles.entrenamientoDesc} numberOfLines={2}>
                {item.descripcion}
              </Text>
            )}
            {item.duracionMin && (
              <Text style={styles.duracion}>⏱️ {item.duracionMin} min</Text>
            )}
          </View>
        </View>

        <View style={styles.entrenamientoActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDuplicar(item.id)}
          >
            <Text style={styles.actionBtnText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => abrirModalEditar(item)}
          >
            <Text style={styles.actionBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleEliminar(item.id)}
          >
            <Text style={styles.actionBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const dataSource = modoReordenar ? entrenamientosTemp : entrenamientos;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Cargando entrenamientos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚽ Entrenamientos</Text>
        <Text style={styles.headerSubtitle}>
          {formatearFecha(sesion?.fecha)} | {formatearHora(sesion?.horaInicio)} - {formatearHora(sesion?.horaFin)}
        </Text>
      </View>

      {/* Modo Reordenar Banner */}
      {modoReordenar && (
        <View style={styles.reordenarBanner}>
          <Text style={styles.reordenarBannerText}>
            📌 Modo reordenar: usa las flechas
          </Text>
          <View style={styles.reordenarBannerActions}>
            <TouchableOpacity
              style={styles.reordenarBannerBtn}
              onPress={guardarReordenamiento}
            >
              <Text style={styles.reordenarBannerBtnText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reordenarBannerBtn, styles.cancelBtn]}
              onPress={cancelarReordenamiento}
            >
              <Text style={styles.reordenarBannerBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Botones superiores */}
      {!modoReordenar && (
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => setModoReordenar(true)}
          >
            <Text style={styles.topBtnText}>🔀 Reordenar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.topBtn, styles.primaryBtn]}
            onPress={abrirModalCrear}
          >
            <Text style={[styles.topBtnText, styles.primaryBtnText]}>➕ Nuevo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista */}
      {dataSource.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>No hay entrenamientos registrados</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={abrirModalCrear}
          >
            <Text style={styles.emptyButtonText}>Crear primer entrenamiento</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={dataSource}
          renderItem={renderEntrenamiento}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Modal Crear/Editar */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editando ? '✏️ Editar Entrenamiento' : '➕ Nuevo Entrenamiento'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                value={formData.titulo}
                onChangeText={(text) => setFormData({ ...formData, titulo: text })}
                placeholder="Ej: Calentamiento general"
                maxLength={100}
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.descripcion}
                onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                placeholder="Describe el entrenamiento..."
                multiline
                numberOfLines={4}
                maxLength={1000}
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Duración (min)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.duracionMin?.toString()}
                    onChangeText={(text) => setFormData({ ...formData, duracionMin: parseInt(text) || 0 })}
                    placeholder="30"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Orden</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.orden?.toString()}
                    onChangeText={(text) => setFormData({ ...formData, orden: parseInt(text) || 1 })}
                    placeholder="1"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.submitModalBtn]}
                onPress={handleSubmit}
                disabled={loadingModal}
              >
                {loadingModal ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitModalBtnText}>
                    {editando ? 'Actualizar' : 'Crear'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  topActions: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  topBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  topBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  primaryBtn: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  primaryBtnText: {
    color: '#fff',
  },
  reordenarBanner: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  reordenarBannerText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
    marginBottom: 10,
  },
  reordenarBannerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  reordenarBannerBtn: {
    flex: 1,
    backgroundColor: '#1976d2',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  reordenarBannerBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#666',
  },
  listContent: {
    padding: 15,
  },
  entrenamientoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entrenamientoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ordenBadge: {
    backgroundColor: '#1976d2',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ordenText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  entrenamientoInfo: {
    flex: 1,
  },
  entrenamientoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  entrenamientoDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  duracion: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
  },
  entrenamientoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: '#ffebee',
  },
  actionBtnText: {
    fontSize: 18,
  },
  reordenarActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  reordenarBtn: {
    width: 50,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reordenarBtnDisabled: {
    backgroundColor: '#e0e0e0',
  },
  reordenarBtnText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalForm: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalBtn: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelModalBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitModalBtn: {
    backgroundColor: '#1976d2',
  },
  submitModalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});