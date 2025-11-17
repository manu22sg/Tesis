import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Alert,Modal
    } from 'react-native';
    import { useState, useEffect, useCallback } from 'react';
    import { obtenerSesiones } from '../services/sesionServices';

    export default function SesionScreens() {
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [detalleVisible, setDetalleVisible] = useState(false);
    const [detalleSesion, setDetalleSesion] = useState(null);

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Cargar sesiones
    const cargarSesiones = useCallback(async (page = 1, resetList = false) => {
        try {
      if (resetList) {
        setLoading(true);
        setSesiones([]);
      }

      const params = {
        page,
        limit: pagination.pageSize,
        ...(busqueda && { q: busqueda })
      };

      const { sesiones: data, pagination: p } = await obtenerSesiones(params);

      if (resetList) {
        setSesiones(data);
      } else {
        // Paginación infinita: agregar al final
        setSesiones(prev => [...prev, ...data]);
      }

      setPagination({
        current: p.currentPage,
        pageSize: p.itemsPerPage,
        total: p.totalItems
      });
    } catch (error) {
        console.log(error);
      console.error('Error cargando sesiones:', error);
      Alert.alert('Error', 'No se pudieron cargar las sesiones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [busqueda, pagination.pageSize]);

  // Cargar al iniciar
  useEffect(() => {
    cargarSesiones(1, true);
  }, []);

  //Ver detalle
  const handleVerDetalle = async (sesion) => {
  try {
    // si tienes endpoint "obtenerSesionPorId":
    const data = await obtenerSesionPorId(sesion.id);
    setDetalleSesion(data);
  } catch (e) {
    setDetalleSesion(sesion); // fallback si aún no tienes endpoint
  }

  setDetalleVisible(true);
};

  // Refresh (pull to refresh)
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarSesiones(1, true);
  }, [cargarSesiones]);

  // Cargar más (scroll infinito)
  const cargarMas = useCallback(() => {
    if (loading || pagination.current * pagination.pageSize >= pagination.total) {
      return;
    }
    cargarSesiones(pagination.current + 1, false);
  }, [loading, pagination, cargarSesiones]);

  // Buscar
  const handleBuscar = useCallback(() => {
    cargarSesiones(1, true);
  }, [cargarSesiones]);

  // Renderizar cada sesión
  const renderSesion = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => Alert.alert('Detalle', `Sesión ${item.id}`)}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.fecha}>
            {formatearFecha(item.fecha)}
          </Text>
          <Text style={styles.horario}>
            {formatearHora(item.horaInicio)} - {formatearHora(item.horaFin)}
          </Text>
        </View>
        <View style={[styles.badge, getBadgeColor(item.tipoSesion)]}>
          <Text style={styles.badgeText}>{item.tipoSesion}</Text>
        </View>
      </View>

      {/* Información */}
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📍 Lugar:</Text>
          <Text style={styles.infoValue}>
            {item.ubicacionExterna || item.cancha?.nombre || '—'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>👥 Grupo:</Text>
          <Text style={styles.infoValue}>
            {item.grupo?.nombre || '—'}
          </Text>
        </View>

        {/* Estado del token */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🔑 Token:</Text>
          <View style={[
            styles.tokenBadge,
            item.tokenVigente 
              ? styles.tokenActivo 
              : item.tokenActivo 
                ? styles.tokenExpirado 
                : styles.tokenInactivo
          ]}>
            <Text style={styles.tokenText}>
              {item.tokenVigente 
                ? 'Activo' 
                : item.tokenActivo 
                  ? 'Expirado' 
                  : 'Inactivo'}
            </Text>
          </View>
        </View>
      </View>

      {/* Objetivos */}
      {item.objetivos && (
        <View style={styles.cardFooter}>
          <Text style={styles.objetivosLabel}>Objetivos:</Text>
          <Text style={styles.objetivosText} numberOfLines={2}>
            {item.objetivos}
          </Text>
        </View>
      )}
      <TouchableOpacity
  onPress={() => handleVerDetalle(item)}
  style={{
    marginTop: 10,
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  }}
>
  <Text style={{ color: '#fff', fontWeight: '600' }}>👁 Ver detalle</Text>
</TouchableOpacity>
    </TouchableOpacity>
  );

  // Loading inicial
  if (loading && sesiones.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Cargando sesiones...</Text>
      </View>
    );
  }

 return (
  <View style={styles.container}>
    {/* Header con búsqueda */}
    <View style={styles.header}>
      <Text style={styles.title}>📅 Sesiones</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por tipo, grupo o cancha..."
          value={busqueda}
          onChangeText={setBusqueda}
          onSubmitEditing={handleBuscar}
          returnKeyType="search"
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleBuscar}
        >
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* Lista */}
    <FlatList
      data={sesiones}
      renderItem={renderSesion}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1976d2']}
        />
      }
      onEndReached={cargarMas}
      onEndReachedThreshold={0.5}
      ListFooterComponent={() => (
        <View style={{ padding: 20, alignItems: 'center' }}>
          {/* Texto de paginación */}
          {pagination.total > 0 && (
            <Text style={{ color: '#666', marginBottom: 12 }}>
              Mostrando {sesiones.length} de {pagination.total} sesiones
            </Text>
          )}

          {/* Indicador de carga */}
          {loading && sesiones.length > 0 && (
            <ActivityIndicator size="small" color="#1976d2" />
          )}

          {/* Botón Cargar más */}
          {!loading &&
            sesiones.length < pagination.total && (
              <TouchableOpacity
                onPress={() =>
                  cargarSesiones(pagination.current + 1, false)
                }
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  backgroundColor: '#1976d2',
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  Cargar más
                </Text>
              </TouchableOpacity>
            )}
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No hay sesiones disponibles
          </Text>
        </View>
      )}
    />
    <ModalDetalleSesion
  visible={detalleVisible}
  sesion={detalleSesion}
  onClose={() => setDetalleVisible(false)}
