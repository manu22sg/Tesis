import React, { memo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { obtenerCanchas } from '../services/canchaServices';
import { obtenerGrupos } from '../services/grupoServices';

const SesionesFilterBar = memo(({ filtros, setFiltros }) => {
  const [canchas, setCanchas] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState(filtros.q || '');
  
  // Modales para pickers
  const [modalCancha, setModalCancha] = useState(false);
  const [modalGrupo, setModalGrupo] = useState(false);
  const [modalHorario, setModalHorario] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState('start'); // 'start' o 'end'

  const mountedRef = useRef(true);
  const debounceRef = useRef(null);

  // Sync búsqueda con filtros externos
  useEffect(() => {
    setBusqueda(filtros.q || '');
  }, [filtros.q]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Cargar canchas y grupos
  useEffect(() => {
    const cargarListas = async () => {
      setLoading(true);
      try {
        const [dataCanchas, dataGrupos] = await Promise.all([
          obtenerCanchas({ estado: 'disponible', limit: 100 }),
          obtenerGrupos({ limit: 100 }),
        ]);
        if (!mountedRef.current) return;

        setCanchas(dataCanchas?.canchas || []);
        const gruposArray = dataGrupos?.data?.grupos || dataGrupos?.grupos || dataGrupos || [];
        setGrupos(Array.isArray(gruposArray) ? gruposArray : []);
      } catch (error) {
        console.error('Error al cargar listas de filtros', error);
        Alert.alert('Error', 'No se pudieron cargar los filtros');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    cargarListas();
  }, []);

  // Debounce para búsqueda
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setFiltros(prev => ({ ...prev, q: busqueda.trim() }));
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busqueda, setFiltros]);

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const limpiar = () => {
    setBusqueda('');
    setFiltros({
      q: '',
      fecha: null,
      horaInicio: null,
      horaFin: null,
      canchaId: null,
      grupoId: null,
    });
  };

  const hayFiltros = !!(filtros.q || filtros.fecha || filtros.horaInicio || filtros.horaFin || filtros.canchaId || filtros.grupoId);

  // Obtener nombre de cancha seleccionada
  const getNombreCancha = () => {
    const cancha = canchas.find(c => c.id === filtros.canchaId);
    return cancha ? cancha.nombre : '--';
  };

  // Obtener nombre de grupo seleccionado
  const getNombreGrupo = () => {
    const grupo = grupos.find(g => g.id === filtros.grupoId);
    return grupo ? grupo.nombre : '--';
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '--';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Formatear hora
  const formatearHora = (fecha) => {
    if (!fecha) return '--:--';
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Formatear rango de horas
  const formatearRangoHoras = () => {
    if (!filtros.horaInicio && !filtros.horaFin) return '--';
    const inicio = formatearHora(filtros.horaInicio);
    const fin = formatearHora(filtros.horaFin);
    if (filtros.horaInicio && filtros.horaFin) {
      return `${inicio} - ${fin}`;
    }
    if (filtros.horaInicio) return `Desde ${inicio}`;
    return `Hasta ${fin}`;
  };

  // Handlers para date/time pickers
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    // Solo guardar si el usuario presionó OK (event.type === 'set')
    if (event.type === 'set' && selectedDate) {
      handleFiltroChange('fecha', selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    // Solo guardar si el usuario presionó OK (event.type === 'set')
    if (event.type === 'set' && selectedTime) {
      if (timePickerMode === 'start') {
        handleFiltroChange('horaInicio', selectedTime);
      } else {
        handleFiltroChange('horaFin', selectedTime);
      }
    }
  };

  const openTimePicker = (mode) => {
    setTimePickerMode(mode);
    setShowTimePicker(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Filtros</Text>
        {hayFiltros && (
          <TouchableOpacity onPress={limpiar} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Búsqueda general */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por tipo, grupo, lugar..."
          value={busqueda}
          onChangeText={setBusqueda}
          returnKeyType="search"
          placeholderTextColor="#999"
        />
      </View>

      {/* Selectores de Fecha y Hora */}
      <View style={styles.filtersRow}>
        {/* Selector de Fecha */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.filterLabel}>📅 Fecha</Text>
          <Text style={[styles.filterButtonText, filtros.fecha && styles.filterButtonTextActive]}>
            {formatearFecha(filtros.fecha)}
          </Text>
        </TouchableOpacity>

        {/* Selector de Rango de Horas */}
        <TouchableOpacity
          style={[styles.filterButton, styles.filterButtonWide]}
          onPress={() => setModalHorario(true)}
        >
          <Text style={styles.filterLabel}>🕐 Horario</Text>
          <Text style={[styles.filterButtonText, (filtros.horaInicio || filtros.horaFin) && styles.filterButtonTextActive]}>
            {formatearRangoHoras()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selectores de Cancha y Grupo */}
      <View style={styles.filtersRow}>
        {/* Selector de Cancha */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setModalCancha(true)}
          disabled={loading}
        >
          <Text style={styles.filterLabel}>🏟️ Cancha</Text>
          <Text style={[styles.filterButtonText, filtros.canchaId && styles.filterButtonTextActive]}>
            {getNombreCancha()}
          </Text>
        </TouchableOpacity>

        {/* Selector de Grupo */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setModalGrupo(true)}
          disabled={loading}
        >
          <Text style={styles.filterLabel}>👥 Grupo</Text>
          <Text style={[styles.filterButtonText, filtros.grupoId && styles.filterButtonTextActive]}>
           {getNombreGrupo()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={filtros.fecha || new Date()}
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
              ? (filtros.horaInicio || new Date())
              : (filtros.horaFin || new Date())
          }
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          locale="es-ES"
          minuteInterval={30}
        />
      )}

      {/* Modal para seleccionar Horario */}
      <Modal
        visible={modalHorario}
        transparent
        animationType="slide"
        onRequestClose={() => setModalHorario(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setModalHorario(false)}
        >
          <TouchableOpacity 
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Seleccionar Horario</Text>
            
            <View style={styles.horarioContainer}>
              {/* Hora Inicio */}
              <View style={styles.horarioItem}>
                <Text style={styles.horarioLabel}>🕐 Hora Inicio</Text>
                <TouchableOpacity
                  style={styles.horarioButton}
                  onPress={() => {
                    setTimePickerMode('start');
                    setShowTimePicker(true);
                  }}
                >
                  <Text style={styles.horarioButtonText}>
                    {formatearHora(filtros.horaInicio)}
                  </Text>
                </TouchableOpacity>
                {filtros.horaInicio && (
                  <TouchableOpacity
                    onPress={() => handleFiltroChange('horaInicio', null)}
                    style={styles.clearHoraButton}
                  >
                    <Text style={styles.clearHoraText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Hora Fin */}
              <View style={styles.horarioItem}>
                <Text style={styles.horarioLabel}>🕐 Hora Fin</Text>
                <TouchableOpacity
                  style={styles.horarioButton}
                  onPress={() => {
                    setTimePickerMode('end');
                    setShowTimePicker(true);
                  }}
                >
                  <Text style={styles.horarioButtonText}>
                    {formatearHora(filtros.horaFin)}
                  </Text>
                </TouchableOpacity>
                {filtros.horaFin && (
                  <TouchableOpacity
                    onPress={() => handleFiltroChange('horaFin', null)}
                    style={styles.clearHoraButton}
                  >
                    <Text style={styles.clearHoraText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalHorario(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalApplyButton]}
                onPress={() => setModalHorario(false)}
              >
                <Text style={styles.modalApplyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal para seleccionar Cancha */}
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
              {/* Opción "Todas" */}
              <TouchableOpacity
                style={[styles.modalItem, !filtros.canchaId && styles.modalItemSelected]}
                onPress={() => {
                  handleFiltroChange('canchaId', null);
                  setModalCancha(false);
                }}
              >
                <Text style={styles.modalItemText}>Todas las canchas</Text>
              </TouchableOpacity>

              {canchas.map(cancha => (
                <TouchableOpacity
                  key={cancha.id}
                  style={[styles.modalItem, filtros.canchaId === cancha.id && styles.modalItemSelected]}
                  onPress={() => {
                    handleFiltroChange('canchaId', cancha.id);
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

      {/* Modal para seleccionar Grupo */}
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
              {/* Opción "Todos" */}
              <TouchableOpacity
                style={[styles.modalItem, !filtros.grupoId && styles.modalItemSelected]}
                onPress={() => {
                  handleFiltroChange('grupoId', null);
                  setModalGrupo(false);
                }}
              >
                <Text style={styles.modalItemText}>Todos los grupos</Text>
              </TouchableOpacity>

              {grupos.map(grupo => (
                <TouchableOpacity
                  key={grupo.id}
                  style={[styles.modalItem, filtros.grupoId === grupo.id && styles.modalItemSelected]}
                  onPress={() => {
                    handleFiltroChange('grupoId', grupo.id);
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

      {/* Indicador de filtros activos */}
      {hayFiltros && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Filtros activos: {[
              filtros.q && 'búsqueda',
              filtros.fecha && 'fecha',
              filtros.horaInicio && 'hora inicio',
              filtros.horaFin && 'hora fin',
              filtros.canchaId && 'cancha',
              filtros.grupoId && 'grupo'
            ].filter(Boolean).join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#333',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonWide: {
    flex: 1.5,
  },
  filterLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#1976d2',
    fontWeight: '600',
  },
  activeFiltersContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  activeFiltersText: {
    fontSize: 12,
    color: '#1976d2',
    textAlign: 'center',
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
    color: '#333',
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
    fontSize: 16,
    fontWeight: '600',
  },
  horarioContainer: {
    marginBottom: 20,
  },
  horarioItem: {
    marginBottom: 15,
  },
  horarioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  horarioButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  horarioButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  clearHoraButton: {
    position: 'absolute',
    right: 10,
    top: 40,
    backgroundColor: '#f44336',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearHoraText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#e0e0e0',
  },
  modalApplyButton: {
    backgroundColor: '#1976d2',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalApplyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SesionesFilterBar;