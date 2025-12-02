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
  ScrollView,
  StatusBar
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { obtenerGrupoPorId } from '../services/grupoServices';
import { 
  obtenerSesionPorId, 
  obtenerSesiones, 
  eliminarSesion 
} from '../services/sesionServices';
import { 
  obtenerJugadorPorId, 
  removerJugadorDeGrupo, 
  asignarJugadorAGrupo, 
  obtenerJugadores 
} from '../services/jugadorServices';
import { obtenerCanchas } from '../services/canchaServices';

export default function GrupoMiembrosScreen({ route, navigation }) {
  const { grupoId } = route.params;
  const isFocused = useIsFocused();

  // Estado base
  const [grupo, setGrupo] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pestañas
  const [tabActiva, setTabActiva] = useState('miembros');

  // Filtros miembros
  const [busqueda, setBusqueda] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Paginación miembros
  const [currentPageMiembros, setCurrentPageMiembros] = useState(1);
  const pageSizeMiembros = 10;

  // Entrenamientos/Sesiones
  const [sesiones, setSesiones] = useState([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const [busquedaEntrenamiento, setBusquedaEntrenamiento] = useState('');
  const [filtroCancha, setFiltroCancha] = useState(null);
    const [filtrosEntrenamientos, setFiltrosEntrenamientos] = useState({    q: '', canchaId: null });
  const [canchasOpts, setCanchasOpts] = useState([]);
  const [currentPageSesiones, setCurrentPageSesiones] = useState(1);
  const [totalSesiones, setTotalSesiones] = useState(0);
  const pageSizeSesiones = 10;

  // Modal agregar miembros
  const [modalAgregar, setModalAgregar] = useState(false);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [agregando, setAgregando] = useState(false);

  // Modal detalle sesión
  const [modalDetalleSesion, setModalDetalleSesion] = useState(false);
  const [sesionDetalle, setSesionDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Modal detalle jugador
  const [modalDetalleJugador, setModalDetalleJugador] = useState(false);
  const [jugadorDetalle, setJugadorDetalle] = useState(null);
  const [loadingJugadorDetalle, setLoadingJugadorDetalle] = useState(false);

  // Modal filtros (entrenamientos)
  const [modalFiltros, setModalFiltros] = useState(false);

  // Guards
  const mountedRef = useRef(true);
  const requestIdGrupoRef = useRef(0);
  const requestIdSesionesRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Cargar canchas
  useEffect(() => {
    (async () => {
      try {
        const r = await obtenerCanchas({ limit: 200 });
        const lista = r?.canchas || r?.data?.canchas || [];
        setCanchasOpts(lista);
      } catch (e) {
        console.warn('No se pudieron cargar canchas', e);
      }
    })();
  }, []);

  // Cargar grupo y miembros
  useEffect(() => {
    if (isFocused) {
      cargarDatos();
    }
  }, [isFocused, grupoId]);

  // Debounce búsqueda miembros
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(busqueda.trim()), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Debounce búsqueda entrenamientos
  useEffect(() => {
    const t = setTimeout(() => {
      setFiltrosEntrenamientos(prev => ({ ...prev, q: busquedaEntrenamiento.trim() }));
    }, 500);
    return () => clearTimeout(t);
  }, [busquedaEntrenamiento]);

  // Cargar sesiones cuando cambia tab, filtros o página
  useEffect(() => {
    if (tabActiva === 'entrenamientos') {
      cargarSesiones(1);
      setCurrentPageSesiones(1);
    }
  }, [tabActiva, filtrosEntrenamientos]);

  const cargarDatos = async () => {
    const reqId = ++requestIdGrupoRef.current;
    try {
      setLoading(true);
      const grupoData = await obtenerGrupoPorId(grupoId);
      if (reqId !== requestIdGrupoRef.current || !mountedRef.current) return;

      setGrupo(grupoData);

      const miembrosData = (grupoData.jugadorGrupos || []).map(jg => ({
        id: jg.jugador?.id,
        jugadorGrupoId: jg.id,
        nombre: jg.jugador?.usuario?.nombre || 'Sin nombre',
        rut: jg.jugador?.usuario?.rut || 'Sin RUT',
        email: jg.jugador?.usuario?.email || '—',
        carrera: jg.jugador?.usuario?.carrera?.nombre || '—',
        telefono: jg.jugador?.telefono || '—',
        anioIngreso: jg.jugador?.anioIngreso || '—',
        estado: jg.jugador?.estado || 'activo',
        fechaNacimiento: jg.jugador?.fechaNacimiento,
        fechaAsignacion: jg.fechaAsignacion,
      }));

      setMiembros(miembrosData);
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'Error al cargar los datos del grupo');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const cargarSesiones = async (page = 1) => {
    const reqId = ++requestIdSesionesRef.current;
    try {
      setLoadingSesiones(true);

      const qParam = filtrosEntrenamientos.q || '';
      const canchaIdParam = filtrosEntrenamientos.canchaId ? Number(filtrosEntrenamientos.canchaId) : undefined;

      const data = await obtenerSesiones({
        grupoId,
        page,
        limit: pageSizeSesiones,
        ...(qParam ? { q: qParam } : {}),
        ...(canchaIdParam ? { canchaId: canchaIdParam } : {}),
      });

      if (reqId !== requestIdSesionesRef.current || !mountedRef.current) return;

      const sesionesData = data?.sesiones || data?.data?.sesiones || [];
      const paginationData = data?.pagination || data?.data?.pagination || {};

      // Filtro local adicional
      const q = qParam.toLowerCase();
      let filtradas = sesionesData;
      if (q || canchaIdParam) {
        filtradas = sesionesData.filter((s) => {
          const canchaNom = String(s?.cancha?.nombre ?? '').toLowerCase();
          const ubicacion = String(s?.ubicacionExterna ?? '').toLowerCase();
          const tipoSesion = String(s?.tipoSesion ?? '').toLowerCase();

          const okCancha = canchaIdParam ? Number(s?.cancha?.id) === Number(canchaIdParam) : true;
          const okQ = q ? canchaNom.includes(q) || ubicacion.includes(q) || tipoSesion.includes(q) : true;

          return okCancha && okQ;
        });
      }

      setSesiones(filtradas);
      setTotalSesiones(paginationData.totalItems || filtradas.length);
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error cargando sesiones:', error);
      Alert.alert('Error', 'Error al cargar los entrenamientos');
    } finally {
      if (mountedRef.current) setLoadingSesiones(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (tabActiva === 'miembros') {
      cargarDatos();
    } else {
      cargarSesiones(currentPageSesiones);
    }
    setRefreshing(false);
  };

  // Filtrar y paginar miembros
  const miembrosFiltrados = miembros.filter(m => {
    const matchBusqueda = qDebounced
      ? (m.nombre || '').toLowerCase().includes(qDebounced.toLowerCase()) ||
        (m.rut || '').toLowerCase().includes(qDebounced.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(qDebounced.toLowerCase()) ||
        (m.carrera || '').toLowerCase().includes(qDebounced.toLowerCase())
      : true;

    const matchEstado = filtroEstado !== 'todos' ? m.estado === filtroEstado : true;

    return matchBusqueda && matchEstado;
  });

  const miembrosPaginados = miembrosFiltrados.slice(
    (currentPageMiembros - 1) * pageSizeMiembros,
    currentPageMiembros * pageSizeMiembros
  );

  const totalPagesMiembros = Math.ceil(miembrosFiltrados.length / pageSizeMiembros);

  const limpiarFiltrosEntrenamientos = () => {
    setBusquedaEntrenamiento('');
    setFiltrosEntrenamientos({ q: '', canchaId: null });
    setCurrentPageSesiones(1);
  };

  const hayFiltrosEntrenamientos = !!(filtrosEntrenamientos.q || filtrosEntrenamientos.canchaId);

  const getNombreCancha = () => {
    const cancha = canchasOpts.find(c => c.id === filtrosEntrenamientos.canchaId);
    return cancha ? cancha.nombre : 'Todas';
  };
  const handleRemoverMiembro = (jugadorId, nombre) => {
    Alert.alert(
      '¿Remover del grupo?',
      `Se removerá a ${nombre} de este grupo`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerJugadorDeGrupo(jugadorId, grupoId);
              Alert.alert('Éxito', 'Jugador removido del grupo correctamente');
              cargarDatos();
            } catch (error) {
              console.error('Error removiendo miembro:', error);
              Alert.alert('Error', error.response?.data?.message || 'Error al remover miembro');
            }
          }
        }
      ]
    );
  };

  const handleAgregarMiembro = async () => {
    try {
      const todos = await obtenerJugadores({ limit: 1000 });
      const lista = todos.jugadores || todos?.data?.jugadores || [];
      const idsGrupo = new Set(miembros.map(m => m.id));
      setJugadoresDisponibles(lista.filter(j => !idsGrupo.has(j.id)));
      setModalAgregar(true);
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      Alert.alert('Error', 'Error al cargar jugadores disponibles');
    }
  };

  const handleConfirmarAgregar = async () => {
    if (!jugadorSeleccionado) {
      Alert.alert('Atención', 'Seleccione un jugador');
      return;
    }
    try {
      setAgregando(true);
      await asignarJugadorAGrupo(jugadorSeleccionado, grupoId);
      Alert.alert('Éxito', 'Jugador agregado al grupo correctamente');
      setModalAgregar(false);
      setJugadorSeleccionado(null);
      cargarDatos();
    } catch (error) {
      console.error('Error agregando jugador:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al agregar al grupo');
    } finally {
      setAgregando(false);
    }
  };

  const handleVerDetalleSesion = async (sesionId) => {
    try {
      setLoadingDetalle(true);
      setModalDetalleSesion(true);
      const detalle = await obtenerSesionPorId(sesionId);
      setSesionDetalle(detalle);
    } catch (error) {
      console.error('Error cargando detalle de sesión:', error);
      Alert.alert('Error', 'Error al cargar el detalle de la sesión');
      setModalDetalleSesion(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleVerDetalleJugador = async (jugadorId) => {
    try {
      setLoadingJugadorDetalle(true);
      setModalDetalleJugador(true);
      const jugador = await obtenerJugadorPorId(jugadorId);
      setJugadorDetalle(jugador);
    } catch (error) {
      console.error('Error cargando detalle del jugador:', error);
      Alert.alert('Error', 'Error al cargar el detalle del jugador');
      setModalDetalleJugador(false);
    } finally {
      setLoadingJugadorDetalle(false);
    }
  };

  const handleEliminarSesion = (sesionId, fecha) => {
    Alert.alert(
      '¿Eliminar entrenamiento?',
      `Se eliminará el entrenamiento del ${fecha}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarSesion(sesionId);
              Alert.alert('Éxito', 'Entrenamiento eliminado correctamente');
              cargarSesiones(currentPageSesiones);
            } catch (error) {
              console.error('Error eliminando sesión:', error);
              Alert.alert('Error', error.response?.data?.message || 'Error al eliminar entrenamiento');
            }
          }
        }
      ]
    );
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CL');
  };

  const formatearHora = (hora) => {
    if (!hora) return '—';
    return hora.substring(0, 5);
  };

  // Render Miembro
  const renderMiembro = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.nombre.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.nombreText}>{item.nombre}</Text>
          <Text style={styles.rutText}>{item.rut}</Text>
        </View>
        <View style={styles.estadoBadge}>
          <Text style={[
            styles.estadoText,
            item.estado === 'activo' ? styles.estadoActivo : styles.estadoInactivo
          ]}>
            {(item.estado || '—').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.detalles}>
        <Text style={styles.detalleItem}>📧 {item.email}</Text>
        <Text style={styles.detalleItem}>🎓 {item.carrera}</Text>
        <Text style={styles.detalleItem}>📱 {item.telefono}</Text>
        <Text style={styles.detalleItem}>📅 Año ingreso: {item.anioIngreso}</Text>
      </View>

      <View style={styles.acciones}>
        <TouchableOpacity
          style={styles.verPerfilButton}
          onPress={() => handleVerDetalleJugador(item.id)}
        >
          <Text style={styles.verPerfilButtonText}>👤 Ver Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removerButton}
          onPress={() => handleRemoverMiembro(item.id, item.nombre)}
        >
          <Text style={styles.removerButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Sesión
  const renderSesion = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.sesionHeader}>
        <View>
          <Text style={styles.fechaText}>📅 {formatearFecha(item.fecha)}</Text>
          <Text style={styles.horarioText}>
            ⏰ {formatearHora(item.horaInicio)} - {formatearHora(item.horaFin)}
          </Text>
        </View>
        <View style={styles.tipoBadge}>
          <Text style={styles.tipoText}>{item.tipoSesion || '—'}</Text>
        </View>
      </View>

      <Text style={styles.lugarText}>
        📍 {item.ubicacionExterna || item.cancha?.nombre || 'Sin cancha'}
      </Text>

      <View style={styles.acciones}>
        <TouchableOpacity
          style={styles.verDetalleButton}
          onPress={() => handleVerDetalleSesion(item.id)}
        >
          <Text style={styles.verDetalleButtonText}>📋 Ver Detalle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.eliminarButton}
          onPress={() => handleEliminarSesion(item.id, formatearFecha(item.fecha))}
        >
          <Text style={styles.eliminarButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#014898" />
        <Text style={styles.loadingText}>Cargando datos del grupo...</Text>
      </View>
    );
  }

  if (!grupo) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyText}>Grupo no encontrado</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#014898" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{grupo.nombre}</Text>
          {grupo.descripcion && (
            <Text style={styles.headerSubtitle}>{grupo.descripcion}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={
            tabActiva === 'miembros'
              ? handleAgregarMiembro
              : () => navigation.navigate('CrearSesion', { grupoId })
          }
        >
          <Text style={styles.addButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tabActiva === 'miembros' && styles.tabActiva]}
          onPress={() => {
            setTabActiva('miembros');
            setCurrentPageMiembros(1);
          }}
        >
          <Text style={[
            styles.tabText,
            tabActiva === 'miembros' && styles.tabTextActiva
          ]}>
            👥 Miembros ({miembros.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tabActiva === 'entrenamientos' && styles.tabActiva]}
          onPress={() => {
            setTabActiva('entrenamientos');
            setCurrentPageSesiones(1);
            cargarSesiones(1);
          }}
        >
          <Text style={[
            styles.tabText,
            tabActiva === 'entrenamientos' && styles.tabTextActiva
          ]}>
            📅 Entrenamientos ({totalSesiones})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según pestaña */}
      {tabActiva === 'miembros' ? (
        <View style={styles.content}>
          {/* Filtros Miembros */}
          <View style={styles.filtrosContainer}>
            <TextInput
              style={styles.searchInput}
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar por nombre, RUT, email..."
              placeholderTextColor="#999"
            />

            <View style={styles.filtroEstadoContainer}>
              <TouchableOpacity
                style={[styles.filtroChip, filtroEstado === 'todos' && styles.filtroChipActivo]}
                onPress={() => setFiltroEstado('todos')}
              >
                <Text style={[
                  styles.filtroChipText,
                  filtroEstado === 'todos' && styles.filtroChipTextActivo
                ]}>
                  Todos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filtroChip, filtroEstado === 'activo' && styles.filtroChipActivo]}
                onPress={() => setFiltroEstado('activo')}
              >
                <Text style={[
                  styles.filtroChipText,
                  filtroEstado === 'activo' && styles.filtroChipTextActivo
                ]}>
                  Activos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filtroChip, filtroEstado === 'inactivo' && styles.filtroChipActivo]}
                onPress={() => setFiltroEstado('inactivo')}
              >
                <Text style={[
                  styles.filtroChipText,
                  filtroEstado === 'inactivo' && styles.filtroChipTextActivo
                ]}>
                  Inactivos
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista Miembros */}
          <FlatList
            data={miembrosPaginados}
            renderItem={renderMiembro}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListIcon}>👥</Text>
                <Text style={styles.emptyListText}>No hay miembros en este grupo</Text>
                <TouchableOpacity
                  style={styles.addFirstButton}
                  onPress={handleAgregarMiembro}
                >
                  <Text style={styles.addFirstButtonText}>Agregar Miembros</Text>
                </TouchableOpacity>
              </View>
            }
          />

          {/* Paginación Miembros */}
          {totalPagesMiembros > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={currentPageMiembros === 1}
                onPress={() => setCurrentPageMiembros(p => p - 1)}
                style={[styles.pageButton, currentPageMiembros === 1 && styles.pageButtonDisabled]}
              >
                <Text style={styles.pageButtonText}>←</Text>
              </TouchableOpacity>

              <Text style={styles.pageInfo}>
                Página {currentPageMiembros} de {totalPagesMiembros}
              </Text>

              <TouchableOpacity
                disabled={currentPageMiembros === totalPagesMiembros}
                onPress={() => setCurrentPageMiembros(p => p + 1)}
                style={[
                  styles.pageButton,
                  currentPageMiembros === totalPagesMiembros && styles.pageButtonDisabled
                ]}
              >
                <Text style={styles.pageButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          {/* Filtros Entrenamientos */}
          <View style={styles.filtrosContainer}>
            <View style={styles.filtrosHeader}>
              <Text style={styles.filtrosTitle}>🔍 Filtros</Text>
              {hayFiltrosEntrenamientos && (
                <TouchableOpacity
                  onPress={limpiarFiltrosEntrenamientos}
                  style={styles.limpiarFiltrosButton}
                >
                  <Text style={styles.limpiarFiltrosText}>Limpiar</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.searchInput}
              value={busquedaEntrenamiento}
              onChangeText={setBusquedaEntrenamiento}
              placeholder="Buscar por lugar o tipo..."
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.filtroButton}
              onPress={() => setModalFiltros(true)}
            >
              <Text style={styles.filtroLabel}>🏟️ Cancha</Text>
              <Text style={[
                styles.filtroValue,
                filtrosEntrenamientos.canchaId && styles.filtroValueActive
              ]}>
                {getNombreCancha()}
              </Text>
            </TouchableOpacity>

            {hayFiltrosEntrenamientos && (
              <View style={styles.activeFiltersContainer}>
                <Text style={styles.activeFiltersText}>
                  Filtros activos: {[
                    filtrosEntrenamientos.q && 'búsqueda',
                    filtrosEntrenamientos.canchaId && 'cancha'
                  ].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
          </View>

          {/* Lista Entrenamientos */}
          <FlatList
            data={sesiones}
            renderItem={renderSesion}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={loadingSesiones}
                onRefresh={() => cargarSesiones(currentPageSesiones)}
              />
            }
            ListEmptyComponent={
              loadingSesiones ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#014898" />
                </View>
              ) : (
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListIcon}>📅</Text>
                  <Text style={styles.emptyListText}>No hay entrenamientos programados</Text>
                  <TouchableOpacity
                    style={styles.addFirstButton}
                    onPress={() => navigation.navigate('CrearSesion', { grupoId })}
                  >
                    <Text style={styles.addFirstButtonText}>Crear Primer Entrenamiento</Text>
                  </TouchableOpacity>
                </View>
              )
            }
          />

          {/* Paginación Entrenamientos */}
          {Math.ceil(totalSesiones / pageSizeSesiones) > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={currentPageSesiones === 1}
                onPress={() => setCurrentPageSesiones(p => p - 1)}
                style={[styles.pageButton, currentPageSesiones === 1 && styles.pageButtonDisabled]}
              >
                <Text style={styles.pageButtonText}>←</Text>
              </TouchableOpacity>

              <Text style={styles.pageInfo}>
                Página {currentPageSesiones} de {Math.ceil(totalSesiones / pageSizeSesiones)}
              </Text>

              <TouchableOpacity
                disabled={currentPageSesiones === Math.ceil(totalSesiones / pageSizeSesiones)}
                onPress={() => setCurrentPageSesiones(p => p + 1)}
                style={[
                  styles.pageButton,
                  currentPageSesiones === Math.ceil(totalSesiones / pageSizeSesiones) && styles.pageButtonDisabled
                ]}
              >
                <Text style={styles.pageButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Modal Agregar Miembro */}
      <Modal
        visible={modalAgregar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalAgregar(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalAgregar(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Agregar Jugador al Grupo</Text>

            <Text style={styles.modalInfo}>Grupo: {grupo?.nombre}</Text>

            <ScrollView style={styles.jugadoresList}>
              {jugadoresDisponibles.length === 0 ? (
                <Text style={styles.noDisponiblesText}>
                  No hay jugadores disponibles
                </Text>
              ) : (
                jugadoresDisponibles.map(j => (
                  <TouchableOpacity
                    key={j.id}
                    style={[
                      styles.jugadorItem,
                      jugadorSeleccionado === j.id && styles.jugadorItemSeleccionado
                    ]}
                    onPress={() => setJugadorSeleccionado(j.id)}
                  >
                    <Text style={styles.jugadorNombre}>
                      {j.usuario?.nombre || 'Sin nombre'}
                    </Text>
                    <Text style={styles.jugadorInfo}>
                      {j.usuario?.rut || 'Sin RUT'} - {j.usuario?.carrera?.nombre || 'Sin carrera'}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalAgregar(false);
                  setJugadorSeleccionado(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, (!jugadorSeleccionado || agregando) && styles.submitButtonDisabled]}
                onPress={handleConfirmarAgregar}
                disabled={!jugadorSeleccionado || agregando}
              >
                {agregando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Agregar</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal Filtros Entrenamientos */}
      <Modal
        visible={modalFiltros}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalFiltros(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalFiltros(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Filtros de Entrenamientos</Text>

            <Text style={styles.labelText}>Filtrar por cancha:</Text>
            <ScrollView style={styles.canchasList}>
              <TouchableOpacity
                style={[
                  styles.canchaItem,
                  !filtrosEntrenamientos.canchaId && styles.canchaItemSeleccionado
                ]}
                onPress={() => {
                  setFiltrosEntrenamientos(prev => ({ ...prev, canchaId: null }));
                }}
              >
                <Text style={styles.canchaNombre}>Todas las canchas</Text>
              </TouchableOpacity>

              {canchasOpts.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.canchaItem,
                    filtrosEntrenamientos.canchaId === c.id && styles.canchaItemSeleccionado
                  ]}
                  onPress={() => {
                    setFiltrosEntrenamientos(prev => ({ ...prev, canchaId: c.id }));
                  }}
                >
                  <Text style={styles.canchaNombre}>{c.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setFiltrosEntrenamientos(prev => ({ ...prev, canchaId: null }));
                }}
              >
                <Text style={styles.cancelButtonText}>Limpiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => setModalFiltros(false)}
              >
                <Text style={styles.submitButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal Detalle Sesión */}
      <Modal
        visible={modalDetalleSesion}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalDetalleSesion(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalDetalleSesion(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Detalle del Entrenamiento</Text>

            {loadingDetalle ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#014898" />
              </View>
            ) : sesionDetalle ? (
              <ScrollView style={styles.detalleScroll}>
                <View style={styles.detalleItem}>
                  <Text style={styles.detalleLabel}>📅 Fecha:</Text>
                  <Text style={styles.detalleValue}>{formatearFecha(sesionDetalle.fecha)}</Text>
                </View>

                <View style={styles.detalleItem}>
                  <Text style={styles.detalleLabel}>⏰ Horario:</Text>
                  <Text style={styles.detalleValue}>
                    {formatearHora(sesionDetalle.horaInicio)} - {formatearHora(sesionDetalle.horaFin)}
                  </Text>
                </View>

                <View style={styles.detalleItem}>
                  <Text style={styles.detalleLabel}>🏷️ Tipo:</Text>
                  <Text style={styles.detalleValue}>{sesionDetalle.tipoSesion || '—'}</Text>
                </View>

                <View style={styles.detalleItem}>
                  <Text style={styles.detalleLabel}>📍 Lugar:</Text>
                  <Text style={styles.detalleValue}>
                    {sesionDetalle.ubicacionExterna || sesionDetalle.cancha?.nombre || 'Sin cancha'}
                  </Text>
                </View>

                {sesionDetalle.objetivos && (
                  <View style={styles.detalleItem}>
                    <Text style={styles.detalleLabel}>🎯 Objetivos:</Text>
                    <Text style={styles.detalleValue}>{sesionDetalle.objetivos}</Text>
                  </View>
                )}

                {sesionDetalle.descripcion && (
                  <View style={styles.detalleItem}>
                    <Text style={styles.detalleLabel}>📝 Descripción:</Text>
                    <Text style={styles.detalleValue}>{sesionDetalle.descripcion}</Text>
                  </View>
                )}

                {sesionDetalle.duracionMinutos && (
                  <View style={styles.detalleItem}>
                    <Text style={styles.detalleLabel}>⏱️ Duración:</Text>
                    <Text style={styles.detalleValue}>{sesionDetalle.duracionMinutos} minutos</Text>
                  </View>
                )}
              </ScrollView>
            ) : null}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalDetalleSesion(false);
                setSesionDetalle(null);
              }}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal Detalle Jugador */}
      <Modal
        visible={modalDetalleJugador}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalDetalleJugador(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalDetalleJugador(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Perfil del Jugador</Text>

            {loadingJugadorDetalle ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#014898" />
              </View>
            ) : jugadorDetalle ? (
              <ScrollView style={styles.detalleScroll}>
                <View style={styles.perfilHeader}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarLargeText}>
                      {(jugadorDetalle.usuario?.nombre || 'J').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.perfilNombre}>
                    {jugadorDetalle.usuario?.nombre || 'Sin nombre'}
                  </Text>
                </View>

                <View style={styles.detalleItem}>
                  <Text style={styles.detalleLabel}>🆔 RUT:</Text>
                  <Text style={styles.detalleValue}>{jugadorDetalle.usuario?.rut || '—'}</Text>
                </View>

                <View style={styles.detalleItem}>
                  <Text style={styles.detalleLabel}>📧 Email:</Text>
                  <Text style={styles.detalleValue}>{jugadorDetalle.usuario?.email || '—'}</Text>
                </View>

                <View style={styles.detalleItem}>
                  <Text style={styles.detalleLabel}>📱 Teléfono:</Text>
                  <Text style={styles.detalleValue}>{jugadorDetalle.telefono || '—'}</Text>
                </View>

                <View style={styles.detalleItem}>
                  <Text style={styles.detalleLabel}>🎓 Carrera:</Text>
                  <Text style={styles.detalleValue}>
                    {jugadorDetalle.usuario?.carrera?.nombre || '—'}
                  </Text>
                </View>

                <View style={styles.detalleItem}>
                  <Text style={styles.detalleLabel}>📅 Año Ingreso:</Text>
                  <Text style={styles.detalleValue}>{jugadorDetalle.anioIngreso || '—'}</Text>
                </View>

                <View style={styles.detalleItem}>
                  <Text style={styles.detalleLabel}>🎂 Fecha Nacimiento:</Text>
                  <Text style={styles.detalleValue}>
                    {formatearFecha(jugadorDetalle.fechaNacimiento)}
                  </Text>
                </View>

                <View style={styles.detalleItem}>
                  <Text style={styles.detalleLabel}>📊 Estado:</Text>
                  <Text style={[
                    styles.detalleValue,
                    jugadorDetalle.estado === 'activo' ? styles.estadoActivoText : styles.estadoInactivoText
                  ]}>
                    {(jugadorDetalle.estado || '—').toUpperCase()}
                  </Text>
                </View>
              </ScrollView>
            ) : null}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalDetalleJugador(false);
                setJugadorDetalle(null);
              }}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#014898',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#014898',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    marginRight: 12,
  },
  backIconText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActiva: {
    borderBottomColor: '#014898',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActiva: {
    color: '#014898',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  filtrosContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtrosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filtrosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  limpiarFiltrosButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  limpiarFiltrosText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  filtroButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  filtroLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  filtroValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filtroValueActive: {
    color: '#014898',
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  activeFiltersText: {
    fontSize: 12,
    color: '#014898',
    textAlign: 'center',
  },
  filtroEstadoContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filtroChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filtroChipActivo: {
    backgroundColor: '#014898',
    borderColor: '#014898',
  },
  filtroChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filtroChipTextActivo: {
    color: '#fff',
  },
  filtrosButton: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  filtrosButtonText: {
    color: '#014898',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
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
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#014898',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    flex: 1,
  },
  nombreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rutText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f0f2f5',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  estadoActivo: {
    color: '#52c41a',
  },
  estadoInactivo: {
    color: '#999',
  },
  detalles: {
    marginBottom: 12,
  },
  detalleItem: {
    marginBottom: 8,
  },
  detalleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detalleValue: {
    fontSize: 14,
    color: '#333',
  },
  acciones: {
    flexDirection: 'row',
    gap: 8,
  },
  verPerfilButton: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  verPerfilButtonText: {
    color: '#014898',
    fontSize: 13,
    fontWeight: '600',
  },
  removerButton: {
    backgroundColor: '#fff1f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  removerButtonText: {
    fontSize: 16,
  },
  sesionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fechaText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  horarioText: {
    fontSize: 13,
    color: '#666',
  },
  tipoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
  },
  tipoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#014898',
  },
  lugarText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
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
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyListIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyListText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  addFirstButton: {
    backgroundColor: '#014898',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 15,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#014898',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  pageButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
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
  modalInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  jugadoresList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  jugadorItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  jugadorItemSeleccionado: {
    backgroundColor: '#e3f2fd',
    borderColor: '#014898',
  },
  jugadorNombre: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  jugadorInfo: {
    fontSize: 13,
    color: '#666',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  canchasList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  canchaItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  canchaItemSeleccionado: {
    backgroundColor: '#e3f2fd',
    borderColor: '#014898',
  },
  canchaNombre: {
    fontSize: 14,
    color: '#333',
  },
  noDisponiblesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  canchasList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  canchaItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  canchaItemSeleccionado: {
    backgroundColor: '#e3f2fd',
    borderColor: '#014898',
  },
  canchaNombre: {
    fontSize: 14,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
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
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  detalleScroll: {
    maxHeight: 400,
  },
  closeButton: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  perfilHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#014898',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  perfilNombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  estadoActivoText: {
    color: '#52c41a',
    fontWeight: 'bold',
  },
  estadoInactivoText: {
    color: '#ff4d4f',
    fontWeight: 'bold',
  },
});