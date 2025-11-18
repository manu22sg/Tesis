import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useState, useEffect } from 'react';
import { crearReserva } from '../services/reservaServices';
import { getDisponibilidadPorFecha } from '../services/horarioServices';
import { buscarUsuarios } from '../services/authServices';
import { useAuth } from '../context/AuthContext';

export default function NuevaReservaScreen({ navigation }) {
  const { usuario } = useAuth();

  const [fecha, setFecha] = useState(new Date());
  const [canchas, setCanchas] = useState([]);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [participantes, setParticipantes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCanchas, setLoadingCanchas] = useState(true);
  const [modalBusqueda, setModalBusqueda] = useState(false);

  const horariosDisponibles = [
    { inicio: '08:00', fin: '09:30' },
    { inicio: '09:30', fin: '11:00' },
    { inicio: '11:00', fin: '12:30' },
    { inicio: '12:30', fin: '14:00' },
  ];

  useEffect(() => {
    cargarCanchas();
    if (usuario && usuario.rut && !participantes.includes(usuario.rut)) {
      setParticipantes([usuario.rut]);
    }
  }, [usuario]);

  const cargarCanchas = async () => {
    try {
      setLoadingCanchas(true);
      const fechaStr = formatearFechaAPI(new Date());
      const response = await getDisponibilidadPorFecha(fechaStr, 1, 100);
      setCanchas(response.data || []);
    } catch (error) {
      console.error('Error cargando canchas:', error);
      Alert.alert('Error', 'No se pudieron cargar las canchas');
    } finally {
      setLoadingCanchas(false);
    }
  };

  const buscarUsuariosHandler = async (query) => {
  if (!query || query.trim().length < 2) {
    setSugerencias([]);
    return;
  }

  try {
    const resultados = await buscarUsuarios(query, { 
  roles: JSON.stringify(['estudiante','academico']) 
    });
    
    // Como el servicio ya devuelve un array garantizado, solo filtramos
    const filtrados = resultados.filter(r => !participantes.includes(r.rut));
    setSugerencias(filtrados);
    
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    setSugerencias([]);
  }
};

  const agregarParticipante = (usuario) => {
    if (!canchaSeleccionada) {
      Alert.alert('Error', 'Primero selecciona una cancha');
      return;
    }

    const capacidad = canchaSeleccionada.cancha.capacidadMaxima;
    
    if (participantes.length >= capacidad) {
      Alert.alert('Límite alcanzado', `La cancha permite máximo ${capacidad} participantes`);
      return;
    }

    if (participantes.includes(usuario.rut)) {
      Alert.alert('Aviso', 'Este participante ya fue agregado');
      return;
    }

    setParticipantes([...participantes, usuario.rut]);
    setSearchQuery('');
    setSugerencias([]);
  };

  const removerParticipante = (rut) => {
    if (usuario && usuario.rut === rut) {
      Alert.alert('Aviso', 'No puedes removerte como solicitante');
      return;
    }
    setParticipantes(participantes.filter(p => p !== rut));
  };

  const handleSeleccionarHorario = (horario) => {
    setHoraInicio(horario.inicio);
    setHoraFin(horario.fin);
  };

  const formatearFechaAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!canchaSeleccionada) {
      Alert.alert('Error', 'Selecciona una cancha');
      return;
    }

    if (!horaInicio || !horaFin) {
      Alert.alert('Error', 'Selecciona un horario');
      return;
    }

    const capacidad = canchaSeleccionada.cancha.capacidadMaxima;
    if (participantes.length !== capacidad) {
      Alert.alert('Error', `Se requieren exactamente ${capacidad} participantes`);
      return;
    }

    try {
      setLoading(true);

      const data = {
        canchaId: canchaSeleccionada.cancha.id,
        fecha: formatearFechaAPI(fecha),
        horaInicio,
        horaFin,
        motivo: motivo || '',
        participantes,
      };

      await crearReserva(data);
      Alert.alert('Éxito', 'Reserva creada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creando reserva:', error);
      const msg = error.response?.data?.message || 'Error al crear la reserva';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Info del solicitante */}
        {usuario && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>👤 Solicitante:</Text>
            <Text style={styles.infoValue}>{usuario.nombre}</Text>
            <Text style={styles.infoRut}>{usuario.rut}</Text>
          </View>
        )}

        {/* Selección de cancha */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚽ Cancha</Text>
          {loadingCanchas ? (
            <ActivityIndicator color="#1976d2" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {canchas.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.canchaItem,
                    canchaSeleccionada?.cancha.id === item.cancha.id && styles.canchaItemSelected
                  ]}
                  onPress={() => {
                    setCanchaSeleccionada(item);
                    setParticipantes([usuario?.rut].filter(Boolean));
                  }}
                >
                  <Text style={styles.canchaItemNombre}>{item.cancha.nombre}</Text>
                  <Text style={styles.canchaItemCapacidad}>
                    👥 {item.cancha.capacidadMaxima}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Selección de horario */}
        {canchaSeleccionada && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕐 Horario</Text>
            <View style={styles.horariosGrid}>
              {horariosDisponibles.map((horario, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.horarioItem,
                    horaInicio === horario.inicio && styles.horarioItemSelected
                  ]}
                  onPress={() => handleSeleccionarHorario(horario)}
                >
                  <Text style={styles.horarioText}>
                    {horario.inicio} - {horario.fin}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Participantes */}
        {canchaSeleccionada && (
          <View style={styles.section}>
            <View style={styles.participantesHeader}>
              <Text style={styles.sectionTitle}>👥 Participantes</Text>
              <Text style={styles.participantesCount}>
                {participantes.length}/{canchaSeleccionada.cancha.capacidadMaxima}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.buscarButton}
              onPress={() => setModalBusqueda(true)}
              disabled={participantes.length >= canchaSeleccionada.cancha.capacidadMaxima}
            >
              <Text style={styles.buscarButtonText}>➕ Agregar participantes</Text>
            </TouchableOpacity>

            <View style={styles.participantesList}>
              {participantes.map((rut, index) => (
                <View key={index} style={styles.participanteItem}>
                  <Text style={styles.participanteRut}>
                    {rut}
                    {usuario?.rut === rut && <Text style={styles.tuText}> (Tú)</Text>}
                  </Text>
                  {usuario?.rut !== rut && (
                    <TouchableOpacity onPress={() => removerParticipante(rut)}>
                      <Text style={styles.removerText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Motivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Motivo (opcional)</Text>
          <TextInput
            style={styles.textArea}
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Describe el motivo de la reserva..."
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!canchaSeleccionada || !horaInicio || 
               participantes.length !== canchaSeleccionada?.cancha.capacidadMaxima) && 
              styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={
              !canchaSeleccionada || 
              !horaInicio || 
              participantes.length !== canchaSeleccionada?.cancha.capacidadMaxima ||
              loading
            }
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Reservar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de búsqueda */}
      <Modal
  visible={modalBusqueda}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setModalBusqueda(false)}
>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.modalOverlay}
  >
    <TouchableOpacity
      activeOpacity={1}
      style={styles.modalOverlayTouch}
      onPress={() => {
        setModalBusqueda(false);
        setSearchQuery('');
        setSugerencias([]);
      }}
    >
      <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.modalTitle}>Buscar participante</Text>

        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            buscarUsuariosHandler(text);
          }}
          placeholder="Buscar por nombre o RUT..."
          autoFocus
        />

        <ScrollView 
          style={styles.sugerenciasList}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {sugerencias.map((usuario, index) => (
            <TouchableOpacity
              key={index}
              style={styles.sugerenciaItem}
              onPress={() => agregarParticipante(usuario)}
            >
              <Text style={styles.sugerenciaNombre}>{usuario.nombre}</Text>
              <Text style={styles.sugerenciaRut}>{usuario.rut}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={() => {
            setModalBusqueda(false);
            setSearchQuery('');
            setSugerencias([]);
          }}
        >
          <Text style={styles.modalCloseButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  </KeyboardAvoidingView>
</Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },
    infoCard: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  infoRut: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  canchaItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 140,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  canchaItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  canchaItemNombre: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  canchaItemCapacidad: {
    fontSize: 12,
    color: '#666',
  },
  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  horarioItem: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: '47%',
  },
  horarioItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  horarioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  participantesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantesCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  buscarButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buscarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  participantesList: {
    gap: 8,
  },
  participanteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f6ffed',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b7eb8f',
  },
  participanteRut: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tuText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  removerText: {
    fontSize: 18,
    color: '#ff4d4f',
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',
},
modalOverlayTouch: {
  flex: 1,
  justifyContent: 'flex-end',
},

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
  },
  sugerenciasList: {
    maxHeight: 300,
  },
  sugerenciaItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sugerenciaNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sugerenciaRut: {
    fontSize: 14,
    color: '#666',
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
