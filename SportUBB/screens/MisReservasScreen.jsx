// screens/MisReservasScreen.jsx
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
  ScrollView
} from 'react-native';
import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { obtenerMisReservas, obtenerReservaPorId, cancelarReserva } from '../services/reservaServices';
import { useAuth } from '../context/AuthContext';

export default function MisReservasScreen({ navigation }) {
  const isFocused = useIsFocused();
  const { usuario } = useAuth();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detalleModal, setDetalleModal] = useState(false);
  const [reservaDetalle, setReservaDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [modalFiltro, setModalFiltro] = useState(false);

  useEffect(() => {
    if (isFocused) {
      cargarReservas();
    }
  }, [isFocused]);

  const cargarReservas = async (page = 1, pageSize = 10, estado = filtroEstado) => {
    try {
      setLoading(true);
      const filtros = { page, limit: pageSize };
      if (estado) filtros.estado = estado;

      const response = await obtenerMisReservas(filtros);
      
      // Manejar la respuesta correctamente
      if (response.reservas) {
        setReservas(response.reservas);
        setPagination({
          current: response.pagination?.currentPage || 1,
          pageSize: response.pagination?.itemsPerPage || 10,
          total: response.pagination?.totalItems || 0,
        });
      } else {
        // Si la respuesta es un array directo
        setReservas(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Error cargando reservas:', error);
      Alert.alert('Error', 'No se pudieron cargar sus reservas');
      setReservas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarReservas(pagination.current, pagination.pageSize, filtroEstado);
  };

  const verDetalle = async (reservaId) => {
    try {
      setLoadingDetalle(true);
      setDetalleModal(true);
      const detalle = await obtenerReservaPorId(reservaId);
      setReservaDetalle(detalle);
    } catch (error) {
      console.error('Error cargando detalle:', error);
      Alert.alert('Error', 'Error al cargar el detalle de la reserva');
      setDetalleModal(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleCancelar = (reservaId) => {
    Alert.alert(
      '¿Cancelar reserva?',
      'Esta acción no se puede deshacer',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelarReserva(reservaId);
              Alert.alert('Éxito', 'Reserva cancelada correctamente');
              cargarReservas(pagination.current, pagination.pageSize, filtroEstado);
            } catch (error) {
              console.error('Error cancelando reserva:', error);
              Alert.alert('Error', error.message || 'No se pudo cancelar la reserva');
            }
          }
        }
      ]
    );
  };

  const handleFiltroEstado = (estado) => {
    setFiltroEstado(estado);
    setModalFiltro(false);
    cargarReservas(1, pagination.pageSize, estado);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    
    // Si la fecha viene en formato ISO con hora (2025-01-15T10:30:00)
    if (fecha.includes('T')) {
      const d = new Date(fecha);
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
    }
    
    // Si la fecha viene solo como YYYY-MM-DD
    const [year, month, day] = fecha.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatearHora = (hora) => {
    if (!hora) return '';
    
    // Si viene en formato ISO completo (2025-01-15T10:30:00)
    if (hora.includes('T')) {
      const d = new Date(hora);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // Si viene solo como HH:MM:SS o HH:MM
    return hora.substring(0, 5);
  };

  const formatearFechaHora = (fechaISO) => {
    if (!fechaISO) return '';
    const d = new Date(fechaISO);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()} ${hours}:${minutes}`;
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'confirmada': '#52c41a',
      'aprobada': '#52c41a',
      'pendiente': '#faad14',
      'cancelada': '#ff4d4f',
      'rechazada': '#ff4d4f',
      'finalizada': '#8c8c8c',
      'completada': '#1890ff',
      'expirada': '#ff7a45'
    };
    return colores[estado?.toLowerCase()] || '#8c8c8c';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'confirmada': '✓ Confirmada',
      'aprobada': '✓ Aprobada',
      'pendiente': '⏱ Pendiente',
      'cancelada': '✗ Cancelada',
      'rechazada': '✗ Rechazada',
      'finalizada': '✓ Finalizada',
      'completada': '✓ Completada',
      'expirada': '⚠ Expirada'
    };
    return textos[estado?.toLowerCase()] || estado;
  };

  const puedeCancelar = (estado) => {
    return ['confirmada', 'aprobada', 'pendiente'].includes(estado?.toLowerCase());
  };

  const renderReserva = ({ item }) => {
    return (
      <View style={styles.reservaCard}>
        <View style={styles.reservaHeader}>
          <View style={styles.reservaInfo}>
            <Text style={styles.canchaNombre}>⚽ {item.cancha?.nombre || 'Cancha'}</Text>
            <Text style={styles.fecha}>{formatearFecha(item.fechaReserva || item.fecha)}</Text>
            <Text style={styles.horario}>
              🕐 {formatearHora(item.horaInicio)} - {formatearHora(item.horaFin)}
            </Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
            <Text style={styles.estadoText}>{getEstadoTexto(item.estado)}</Text>
          </View>
        </View>

        {item.motivo && (
          <View style={styles.motivoContainer}>
            <Text style={styles.motivoLabel}>📝 Motivo:</Text>
            <Text style={styles.motivoText}>{item.motivo}</Text>
          </View>
        )}

        {item.participantes && item.participantes.length > 0 && (
          <View style={styles.participantesContainer}>
            <Text style={styles.participantesLabel}>
              👥 Participantes ({item.participantes.length}):
            </Text>
            <View style={styles.participantesList}>
              {item.participantes.slice(0, 3).map((p, index) => (
                <Text key={index} style={styles.participanteItem}>
                  • {p.usuario?.nombre || p.nombreOpcional || p.nombre || p.rut}
                </Text>
              ))}
              {item.participantes.length > 3 && (
                <Text style={styles.participantesMas}>
                  +{item.participantes.length - 3} más
                </Text>
              )}
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

          {puedeCancelar(item.estado) && (
            <TouchableOpacity
              style={styles.cancelarButton}
              onPress={() => handleCancelar(item.id)}
            >
              <Text style={styles.cancelarButtonText}>✗ Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const estadosDisponibles = [
    { label: 'Todos', value: '' },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Aprobada', value: 'aprobada' },
    { label: 'Rechazada', value: 'rechazada' },
    { label: 'Cancelada', value: 'cancelada' },
    { label: 'Expirada', value: 'expirada' },
    { label: 'Completada', value: 'completada' },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#014898" />
        <Text style={styles.loadingText}>Cargando sus reservas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Mis Reservas</Text>
        <Text style={styles.headerSubtitle}>{usuario?.nombre}</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filtroButton}
            onPress={() => setModalFiltro(true)}
          >
            <Text style={styles.filtroButtonText}>
              🔍 Filtrar {filtroEstado && `(${getEstadoTexto(filtroEstado)})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
      {reservas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>
            {filtroEstado 
              ? `No tiene reservas con estado "${getEstadoTexto(filtroEstado)}"`
              : 'No tiene reservas registradas'}
          </Text>
          {!filtroEstado && (
            <TouchableOpacity
              style={styles.nuevaReservaButton}
              onPress={() => navigation.navigate('Disponibilidad', { screen: 'NuevaReserva' })}
            >
              <Text style={styles.nuevaReservaButtonText}>Crear primera reserva</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={reservas}
          renderItem={renderReserva}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
        visible={detalleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetalleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setDetalleModal(false);
              setReservaDetalle(null);
            }}
          />
          <View style={styles.modalDetalleContent}>
            <Text style={styles.modalTitle}>Detalle de la Reserva</Text>

            {loadingDetalle ? (
              <ActivityIndicator size="large" color="#014898" style={{ marginVertical: 40 }} />
            ) : reservaDetalle ? (
              <ScrollView 
                style={styles.detalleScroll}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {/* Información general */}
                <View style={styles.detalleSection}>
                  <Text style={styles.detalleSectionTitle}>Información General</Text>
                  
                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Fecha:</Text>
                    <Text style={styles.detalleValue}>
                      {formatearFecha(reservaDetalle.fechaReserva || reservaDetalle.fecha)}
                    </Text>
                  </View>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Horario:</Text>
                    <Text style={styles.detalleValue}>
                      {formatearHora(reservaDetalle.horaInicio)} - {formatearHora(reservaDetalle.horaFin)}
                    </Text>
                  </View>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Cancha:</Text>
                    <Text style={styles.detalleValue}>{reservaDetalle.cancha?.nombre}</Text>
                  </View>

                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Estado:</Text>
                    <View style={[styles.estadoBadgeSmall, { backgroundColor: getEstadoColor(reservaDetalle.estado) }]}>
                      <Text style={styles.estadoTextSmall}>{getEstadoTexto(reservaDetalle.estado)}</Text>
                    </View>
                  </View>

                  {reservaDetalle.motivo && (
                    <View style={styles.detalleRow}>
                      <Text style={styles.detalleLabel}>Motivo:</Text>
                      <Text style={styles.detalleValue}>{reservaDetalle.motivo}</Text>
                    </View>
                  )}
                </View>

                {/* Participantes */}
                <View style={styles.detalleSection}>
                  <Text style={styles.detalleSectionTitle}>
                    Participantes ({reservaDetalle.participantes?.length || 0})
                  </Text>
                  {reservaDetalle.participantes?.map((p, idx) => (
                    <View key={idx} style={styles.participanteDetalleItem}>
                      <Text style={styles.participanteDetalleNombre}>
                        👤 {p.usuario?.nombre || p.nombreOpcional || p.nombre || 'N/A'}
                      </Text>
                      <Text style={styles.participanteDetalleRut}>{p.rut}</Text>
                    </View>
                  ))}
                </View>

                {/* Historial */}
                {reservaDetalle.historial && reservaDetalle.historial.length > 0 && (
                  <View style={styles.detalleSection}>
                    <Text style={styles.detalleSectionTitle}>Historial</Text>
                    {reservaDetalle.historial.map((h, idx) => (
                      <View key={idx} style={styles.historialItem}>
                        <View style={styles.historialHeader}>
                          <Text style={styles.historialAccion}>{h.accion}</Text>
                          <Text style={styles.historialFecha}>
                            {formatearFecha(h.fecha)} {formatearHora(h.fecha)}
                          </Text>
                        </View>
                        {h.observacion && (
                          <Text style={styles.historialObservacion}>{h.observacion}</Text>
                        )}
                        {h.usuario && (
                          <Text style={styles.historialUsuario}>Por: {h.usuario.nombre}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : null}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setDetalleModal(false);
                setReservaDetalle(null);
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
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filtroButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  filtroButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
  },
  reservaCard: {
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
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reservaInfo: {
    flex: 1,
  },
  canchaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  motivoContainer: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  motivoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  motivoText: {
    fontSize: 14,
    color: '#333',
  },
  participantesContainer: {
    marginBottom: 12,
  },
  participantesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  participantesList: {
    marginLeft: 10,
  },
  participanteItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  participantesMas: {
    fontSize: 13,
    color: '#014898',
    fontWeight: '600',
    marginTop: 4,
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
    fontSize: 14,
    fontWeight: '600',
  },
  cancelarButton: {
    flex: 1,
    backgroundColor: '#fff1f0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  cancelarButtonText: {
    color: '#ff4d4f',
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
  participanteDetalleItem: {
    backgroundColor: '#f6ffed',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#b7eb8f',
  },
  participanteDetalleNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  participanteDetalleRut: {
    fontSize: 12,
    color: '#666',
  },
  historialItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historialAccion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  historialFecha: {
    fontSize: 12,
    color: '#999',
  },
  historialObservacion: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  historialUsuario: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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