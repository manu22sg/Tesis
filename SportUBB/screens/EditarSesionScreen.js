import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { obtenerSesionPorId, actualizarSesion } from '../services/sesionServices';
import { obtenerCanchas } from '../services/canchaServices';
import { obtenerGrupos } from '../services/grupoServices';

export default function EditarSesionScreen({ route, navigation }) {
  const { sesionId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Datos del formulario
  const [tipoUbicacion, setTipoUbicacion] = useState('cancha'); // 'cancha' o 'externa'
  const [canchaId, setCanchaId] = useState(null);
  const [ubicacionExterna, setUbicacionExterna] = useState('');
  const [grupoId, setGrupoId] = useState(null);
  const [fecha, setFecha] = useState(new Date());
  const [horaInicio, setHoraInicio] = useState(new Date());
  const [horaFin, setHoraFin] = useState(new Date());
  const [tipoSesion, setTipoSesion] = useState('');
  const [objetivos, setObjetivos] = useState('');
  
  // Listas
  const [canchas, setCanchas] = useState([]);
  const [grupos, setGrupos] = useState([]);
  
  // Modales
  const [modalCancha, setModalCancha] = useState(false);
  const [modalGrupo, setModalGrupo] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState('start'); // 'start' o 'end'

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar sesión existente
      const sesion = await obtenerSesionPorId(sesionId);
      if (!sesion) {
        Alert.alert('Error', 'Sesión no encontrada');
        navigation.goBack();
        return;
      }

      // Determinar tipo de ubicación
      const tipo = sesion.ubicacionExterna ? 'externa' : 'cancha';
      setTipoUbicacion(tipo);
      
      // Setear valores
      setCanchaId(sesion.cancha?.id || null);
      setUbicacionExterna(sesion.ubicacionExterna || '');
      setGrupoId(sesion.grupo?.id || null);
      setTipoSesion(sesion.tipoSesion || '');
      setObjetivos(sesion.objetivos || '');
      
      // Fechas y horas
      if (sesion.fecha) {
        const [year, month, day] = sesion.fecha.split('-').map(Number);
        setFecha(new Date(year, month - 1, day));
      }
      
      if (sesion.horaInicio) {
        const [h, m] = sesion.horaInicio.split(':').map(Number);
        const inicio = new Date();
        inicio.setHours(h, m, 0);
        setHoraInicio(inicio);
      }
      
      if (sesion.horaFin) {
        const [h, m] = sesion.horaFin.split(':').map(Number);
        const fin = new Date();
        fin.setHours(h, m, 0);
        setHoraFin(fin);
      }

      // Cargar canchas y grupos
      const [dataCanchas, dataGrupos] = await Promise.all([
        obtenerCanchas({ estado: 'disponible', limit: 100 }),
        obtenerGrupos({ limit: 100 })
      ]);

      setCanchas(dataCanchas?.canchas || []);
      const gruposArray = dataGrupos?.data?.grupos || dataGrupos?.grupos || dataGrupos || [];
      setGrupos(Array.isArray(gruposArray) ? gruposArray : []);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudo cargar la sesión');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
  // Validaciones
  if (tipoUbicacion === 'cancha' && !canchaId) {
    Alert.alert('Error', 'Seleccione una cancha');
    return;
  }
  
  if (tipoUbicacion === 'externa' && !ubicacionExterna.trim()) {
    Alert.alert('Error', 'Ingrese la ubicación externa');
    return;
  }
  
  if (!tipoSesion.trim()) {
    Alert.alert('Error', 'Ingrese el tipo de sesión');
    return;
  }

  // Validar horas
  if (horaInicio >= horaFin) {
    Alert.alert('Error', 'La hora de inicio debe ser anterior a la hora de fin');
    return;
  }

  try {
    setSaving(true);
    
    const payload = {
      tipoSesion: tipoSesion.trim(),
      objetivos: objetivos.trim() || null,
      fecha: fecha.toISOString().split('T')[0],
      horaInicio: horaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
      horaFin: horaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
      grupoId: grupoId || null,
    };

    if (tipoUbicacion === 'cancha') {
      payload.canchaId = canchaId;
      payload.ubicacionExterna = null;

      //VERIFICAR DISPONIBILIDAD ANTES DE GUARDAR
      const disponibilidad = await verificarDisponibilidad(
        payload.canchaId,
        payload.fecha,
        payload.horaInicio,
        payload.horaFin,
        sesionId   // EXCLUIR ESTA SESIÓN DEL CHEQUEO
      );

      if (!disponibilidad.disponible) {
        Alert.alert('Error', disponibilidad.message || 'La cancha no está disponible');
        setSaving(false);
        return;
      }

    } else {
      payload.ubicacionExterna = ubicacionExterna.trim();
      payload.canchaId = null;
    }

    // SI TODO OK → GUARDAR
    await actualizarSesion(sesionId, payload);
    
    Alert.alert('Éxito', 'Sesión actualizada correctamente', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);

  } catch (error) {
    console.error('Error actualizando:', error);
    Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar la sesión');
  } finally {
    setSaving(false);
  }
};


  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      setFecha(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedTime) {
      if (timePickerMode === 'start') {
        setHoraInicio(selectedTime);
      } else {
        setHoraFin(selectedTime);
      }
    }
  };

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatearHora = (fecha) => {
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getNombreCancha = () => {
    const cancha = canchas.find(c => c.id === canchaId);
    return cancha ? cancha.nombre : 'Seleccionar cancha';
  };

  const getNombreGrupo = () => {
    const grupo = grupos.find(g => g.id === grupoId);
    return grupo ? grupo.nombre : 'Sin grupo';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Cargando sesión...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Tipo de Ubicación */}
        <View style={styles.section}>
          <Text style={styles.label}>Tipo de Ubicación</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioOption, tipoUbicacion === 'cancha' && styles.radioOptionSelected]}
              onPress={() => setTipoUbicacion('cancha')}
            >
              <View style={styles.radio}>
                {tipoUbicacion === 'cancha' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>Cancha del club</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radioOption, tipoUbicacion === 'externa' && styles.radioOptionSelected]}
              onPress={() => setTipoUbicacion('externa')}
            >
              <View style={styles.radio}>
                {tipoUbicacion === 'externa' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>Ubicación externa</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cancha o Ubicación Externa */}
        {tipoUbicacion === 'cancha' ? (
          <View style={styles.section}>
            <Text style={styles.label}>Cancha *</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setModalCancha(true)}
            >
              <Text style={[styles.selectorText, canchaId && styles.selectorTextActive]}>
                {getNombreCancha()}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>Ubicación Externa *</Text>
            <TextInput
              style={styles.input}
              value={ubicacionExterna}
              onChangeText={setUbicacionExterna}
              placeholder="Ej: Estadio Municipal, Cancha Parque..."
              maxLength={200}
            />
            <Text style={styles.charCount}>{ubicacionExterna.length}/200</Text>
          </View>
        )}

        {/* Grupo */}
        <View style={styles.section}>
          <Text style={styles.label}>Grupo (opcional)</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setModalGrupo(true)}
          >
            <Text style={[styles.selectorText, grupoId && styles.selectorTextActive]}>
              {getNombreGrupo()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fecha */}
        <View style={styles.section}>
          <Text style={styles.label}>Fecha *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.selectorTextActive}>{formatearFecha(fecha)}</Text>
          </TouchableOpacity>
        </View>

        {/* Horario */}
        <View style={styles.section}>
          <Text style={styles.label}>Horario *</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.selector, styles.halfWidth]}
              onPress={() => {
                setTimePickerMode('start');
                setShowTimePicker(true);
              }}
            >
              <Text style={styles.selectorTextActive}>{formatearHora(horaInicio)}</Text>
            </TouchableOpacity>

            <Text style={styles.separator}>-</Text>

            <TouchableOpacity
              style={[styles.selector, styles.halfWidth]}
              onPress={() => {
                setTimePickerMode('end');
                setShowTimePicker(true);
              }}
            >
              <Text style={styles.selectorTextActive}>{formatearHora(horaFin)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tipo de Sesión */}
        <View style={styles.section}>
          <Text style={styles.label}>Tipo de Sesión *</Text>
          <TextInput
            style={styles.input}
            value={tipoSesion}
            onChangeText={setTipoSesion}
            placeholder="Ej: técnica, táctica, fuerza..."
            maxLength={50}
          />
          <Text style={styles.charCount}>{tipoSesion.length}/50</Text>
        </View>

        {/* Objetivos */}
        <View style={styles.section}>
          <Text style={styles.label}>Objetivos (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={objetivos}
            onChangeText={setObjetivos}
            placeholder="Describe los objetivos de la sesión"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleGuardar}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={fecha}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          locale="es-ES"
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={timePickerMode === 'start' ? horaInicio : horaFin}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          minuteInterval={30}
        />
      )}

      {/* Modal Cancha */}
      <Modal
        visible={modalCancha}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCancha(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalCancha(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Seleccionar Cancha</Text>

            <ScrollView style={styles.modalList}>
              {canchas.map((cancha) => (
                <TouchableOpacity
                  key={cancha.id}
                  style={[styles.modalItem, canchaId === cancha.id && styles.modalItemSelected]}
                  onPress={() => {
                    setCanchaId(cancha.id);
                    setModalCancha(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{cancha.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalCancha(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal Grupo */}
      <Modal
        visible={modalGrupo}
        transparent
        animationType="slide"
        onRequestClose={() => setModalGrupo(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalGrupo(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Seleccionar Grupo</Text>

            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[styles.modalItem, !grupoId && styles.modalItemSelected]}
                onPress={() => {
                  setGrupoId(null);
                  setModalGrupo(false);
                }}
              >
                <Text style={styles.modalItemText}>Sin grupo</Text>
              </TouchableOpacity>

              {grupos.map((grupo) => (
                <TouchableOpacity
                  key={grupo.id}
                  style={[styles.modalItem, grupoId === grupo.id && styles.modalItemSelected]}
                  onPress={() => {
                    setGrupoId(grupo.id);
                    setModalGrupo(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{grupo.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalGrupo(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
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
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  selector: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  selectorText: {
    fontSize: 14,
    color: '#999',
  },
  selectorTextActive: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  separator: {
    fontSize: 16,
    color: '#666',
  },
  radioGroup: {
    gap: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  radioOptionSelected: {
    borderColor: '#1976d2',
    backgroundColor: '#f0f8ff',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1976d2',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1976d2',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  modalItemText: {
    fontSize: 15,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 15,
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});