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
import { obtenerJugadores, obtenerJugadorPorId, eliminarJugador } from '../services/jugadorServices';
import { useAuth } from '../context/AuthContext';

export default function JugadoresScreen({ navigation }) {
  const isFocused = useIsFocused();
  const { usuario } = useAuth();

  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modales
  const [modalFiltro, setModalFiltro] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [jugadorDetalle, setJugadorDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // ✅ Referencia para comparar filtros anteriores
  const prevFiltrosRef = useRef({ busqueda, filtroEstado });

  useEffect(() => {
    if (isFocused) {
      cargarJugadores();
    }
  }, [isFocused]);

  // ✅ useEffect para búsqueda y filtros automáticos con debounce
  useEffect(() => {
    const prevFiltros = prevFiltrosRef.current;
    
    // Detectar si solo borró la búsqueda
    const soloBorroBusqueda = 
      prevFiltros.busqueda !== '' && 
      busqueda === '' && 
      prevFiltros.filtroEstado === filtroEstado;

    // Si solo está escribiendo búsqueda
    const soloEsBusqueda = 
      busqueda && 
      !filtroEstado;

    const limpiarLista = !soloBorroBusqueda && !soloEsBusqueda;

    // Debounce de 500ms para la búsqueda
    const timer = setTimeout(() => {
      cargarJugadores(1, 10, busqueda, filtroEstado, limpiarLista);
    }, 500);

    prevFiltrosRef.current = { busqueda, filtroEstado };

    return () => clearTimeout(timer);
  }, [busqueda, filtroEstado]);

  const cargarJugadores = async (page = 1, pageSize = 10, q = busqueda, estado = filtroEstado, limpiarLista = true) => {
    try {
      if (limpiarLista) {
        setJugadores([]);
      }
      setLoading(true);
      const params = { pagina: page, limite: pageSize };
      if (q) params.q = q;
      if (estado) params.estado = estado;
      
      const response = await obtenerJugadores(params);
      
      if (response.jugadores) {
        setJugadores(response.jugadores);
        setPagination({
          current: response.pagina || 1,
          pageSize: pageSize,
          total: response.total || 0,
        });
      } else {
        setJugadores(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      Alert.alert('Error', 'No se pudieron cargar los jugadores');
      setJugadores([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarJugadores(pagination.current, pagination.pageSize, busqueda, filtroEstado, false);
  };

  const handleFiltroEstado = (estado) => {
    setFiltroEstado(estado);
    setModalFiltro(false);
    // Ya no llamamos a cargarJugadores aquí porque el useEffect lo hace automáticamente
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('');
    // Ya no llamamos a cargarJugadores aquí porque el useEffect lo hace automáticamente
  };

  const verDetalle = async (jugadorId) => {
    try {
      setLoadingDetalle(true);
      setModalDetalle(true);
      const detalle = await obtenerJugadorPorId(jugadorId);
      setJugadorDetalle(detalle);
    } catch (error) {
      console.error('Error cargando detalle:', error);
      Alert.alert('Error', 'Error al cargar el detalle del jugador');
      setModalDetalle(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleEliminar = (jugadorId) => {
    Alert.alert(
      '¿Eliminar jugador?',
      'Esta acción no se puede deshacer',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarJugador(jugadorId);
              Alert.alert('Éxito', 'Jugador eliminado correctamente');
              cargarJugadores(pagination.current, pagination.pageSize, busqueda, filtroEstado);
            } catch (error) {
              console.error('Error eliminando jugador:', error);
              Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar el jugador');
            }
          }
        }
      ]
    );
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'activo': '#52c41a',
      'inactivo': '#8c8c8c',
      'lesionado': '#ff4d4f',
      'suspendido': '#faad14'
    };
    return colores[estado?.toLowerCase()] || '#8c8c8c';
  };

  const renderJugador = ({ item }) => {
    return (
      <View style={styles.jugadorCard}>
        <View style={styles.jugadorHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.usuario?.nombre?.charAt(0).toUpperCase() || 'J'}
              </Text>
            </View>
          </View>

          <View style={styles.jugadorInfo}>
            <Text style={styles.jugadorNombre}>
              {item.usuario?.nombre || 'Sin nombre'}
            </Text>
            <Text style={styles.jugadorRut}>{item.usuario?.rut || 'Sin RUT'}</Text>
            {item.posicion && (
              <Text style={styles.jugadorPosicion}>⚽ {item.posicion}</Text>
            )}
          </View>

          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
            <Text style={styles.estadoText}>{item.estado?.toUpperCase()}</Text>
          </View>
        </View>

        {item.usuario?.carrera?.nombre && (
          <View style={styles.carreraContainer}>
            <Text style={styles.carreraLabel}>📚 Carrera:</Text>
            <Text style={styles.carreraText}>{item.usuario.carrera.nombre}</Text>
          </View>
        )}

        {item.jugadorGrupos && item.jugadorGrupos.length > 0 && (
          <View style={styles.gruposContainer}>
            <Text style={styles.gruposLabel}>👥 Grupos:</Text>
            <View style={styles.gruposList}>
              {item.jugadorGrupos.map((jg, index) => (
                <View key={index} style={styles.grupoTag}>
                  <Text style={styles.grupoText}>{jg.grupo?.nombre}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.accionesContainer}>
          <TouchableOpacity
            style={styles.verDetalleButton}
            onPress={() => verDetalle(item.id)}
          >
            <Text style={styles.verDetalleButtonText}>👁 Ver detalle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editarButton}
            onPress={() => navigation.navigate('EditarJugador', { id: item.id })}
          >
            <Text style={styles.editarButtonText}>✏️ Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.eliminarButton}
            onPress={() => handleEliminar(item.id)}
          >
            <Text style={styles.eliminarButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const estadosDisponibles = [
    { label: 'Todos', value: '' },
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
    { label: 'Lesionado', value: 'lesionado' },
    { label: 'Suspendido', value: 'suspendido' },
  ];

  const hayFiltrosActivos = !!(busqueda || filtroEstado);

  if (loading && !refreshing && jugadores.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#014898" />
        <Text style={styles.loadingText}>Cargando jugadores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Jugadores</Text>
        <Text style={styles.headerSubtitle}>Gestión de jugadores</Text>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre o RUT..."
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

        {/* Acciones */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filtroButton}
            onPress={() => setModalFiltro(true)}
          >
            <Text style={styles.filtroButtonText}>
              🔽 Filtros {filtroEstado && `(${filtroEstado})`}
            </Text>
          </TouchableOpacity>

          {hayFiltrosActivos && (
            <TouchableOpacity
              style={styles.limpiarButton}
              onPress={limpiarFiltros}
            >
              <Text style={styles.limpiarButtonText}>✕ Limpiar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.nuevoButton}
            onPress={() => navigation.navigate('NuevoJugador')}
          >
            <Text style={styles.nuevoButtonText}>➕ Nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
      {jugadores.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyText}>
            {hayFiltrosActivos
              ? 'No se encontraron jugadores con los filtros aplicados'
              : 'No hay jugadores registrados'}
          </Text>
          {!hayFiltrosActivos && (
            <TouchableOpacity
              style={styles.nuevaReservaButton}
              onPress={() => navigation.navigate('NuevoJugador')}
            >
              <Text style={styles.nuevaReservaButtonText}>Registrar primer jugador</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={jugadores}
          renderItem={renderJugador}
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

      {/* Modal de filtro */}
      <Modal
        visible={modalFiltro}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalFiltro(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setModalFiltro(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Filtrar por estado</Text>

            <ScrollView style={styles.filtrosList}>
              {estadosDisponibles.map((estado, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filtroItem,
                    filtroEstado === estado.value && styles.filtroItemSelected
                  ]}
                  onPress={() => handleFiltroEstado(estado.value)}
                >
                  <Text style={[
                    styles.filtroItemText,
                    filtroEstado === estado.value && styles.filtroItemTextSelected
                  ]}>
                    {estado.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalFiltro(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal de detalle */}
      <Modal
        visible={modalDetalle}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalDetalle(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setModalDetalle(false);
              setJugadorDetalle(null);
            }}
          />
          <View style={styles.modalDetalleContent}>
            <Text style={styles.modalTitle}>Detalle del Jugador</Text>

            {loadingDetalle ? (
              <ActivityIndicator size="large" color="#014898" style={{ marginVertical: 40 }} />
            ) : jugadorDetalle ? (
              <ScrollView
                style={styles.detalleScroll}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {/* Información del usuario */}
                <View style={styles.detalleSection}>
                  <Text style={styles.detalleSectionTitle}>Información Personal</Text>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Nombre:</Text>
                    <Text style={styles.detalleValue}>
                      {jugadorDetalle.usuario?.nombre || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>RUT:</Text>
                    <Text style={styles.detalleValue}>
                      {jugadorDetalle.usuario?.rut || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Email:</Text>
                    <Text style={styles.detalleValue}>
                      {jugadorDetalle.usuario?.email || 'N/A'}
                    </Text>
                  </View>

                  {jugadorDetalle.usuario?.carrera?.nombre && (
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>Carrera:</Text>
                      <Text style={styles.detalleValue}>
                        {jugadorDetalle.usuario.carrera.nombre}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Información deportiva */}
                <View style={styles.detalleSection}>
                  <Text style={styles.detalleSectionTitle}>Información Deportiva</Text>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Posición:</Text>
                    <Text style={styles.detalleValue}>
                      {jugadorDetalle.posicion || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Pierna Hábil:</Text>
                    <Text style={styles.detalleValue}>
                      {jugadorDetalle.piernaHabil || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Altura:</Text>
                    <Text style={styles.detalleValue}>
                      {jugadorDetalle.altura ? `${jugadorDetalle.altura} cm` : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Peso:</Text>
                    <Text style={styles.detalleValue}>
                      {jugadorDetalle.peso ? `${jugadorDetalle.peso} kg` : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Año de Ingreso:</Text>
                    <Text style={styles.detalleValue}>
                      {jugadorDetalle.anioIngreso || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Estado:</Text>
                    <View style={[
                      styles.estadoBadgeSmall,
                      { backgroundColor: getEstadoColor(jugadorDetalle.estado) }
                    ]}>
                      <Text style={styles.estadoTextSmall}>
                        {jugadorDetalle.estado?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Grupos */}
                {jugadorDetalle.jugadorGrupos && jugadorDetalle.jugadorGrupos.length > 0 && (
                  <View style={styles.detalleSection}>
                    <Text style={styles.detalleSectionTitle}>
                      Grupos ({jugadorDetalle.jugadorGrupos.length})
                    </Text>
                    {jugadorDetalle.jugadorGrupos.map((jg, idx) => (
                      <View key={idx} style={styles.grupoDetalleItem}>
                        <Text style={styles.grupoDetalleNombre}>
                          👥 {jg.grupo?.nombre || 'N/A'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : null}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setModalDetalle(false);
                setJugadorDetalle(null);
              }}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filtroButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  filtroButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  limpiarButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  limpiarButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  nuevoButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nuevoButtonText: {
    color: '#014898',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
  },
  jugadorCard: {
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
  jugadorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#014898',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  jugadorInfo: {
    flex: 1,
  },
  jugadorNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  jugadorRut: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  jugadorPosicion: {
    fontSize: 12,
    color: '#014898',
    fontWeight: '600',
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  estadoText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  carreraContainer: {
    backgroundColor: '#f0f2f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  carreraLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  carreraText: {
    fontSize: 13,
    color: '#333',
  },
  gruposContainer: {
    marginBottom: 12,
  },
  gruposLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  gruposList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  grupoTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  grupoText: {
    fontSize: 11,
    color: '#014898',
    fontWeight: '600',
  },
  accionesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  verDetalleButton: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  verDetalleButtonText: {
    color: '#014898',
    fontSize: 13,
    fontWeight: '600',
  },
  editarButton: {
    flex: 1,
    backgroundColor: '#fff7e6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd591',
  },
  editarButtonText: {
    color: '#fa8c16',
    fontSize: 13,
    fontWeight: '600',
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
  nuevaReservaButton: {
    backgroundColor: '#014898',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nuevaReservaButtonText: {
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
    maxHeight: '60%',
  },
  modalDetalleContent: {
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
    marginBottom: 15,
    textAlign: 'center',
  },
  filtrosList: {
    maxHeight: 300,
  },
  filtroItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtroItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  filtroItemText: {
    fontSize: 16,
    color: '#333',
  },
  filtroItemTextSelected: {
    fontWeight: 'bold',
    color: '#014898',
  },
  detalleScroll: {
    maxHeight: 500,
  },
  detalleSection: {
    marginBottom: 20,
  },
  detalleSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detalleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detalleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detalleValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  estadoBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estadoTextSmall: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  grupoDetalleItem: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  grupoDetalleNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#014898',
  },
  modalCloseButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});