/>

  </View>
);
}

// Utilidades
const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
};

const formatearHora = (hora) => {
  if (!hora) return '';
  return hora.substring(0, 5);
};

const getBadgeColor = (tipo) => {
  const colores = {
    'tecnica': { backgroundColor: '#1976d2' },
    'táctica': { backgroundColor: '#4caf50' },
    'tactica': { backgroundColor: '#4caf50' },
    'fisica': { backgroundColor: '#ff9800' },
    'mixta': { backgroundColor: '#9c27b0' },
    'entrenamiento': { backgroundColor: '#f44336' },
    'partido': { backgroundColor: '#e91e63' }
  };
  return colores[tipo?.toLowerCase()] || { backgroundColor: '#757575' };
};
const ModalDetalleSesion = ({ visible, sesion, onClose }) => {
  if (!sesion) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          
          <Text style={styles.modalTitle}>Detalle de la Sesión</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Fecha:</Text>
            <Text style={styles.detailValue}>{formatearFecha(sesion.fecha)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏰ Horario:</Text>
            <Text style={styles.detailValue}>
              {formatearHora(sesion.horaInicio)} - {formatearHora(sesion.horaFin)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Lugar:</Text>
            <Text style={styles.detailValue}>
              {sesion.ubicacionExterna || sesion.cancha?.nombre || 'Sin ubicación'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>👥 Grupo:</Text>
            <Text style={styles.detailValue}>
              {sesion.grupo?.nombre || 'Sin grupo'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🏷 Tipo:</Text>
            <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>
              {sesion.tipoSesion}
            </Text>
          </View>

          {sesion.objetivos && (
            <View style={{ marginTop: 15 }}>
              <Text style={styles.detailLabel}>🎯 Objetivos:</Text>
              <Text style={[styles.detailValue, { marginTop: 5 }]}>
                {sesion.objetivos}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',
},
modalContainer: {
  backgroundColor: '#fff',
  padding: 20,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  maxHeight: '90%',
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#1976d2',
  marginBottom: 15,
},
detailRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginVertical: 6,
},
detailLabel: {
  fontSize: 15,
  fontWeight: '600',
  color: '#444',
},
detailValue: {
  fontSize: 15,
  color: '#333',
  flexShrink: 1,
  textAlign: 'right',
},
closeButton: {
  marginTop: 25,
  backgroundColor: '#1976d2',
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: 'center',
},
closeButtonText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 16,
},

  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
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
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#1976d2',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  list: {
    padding: 15,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fecha: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  horario: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  cardBody: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  tokenBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  cardFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  objetivosLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  objetivosText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  footerLoading: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
