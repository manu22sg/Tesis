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
  ScrollView
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { obtenerGrupos, crearGrupo, actualizarGrupo, eliminarGrupo } from '../services/grupoServices';

export default function GruposScreen({ navigation }) {
  const isFocused = useIsFocused();

  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modales
  const [modalForm, setModalForm] = useState(false);
  const [editando, setEditando] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Referencia para comparar búsqueda anterior
  const prevBusquedaRef = useRef(busqueda);
const isFirstLoadRef = useRef(true); 
  useEffect(() => {
    if (isFocused) {
      cargarGrupos();
    }
  }, [isFocused]);

  // Búsqueda automática con debounce
  useEffect(() => {
    const prevBusqueda = prevBusquedaRef.current;
    
    const soloBorroBusqueda = prevBusqueda !== '' && busqueda === '';
    const limpiarLista = !soloBorroBusqueda;

    const timer = setTimeout(() => {
      cargarGrupos(1, 10, busqueda.trim(), limpiarLista);
    }, 500);

    prevBusquedaRef.current = busqueda;

    return () => clearTimeout(timer);
  }, [busqueda]);

  const cargarGrupos = async (page = 1, pageSize = 10, q = busqueda, limpiarLista = true) => {
    try {
      if (limpiarLista) {
        setGrupos([]);
      }
      setLoading(true);
      
      const params = { 
        page, 
        limit: pageSize,
        page,
        limit: pageSize
      };
      if (q) {
        params.nombre = q;
        params.q = q;
      }

      const resultado = await obtenerGrupos(params);
      
      // Manejar diferentes formatos de respuesta
      const gruposData = resultado?.grupos || resultado?.data?.grupos || resultado?.data || [];
      const paginationData = resultado?.pagination || resultado?.data?.pagination || {
        currentPage: resultado?.page || page,
        itemsPerPage: resultado?.limit || pageSize,
        totalItems: resultado?.total || gruposData.length,
      };

      setGrupos(Array.isArray(gruposData) ? gruposData : []);
      setPagination({
        current: paginationData.currentPage || page,
        pageSize: paginationData.itemsPerPage || pageSize,
        total: paginationData.totalItems || 0,
      });
    } catch (error) {
      console.error('Error cargando grupos:', error);
      Alert.alert('Error', 'No se pudieron cargar los grupos');
      setGrupos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarGrupos(pagination.current, pagination.pageSize, busqueda, false);
  };

  const handleNuevoGrupo = () => {
    setEditando(false);
    setGrupoEditando(null);
    setNombre('');
    setDescripcion('');
    setModalForm(true);
  };

  const handleEditarGrupo = (grupo) => {
    setEditando(true);
    setGrupoEditando(grupo);
    setNombre(grupo.nombre);
    setDescripcion(grupo.descripcion || '');
    setModalForm(true);
  };

  const validarFormulario = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del grupo es requerido');
      return false;
    }
    if (nombre.length > 50) {
      Alert.alert('Error', 'El nombre no puede superar 50 caracteres');
      return false;
    }
    if (descripcion.length > 255) {
      Alert.alert('Error', 'La descripción no puede superar 255 caracteres');
      return false;
    }
    return true;
  };

  const handleGuardarGrupo = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      const datos = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined
      };

      if (editando && grupoEditando) {
        await actualizarGrupo(grupoEditando.id, datos);
        Alert.alert('Éxito', 'Grupo actualizado correctamente');
      } else {
        await crearGrupo(datos);
        Alert.alert('Éxito', 'Grupo creado correctamente');
      }

      setModalForm(false);
      cargarGrupos(pagination.current, pagination.pageSize, busqueda);
    } catch (error) {
      console.error('Error guardando grupo:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 
        `Error al ${editando ? 'actualizar' : 'crear'} el grupo`
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarGrupo = (grupo) => {
    Alert.alert(
      '¿Eliminar grupo?',
      `Se eliminará "${grupo.nombre}". Los jugadores no se eliminarán.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarGrupo(grupo.id);
              Alert.alert('Éxito', 'Grupo eliminado correctamente');
              cargarGrupos(pagination.current, pagination.pageSize, busqueda);
            } catch (error) {
              console.error('Error eliminando grupo:', error);
              Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar el grupo');
            }
          }
        }
      ]
    );
  };

  const handleVerMiembros = (grupo) => {
    navigation.navigate('GrupoMiembros', { grupoId: grupo.id, grupoNombre: grupo.nombre });
  };

  const renderGrupo = ({ item }) => {
    const cantidadMiembros = Array.isArray(item.jugadorGrupos) ? item.jugadorGrupos.length : 0;

    return (
      <View style={styles.grupoCard}>
        <View style={styles.grupoHeader}>
          <View style={styles.grupoIconContainer}>
            <View style={styles.grupoIcon}>
              <Text style={styles.grupoIconText}>👥</Text>
            </View>
          </View>

          <View style={styles.grupoInfo}>
            <Text style={styles.grupoNombre}>{item.nombre}</Text>
            {item.descripcion && (
              <Text style={styles.grupoDescripcion} numberOfLines={2}>
                {item.descripcion}
              </Text>
            )}
          </View>

          <View style={styles.miembrosContainer}>
            <Text style={styles.miembrosNumero}>{cantidadMiembros}</Text>
            <Text style={styles.miembrosLabel}>miembros</Text>
          </View>
        </View>

        <View style={styles.accionesContainer}>
          <TouchableOpacity
            style={styles.verMiembrosButton}
            onPress={() => handleVerMiembros(item)}
          >
            <Text style={styles.verMiembrosButtonText}>👁 Ver miembros</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editarButton}
            onPress={() => handleEditarGrupo(item)}
          >
            <Text style={styles.editarButtonText}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.eliminarButton}
            onPress={() => handleEliminarGrupo(item)}
          >
            <Text style={styles.eliminarButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing && grupos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#014898" />
        <Text style={styles.loadingText}>Cargando grupos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 Grupos</Text>
        <Text style={styles.headerSubtitle}>Gestión de grupos de jugadores</Text>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre..."
            placeholderTextColor="#999"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => setBusqueda('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botón Nuevo */}
        <TouchableOpacity
          style={styles.nuevoButton}
          onPress={handleNuevoGrupo}
        >
          <Text style={styles.nuevoButtonText}>➕ Nuevo Grupo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {grupos.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>
            {busqueda
              ? 'No se encontraron grupos con ese nombre'
              : 'No hay grupos creados'}
          </Text>
          {!busqueda && (
            <TouchableOpacity
              style={styles.crearPrimerButton}
              onPress={handleNuevoGrupo}
            >
              <Text style={styles.crearPrimerButtonText}>Crear primer grupo</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={grupos}
          renderItem={renderGrupo}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#014898" />
              </View>
            ) : null
          }
        />
      )}

      {/* Modal Crear/Editar */}
      <Modal
        visible={modalForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalForm(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => setModalForm(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editando ? 'Editar Grupo' : 'Nuevo Grupo'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.label}>Nombre del Grupo *</Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Ej: Equipo A, Sub-20, etc."
                  placeholderTextColor="#999"
                  maxLength={50}
                />
                <Text style={styles.charCount}>{nombre.length}/50</Text>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={descripcion}
                  onChangeText={setDescripcion}
                  placeholder="Descripción opcional del grupo"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  maxLength={255}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{descripcion.length}/255</Text>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, guardando && styles.submitButtonDisabled]}
                onPress={handleGuardarGrupo}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
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
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 14,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
  },
  nuevoButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nuevoButtonText: {
    color: '#014898',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
  },
  grupoCard: {
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
  grupoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  grupoIconContainer: {
    marginRight: 12,
  },
  grupoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grupoIconText: {
    fontSize: 24,
  },
  grupoInfo: {
    flex: 1,
  },
  grupoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  grupoDescripcion: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  miembrosContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
  },
  miembrosNumero: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#52c41a',
  },
  miembrosLabel: {
    fontSize: 11,
    color: '#666',
  },
  accionesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  verMiembrosButton: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  verMiembrosButtonText: {
    color: '#014898',
    fontSize: 13,
    fontWeight: '600',
  },
  editarButton: {
    backgroundColor: '#fff7e6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd591',
  },
  editarButtonText: {
    fontSize: 16,
  },
  eliminarButton: {
    backgroundColor: '#fff1f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  eliminarButtonText: {
    fontSize: 16,
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
  crearPrimerButton: {
    backgroundColor: '#014898',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  crearPrimerButtonText: {
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formField: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#014898',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#90caf9',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});