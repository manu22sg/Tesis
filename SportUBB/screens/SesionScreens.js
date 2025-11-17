import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { useState, useEffect, useRef } from 'react';
import SesionesFilterBar from '../components/SesionesFilterBar';
import { obtenerSesiones } from '../services/sesionServices';

export default function SesionScreens({ navigation }) {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const [filtros, setFiltros] = useState({
    q: '',
    fecha: null,
    horaInicio: null,
    horaFin: null,
    canchaId: null,
    grupoId: null,
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // ✅ Referencia para comparar filtros anteriores
  const prevFiltrosRef = useRef(filtros);
  
  const cargarSesiones = async (page = 1, resetList = false, limpiarLista = true) => {
    try {
      if (resetList && limpiarLista) {
        setSesiones([]);
      }
      
      setLoading(true);

      let horaInicioParam = null;
      let horaFinParam = null;

      if (filtros.horaInicio) {
        const d = filtros.horaInicio instanceof Date ? filtros.horaInicio : new Date(filtros.horaInicio);
        horaInicioParam = d.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      }

      if (filtros.horaFin) {
        const d = filtros.horaFin instanceof Date ? filtros.horaFin : new Date(filtros.horaFin);
        horaFinParam = d.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      }

      // ✅ Completar rangos de hora
      if (horaInicioParam && !horaFinParam) {
        horaFinParam = "23:59";
      }

      if (!horaInicioParam && horaFinParam) {
        horaInicioParam = "00:00";
      }

      const params = {
        page,
        limit: 10,
        ...(filtros.q && { q: filtros.q }),
        ...(filtros.fecha && { fecha: filtros.fecha.toISOString().split('T')[0] }),
        ...(horaInicioParam && { horaInicio: horaInicioParam }),
        ...(horaFinParam && { horaFin: horaFinParam }),
        ...(filtros.canchaId && { canchaId: filtros.canchaId }),
        ...(filtros.grupoId && { grupoId: filtros.grupoId }),
      };


      const { sesiones: data, pagination: p } = await obtenerSesiones(params);

      if (resetList) {
        setSesiones(data);
      } else {
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
  };

  const handleVerDetalle = (sesion) => {
    navigation.navigate('SesionDetalle', {
      sesionId: sesion.id,
      sesion: sesion
    });
  };

  // ✅ useEffect optimizado
  useEffect(() => {
    const prevFiltros = prevFiltrosRef.current;
    
    // Detectar si solo borró la búsqueda
    const soloBorroBusqueda = 
      prevFiltros.q !== '' && 
      filtros.q === '' && 
      prevFiltros.fecha === filtros.fecha &&
      prevFiltros.horaInicio === filtros.horaInicio &&
      prevFiltros.horaFin === filtros.horaFin &&
      prevFiltros.canchaId === filtros.canchaId &&
      prevFiltros.grupoId === filtros.grupoId;

    // Si solo está escribiendo búsqueda
    const soloEsBusqueda = 
      filtros.q && 
      !filtros.fecha && 
      !filtros.horaInicio && 
      !filtros.horaFin && 
      !filtros.canchaId && 
      !filtros.grupoId;

    const limpiarLista = !soloBorroBusqueda && !soloEsBusqueda;
    
    cargarSesiones(1, true, limpiarLista);
    
    prevFiltrosRef.current = filtros;
  }, [filtros.q, filtros.fecha, filtros.horaInicio, filtros.horaFin, filtros.canchaId, filtros.grupoId]);

  useEffect(() => {
  if (isFocused) {
    cargarSesiones(1, true, true); 
  }
}, [isFocused]);


  const onRefresh = () => {
    setRefreshing(true);
    cargarSesiones(1, true, false);
  };

  const cargarMas = () => {
    if (loading || pagination.current * pagination.pageSize >= pagination.total) {
      return;
    }
    cargarSesiones(pagination.current + 1, false, false);
  };
  const renderSesion = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleVerDetalle(item)}
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
      <View style={styles.simpleHeader}>
        <Text style={styles.title}>📅 Sesiones</Text>
      </View>
      
      <SesionesFilterBar filtros={filtros} setFiltros={setFiltros} />
      
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
            {pagination.total > 0 && (
              <Text style={{ color: '#666', marginBottom: 12 }}>
                Mostrando {sesiones.length} de {pagination.total} sesiones
              </Text>
            )}

            {loading && sesiones.length > 0 && (
              <ActivityIndicator size="small" color="#1976d2" />
            )}

            {!loading && sesiones.length < pagination.total && (
              <TouchableOpacity
                onPress={() => cargarSesiones(pagination.current + 1, false, false)}
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
       <TouchableOpacity
      style={styles.fab}
      onPress={() => navigation.navigate('NuevaSesion')}
    >
      <Text style={styles.fabText}>+</Text>
    </TouchableOpacity>
    </View>
  );
}


// ✅ Utilidades actualizadas con manejo correcto de fechas
const formatearFecha = (fecha) => {
  if (!fecha) return '';
  
  // Si la fecha viene como string YYYY-MM-DD
  if (typeof fecha === 'string' && fecha.includes('-')) {
    const [year, month, day] = fecha.split('-').map(Number);
    const d = new Date(year, month - 1, day); // Crear fecha local sin timezone
    
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
  }
  
  // Si ya es un objeto Date
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

const styles = StyleSheet.create({
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
  simpleHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  fab: {
  position: 'absolute',
  right: 20,
  bottom: 20,
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: '#1976d2',
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
  elevation: 8,
},
fabText: {
  color: '#fff',
  fontSize: 32,
  fontWeight: '300',
},
});