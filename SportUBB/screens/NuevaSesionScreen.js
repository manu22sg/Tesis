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
import { crearSesion, crearSesionesRecurrentes } from '../services/sesionServices';
import { obtenerCanchas } from '../services/canchaServices';
import { obtenerGrupos } from '../services/grupoServices';
import { verificarDisponibilidad } from '../services/horarioServices';

export default function NuevaSesionScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modo de sesión
  const [esRecurrente, setEsRecurrente] = useState(false);
  
  // Datos del formulario
  const [tipoUbicacion, setTipoUbicacion] = useState('cancha');
  const [canchaId, setCanchaId] = useState(null);
  const [ubicacionExterna, setUbicacionExterna] = useState('');
  const [grupoId, setGrupoId] = useState(null);
  
  // Fechas
  const [fecha, setFecha] = useState(new Date());
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  
  // Horas
  const [horaInicio, setHoraInicio] = useState(null);
  const [horaFin, setHoraFin] = useState(null);

  
  // Días de la semana (para recurrente)
  const [diasSemana, setDiasSemana] = useState([]);
  
  // Otros campos
  const [tipoSesion, setTipoSesion] = useState('');
  const [objetivos, setObjetivos] = useState('');
  
  // Listas
  const [canchas, setCanchas] = useState([]);
  const [grupos, setGrupos] = useState([]);
  
  // Modales
  const [modalCancha, setModalCancha] = useState(false);
  const [modalGrupo, setModalGrupo] = useState(false);
  const [modalDias, setModalDias] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('single'); // 'single', 'inicio', 'fin'
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState('start');
  
  // Disponibilidad
  const [checkingDisp, setCheckingDisp] = useState(false);
  const [dispOk, setDispOk] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [dataCanchas, dataGrupos] = await Promise.all([
        obtenerCanchas({ estado: 'disponible', limit: 100 }),
        obtenerGrupos({ limit: 100 })
      ]);

      setCanchas(dataCanchas?.canchas || []);
      const gruposArray = dataGrupos?.data?.grupos || dataGrupos?.grupos || dataGrupos || [];
      setGrupos(Array.isArray(gruposArray) ? gruposArray : []);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Verificar disponibilidad (solo para sesión única en cancha)
  useEffect(() => {
  // ❌ NO verificar si es recurrente
  if (esRecurrente) {
    setDispOk(null);
    return;
  }

  // ❌ NO verificar si no es sesión en cancha
  if (tipoUbicacion !== 'cancha') {
    setDispOk(null);
    return;
  }

  // ❌ NO verificar si faltan campos obligatorios
  if (!canchaId || !fecha || !horaInicio || !horaFin) {
    setDispOk(null);
    return;
  }
 

  // ❌ NO verificar si horas inválidas
  if (horaInicio >= horaFin) {
    setDispOk(null);
    return;
  }

  // ⏳ Debounce de 500ms
  const timeout = setTimeout(async () => {
    try {
      setCheckingDisp(true);

      const res = await verificarDisponibilidad(
        canchaId,
        fecha.toISOString().split('T')[0],
        formatearHora(horaInicio),
        formatearHora(horaFin)
      );

      setDispOk(!!res?.disponible);
      
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      setDispOk(null);
    } finally {
      setCheckingDisp(false);
    }
  }, 500);

  return () => clearTimeout(timeout);

}, [esRecurrente, tipoUbicacion, canchaId, fecha, horaInicio, horaFin]);


  const handleCrear = async () => {
    // Validaciones básicas
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
     if (!horaInicio) {
  Alert.alert('Error', 'Debe seleccionar la hora de inicio');
  return;
}

if (!horaFin) {
  Alert.alert('Error', 'Debe seleccionar la hora de fin');
  return;
}
    if (horaInicio >= horaFin) {
      Alert.alert('Error', 'La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    if (esRecurrente && diasSemana.length === 0) {
      Alert.alert('Error', 'Seleccione al menos un día de la semana');
      return;
    }

    if (esRecurrente && fechaInicio >= fechaFin) {
      Alert.alert('Error', 'La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        tipoSesion: tipoSesion.trim(),
        objetivos: objetivos.trim() || null,
        horaInicio: horaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
        horaFin: horaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
        grupoId: grupoId || null,
      };

      if (tipoUbicacion === 'cancha') {
        payload.canchaId = canchaId;
      } else {
        payload.ubicacionExterna = ubicacionExterna.trim();
      }

      if (esRecurrente) {
        // Sesiones recurrentes
        payload.fechaInicio = fechaInicio.toISOString().split('T')[0];
        payload.fechaFin = fechaFin.toISOString().split('T')[0];
        payload.diasSemana = diasSemana;

        const result = await crearSesionesRecurrentes(payload);
        
        if (result.errores && result.errores.length > 0) {
          Alert.alert(
            'Sesiones Creadas con Conflictos',
            `${result.sesionesCreadas} sesiones creadas. ${result.errores.length} conflictos encontrados.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert(
            'Éxito',
            `${result.sesionesCreadas} sesiones creadas correctamente`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        // Sesión única
        payload.fecha = fecha.toISOString().split('T')[0];

        // Verificar disponibilidad final si es cancha
        if (tipoUbicacion === 'cancha') {
          const disponibilidad = await verificarDisponibilidad(
            payload.canchaId,
            payload.fecha,
            payload.horaInicio,
            payload.horaFin
          );

          if (!disponibilidad.disponible) {
            Alert.alert('Error', disponibilidad.message || 'La cancha no está disponible en ese horario');
            setSaving(false);
            return;
          }
        }

        await crearSesion(payload);
        Alert.alert('Éxito', 'Sesión creada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
      
    } catch (error) {
      console.error('Error creando:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear la sesión');
    } finally {
      setSaving(false);
    }
  };

  const toggleDiaSemana = (dia) => {
    if (diasSemana.includes(dia)) {
      setDiasSemana(diasSemana.filter(d => d !== dia));
    } else {
      setDiasSemana([...diasSemana, dia]);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      if (datePickerMode === 'single') {
        setFecha(selectedDate);
      } else if (datePickerMode === 'inicio') {
        setFechaInicio(selectedDate);
      } else {
        setFechaFin(selectedDate);
      }
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
  if (!fecha) return '-';
  return fecha.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
};


  const getNombreCancha = () => {
    const cancha = canchas.find(c => c.id === canchaId);
    return cancha ? cancha.nombre : 'Seleccionar cancha';
  };

  const getNombreGrupo = () => {
    const grupo = grupos.find(g => g.id === grupoId);
    return grupo ? grupo.nombre : 'Sin grupo';
  };

  const diasSemanaOpciones = [
    { label: 'Lunes', value: 1 },
    { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#014898" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Modo: Única o Recurrente */}
        <View style={styles.section}>
          <Text style={styles.label}>Tipo de programación</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioOption, !esRecurrente && styles.radioOptionSelected]}
              onPress={() => setEsRecurrente(false)}
            >
              <View style={styles.radio}>
                {!esRecurrente && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>Sesión única</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radioOption, esRecurrente && styles.radioOptionSelected]}
              onPress={() => setEsRecurrente(true)}
            >
              <View style={styles.radio}>
                {esRecurrente && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>Sesiones recurrentes</Text>
            </TouchableOpacity>
          </View>

          {esRecurrente && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Se crearán sesiones para todos los días seleccionados dentro del rango de fechas.
              </Text>
            </View>
          )}
        </View>

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
              placeholder="Ej: Estadio Municipal..."
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

        {/* Fecha(s) */}
        {!esRecurrente ? (
          <View style={styles.section}>
            <Text style={styles.label}>Fecha *</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => {
                setDatePickerMode('single');
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.selectorTextActive}>{formatearFecha(fecha)}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Fecha de Inicio *</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => {
                  setDatePickerMode('inicio');
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.selectorTextActive}>{formatearFecha(fechaInicio)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Fecha de Fin *</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => {
                  setDatePickerMode('fin');
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.selectorTextActive}>{formatearFecha(fechaFin)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Días de la Semana *</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setModalDias(true)}
              >
                <Text style={[styles.selectorText, diasSemana.length > 0 && styles.selectorTextActive]}>
                  {diasSemana.length > 0
                    ? diasSemanaOpciones.filter(d => diasSemana.includes(d.value)).map(d => d.label).join(', ')
                    : 'Seleccionar días'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

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
              <Text style={styles.selectorTextActive}>
  {horaInicio ? formatearHora(horaInicio) : '-'}
</Text>
            </TouchableOpacity>

            <Text style={styles.separator}>-</Text>

            <TouchableOpacity
              style={[styles.selector, styles.halfWidth]}
              onPress={() => {
                setTimePickerMode('end');
                setShowTimePicker(true);
              }}
            >
              <Text style={styles.selectorTextActive}>
  {horaFin ? formatearHora(horaFin) : '-'}
</Text>
            </TouchableOpacity>
          </View>

          {/* Indicador de disponibilidad */}
          {!esRecurrente && tipoUbicacion === 'cancha' && (
            <View style={styles.dispContainer}>
              {checkingDisp ? (
                <Text style={styles.dispText}>⏳ Verificando disponibilidad...</Text>
              ) : dispOk === true ? (
                <Text style={[styles.dispText, styles.dispOk]}>✅ Cancha disponible</Text>
              ) : dispOk === false ? (
                <Text style={[styles.dispText, styles.dispError]}>❌ Cancha NO disponible</Text>
              ) : null}
            </View>
          )}
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
            placeholder="Describe los objetivos..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Botón Crear */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!esRecurrente && tipoUbicacion === 'cancha' && dispOk === false) && styles.saveButtonDisabled
          ]}
          onPress={handleCrear}
          disabled={saving || (!esRecurrente && tipoUbicacion === 'cancha' && dispOk === false)}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {esRecurrente ? 'Crear Sesiones' : 'Crear Sesión'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={
            datePickerMode === 'single' ? fecha :
            datePickerMode === 'inicio' ? fechaInicio : fechaFin
          }
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          locale="es-ES"
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
  <DateTimePicker
    value={
      timePickerMode === 'start'
        ? horaInicio || new Date()
        : horaFin || new Date()
    }
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

      {/* Modal Días de la Semana */}
      <Modal
        visible={modalDias}
        transparent
        animationType="slide"
        onRequestClose={() => setModalDias(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalDias(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Seleccionar Días</Text>

            <View style={styles.checkboxGroup}>
              {diasSemanaOpciones.map((dia) => (
                <TouchableOpacity
                  key={dia.value}
                  style={styles.checkboxItem}
                  onPress={() => toggleDiaSemana(dia.value)}
                >
                  <View style={[styles.checkbox, diasSemana.includes(dia.value) && styles.checkboxChecked]}>
                    {diasSemana.includes(dia.value) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>{dia.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalDias(false)}
            >
              <Text style={styles.modalCloseButtonText}>Aplicar</Text>
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
    borderColor: '#014898',
    backgroundColor: '#f0f8ff',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#014898',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#014898',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#014898',
  },
  dispContainer: {
    marginTop: 8,
  },
  dispText: {
    fontSize: 13,
  },
  dispOk: {
    color: '#4caf50',
  },
  dispError: {
    color: '#f44336',
  },
  saveButton: {
    backgroundColor: '#014898',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
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
    backgroundColor: '#014898',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  checkboxGroup: {
    gap: 10,
    marginBottom: 15,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#014898',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#014898',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
  },
});