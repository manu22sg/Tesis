import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useState, useEffect } from 'react';
import { obtenerJugadorPorId, actualizarJugador } from '../services/jugadorServices';

export default function EditarJugadorScreen({ navigation, route }) {
  const { id } = route.params;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Usuario (solo lectura en edición)
  const [usuario, setUsuario] = useState(null);

  // Campos del formulario
  const [posicion, setPosicion] = useState('');
  const [piernaHabil, setPiernaHabil] = useState('');
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [estado, setEstado] = useState('activo');
  const [anioIngreso, setAnioIngreso] = useState('');

  // Modales
  const [modalPosicion, setModalPosicion] = useState(false);
  const [modalPierna, setModalPierna] = useState(false);
  const [modalEstado, setModalEstado] = useState(false);
  const [modalAnio, setModalAnio] = useState(false);

  const posiciones = [
  'Portero',
  'Defensa Central Derecho',
  'Defensa Central Izquierdo',
  'Lateral Derecho',
  'Lateral Izquierdo',
  'Mediocentro Defensivo',
  'Mediocentro',
  'Mediocentro Ofensivo',
  'Extremo Derecho',
  'Extremo Izquierdo',
  'Delantero Centro'
];

  const piernas = ['Derecha', 'Izquierda', 'Ambas'];
  const estados = [
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
    { label: 'Lesionado', value: 'lesionado' },
    { label: 'Suspendido', value: 'suspendido' }
  ];

  const aniosDisponibles = Array.from(
    { length: 15 },
    (_, i) => new Date().getFullYear() - i
  );

  useEffect(() => {
    cargarJugador();
  }, [id]);

  const cargarJugador = async () => {
    try {
      setLoadingData(true);
      const jugador = await obtenerJugadorPorId(parseInt(id));

      // Cargar datos del usuario
      if (jugador.usuario) {
        setUsuario({
          nombre: jugador.usuario.nombre,
          rut: jugador.usuario.rut,
          email: jugador.usuario.email,
          carrera: jugador.usuario.carrera?.nombre || 'Sin carrera'
        });
      }

      // Cargar datos del jugador
      setPosicion(jugador.posicion || '');
      setPiernaHabil(jugador.piernaHabil || '');
      setAltura(jugador.altura ? jugador.altura.toString() : '');
      setPeso(jugador.peso ? jugador.peso.toString() : '');
      setEstado(jugador.estado || 'activo');
      setAnioIngreso(jugador.anioIngreso ? jugador.anioIngreso.toString() : '');
    } catch (error) {
      console.error('Error cargando jugador:', error);
      Alert.alert('Error', 'No se pudo cargar la información del jugador', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoadingData(false);
    }
  };

  const validarFormulario = () => {
    if (!estado) {
      Alert.alert('Error', 'Debe seleccionar un estado');
      return false;
    }

    if (altura && (parseFloat(altura) < 100 || parseFloat(altura) > 250)) {
      Alert.alert('Error', 'La altura debe estar entre 100 y 250 cm');
      return false;
    }

    if (peso && (parseFloat(peso) < 30 || parseFloat(peso) > 200)) {
      Alert.alert('Error', 'El peso debe estar entre 30 y 200 kg');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) return;

    try {
      setLoading(true);
      const datos = {
        posicion: posicion || undefined,
        piernaHabil: piernaHabil || undefined,
        altura: altura ? parseFloat(altura) : undefined,
        peso: peso ? parseFloat(peso) : undefined,
        estado,
        anioIngreso: anioIngreso ? parseInt(anioIngreso) : undefined
      };

      await actualizarJugador(parseInt(id), datos);
      Alert.alert('Éxito', 'Jugador actualizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error actualizando jugador:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo actualizar el jugador'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#014898" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Jugador</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Usuario (solo lectura) */}
        {usuario && (
          <View style={styles.usuarioCard}>
            <Text style={styles.usuarioLabel}>Usuario</Text>
            <View style={styles.usuarioInfo}>
              <Text style={styles.usuarioNombre}>{usuario.nombre}</Text>
              <Text style={styles.usuarioDetalle}>{usuario.rut}</Text>
              {usuario.email && (
                <Text style={styles.usuarioDetalle}>{usuario.email}</Text>
              )}
              {usuario.carrera && (
                <Text style={styles.usuarioCarrera}>📚 {usuario.carrera}</Text>
              )}
            </View>
          </View>
        )}

        {/* Formulario */}
        <View style={styles.form}>
          <View style={styles.formRow}>
            {/* Posición */}
            <View style={styles.formField}>
              <Text style={styles.label}>Posición</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setModalPosicion(true)}
              >
                <Text style={[styles.selectButtonText, !posicion && styles.placeholder]}>
                  {posicion || 'Seleccionar'}
                </Text>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Pierna Hábil */}
            <View style={styles.formField}>
              <Text style={styles.label}>Pierna Hábil</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setModalPierna(true)}
              >
                <Text style={[styles.selectButtonText, !piernaHabil && styles.placeholder]}>
                  {piernaHabil || 'Seleccionar'}
                </Text>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formRow}>
            {/* Altura */}
            <View style={styles.formField}>
              <Text style={styles.label}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                value={altura}
                onChangeText={setAltura}
                placeholder="Ej: 175"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            {/* Peso */}
            <View style={styles.formField}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={peso}
                onChangeText={setPeso}
                placeholder="Ej: 70"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Estado */}
          <View style={styles.formFieldFull}>
            <Text style={styles.label}>Estado *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setModalEstado(true)}
            >
              <Text style={styles.selectButtonText}>
                {estados.find(e => e.value === estado)?.label || 'Seleccionar'}
              </Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Año de Ingreso */}
          <View style={styles.formFieldFull}>
            <Text style={styles.label}>Año de Ingreso</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setModalAnio(true)}
            >
              <Text style={[styles.selectButtonText, !anioIngreso && styles.placeholder]}>
                {anioIngreso || 'Seleccionar'}
              </Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
          </View>
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
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Actualizar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Posición */}
      <Modal
        visible={modalPosicion}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalPosicion(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setModalPosicion(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Posición</Text>
            {posiciones.map((pos, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalOption,
                  posicion === pos && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setPosicion(pos);
                  setModalPosicion(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    posicion === pos && styles.modalOptionTextSelected
                  ]}
                >
                  {pos}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Pierna */}
      <Modal
        visible={modalPierna}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalPierna(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setModalPierna(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Pierna Hábil</Text>
            {piernas.map((pierna, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalOption,
                  piernaHabil === pierna && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setPiernaHabil(pierna);
                  setModalPierna(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    piernaHabil === pierna && styles.modalOptionTextSelected
                  ]}
                >
                  {pierna}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Estado */}
      <Modal
        visible={modalEstado}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalEstado(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setModalEstado(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Estado</Text>
            {estados.map((est, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalOption,
                  estado === est.value && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setEstado(est.value);
                  setModalEstado(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    estado === est.value && styles.modalOptionTextSelected
                  ]}
                >
                  {est.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Año */}
      <Modal
        visible={modalAnio}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalAnio(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setModalAnio(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Año de Ingreso</Text>
            <ScrollView style={styles.aniosList}>
              {aniosDisponibles.map((anio, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOption,
                    anioIngreso === anio.toString() && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setAnioIngreso(anio.toString());
                    setModalAnio(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      anioIngreso === anio.toString() && styles.modalOptionTextSelected
                    ]}
                  >
                    {anio}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  usuarioCard: {
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  usuarioLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  usuarioInfo: {
    gap: 4,
  },
  usuarioNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  usuarioDetalle: {
    fontSize: 13,
    color: '#666',
  },
  usuarioCarrera: {
    fontSize: 13,
    color: '#014898',
    marginTop: 2,
  },
  form: {
    gap: 15,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formField: {
    flex: 1,
  },
  formFieldFull: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  selectArrow: {
    fontSize: 12,
    color: '#999',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 30,
    marginBottom: 20,
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
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    fontWeight: 'bold',
    color: '#014898',
  },
  aniosList: {
    maxHeight: 300,
  },
});