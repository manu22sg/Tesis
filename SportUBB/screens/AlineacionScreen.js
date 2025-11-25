// screens/AlineacionScreen.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import CampoAlineacionMobile from "../components/CampoAlineacionMobile";

import { useRoute, useNavigation } from "@react-navigation/native";
import {
  crearAlineacion,
  obtenerAlineacionPorSesion,
  agregarJugadorAlineacion,
  actualizarJugadorAlineacion,
  quitarJugadorAlineacion,
  eliminarAlineacion,
  actualizarPosicionesJugadores,
  generarAlineacionInteligente,
  obtenerFormacionesDisponibles,
  exportarAlineacionExcel,
  exportarAlineacionPDF,
} from "../services/alineacionServices";

import { obtenerJugadores } from "../services/jugadorServices";
import { obtenerSesionPorId } from "../services/sesionServices";

// COMPONENTES MODALES (vacíos ahora)
import ModalAlineacionInteligente from "../components/ModalAlineacionInteligente.jsx";
import ModalEditarJugador from "../components/ModalEditarJugadorRn.jsx";
import ModalAgregarJugador from "../components/ModalAgregarJugadorRn.jsx";

export default function AlineacionScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { sesionId } = route.params;

  const [loading, setLoading] = useState(true);
  const [sesionInfo, setSesionInfo] = useState(null);
  const [alineacion, setAlineacion] = useState(null);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);

  // modales
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [jugadorEditando, setJugadorEditando] = useState(null);

  const [modalInteligenteVisible, setModalInteligenteVisible] = useState(false);

  // --- CARGA INICIAL ---
  useEffect(() => {
    cargarSesion();
    cargarAlineacion();
  }, [sesionId]);

  useEffect(() => {
    if (sesionInfo) cargarJugadores();
  }, [sesionInfo]);

  const cargarSesion = async () => {
    try {
      const data = await obtenerSesionPorId(Number(sesionId));
      setSesionInfo(data);
    } catch (err) {
      Alert.alert("Error", "No se pudo cargar la sesión.");
    }
  };

  const cargarAlineacion = async () => {
    try {
      const res = await obtenerAlineacionPorSesion(Number(sesionId));
      setAlineacion(res.data);
    } catch (err) {
      setAlineacion(null);
    } finally {
      setLoading(false);
    }
  };
  const jugadoresEnAlineacion = alineacion?.jugadores?.map(j => j.jugadorId) ?? [];

// 🔥 Filtrar solo jugadores del grupo y que NO estén ya en la alineación
const jugadoresFiltrados = jugadoresDisponibles.filter(
  (j) =>
    j.jugadorGrupos?.some((g) => g.grupoId === sesionInfo?.grupo?.id) &&
    !jugadoresEnAlineacion.includes(j.id)
);


  const cargarJugadores = async () => {
    try {
      const data = await obtenerJugadores({
        limit: 100,
        grupoId: sesionInfo?.grupo?.id,
      });

      setJugadoresDisponibles(data.jugadores ?? []);
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar los jugadores.");
    }
  };

  // --- CREAR ---
  const handleCrearAlineacion = async () => {
    setLoading(true);
    try {
      await crearAlineacion({
        sesionId: Number(sesionId),
        generadaAuto: false,
        jugadores: [],
      });
      await cargarAlineacion();
    } catch (err) {
      Alert.alert("Error", "No se pudo crear la alineación.");
    } finally {
      setLoading(false);
    }
  };
 

  // --- AGREGAR ---
  const handleAgregarJugador = async (values) => {

    try {

      await agregarJugadorAlineacion({
        alineacionId: alineacion.id,
        ...values,
      });
      await cargarAlineacion();
      setModalAgregarVisible(false);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Error al agregar.");
    }
  };

  // --- EDITAR ---
  const handleEditarJugador = async (values) => {
    try {
      await actualizarJugadorAlineacion({
        alineacionId: alineacion.id,
        jugadorId: jugadorEditando.jugadorId,
        ...values,
      });

      await cargarAlineacion();
      setModalEditarVisible(false);
      setJugadorEditando(null);
    } catch (err) {
      Alert.alert("Error", "No se pudo actualizar.");
    }
  };

  // --- QUITAR ---
  const handleQuitarJugador = async (jugadorId) => {
    try {
      await quitarJugadorAlineacion(alineacion.id, jugadorId);
      await cargarAlineacion();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "No se pudo quitar.");
    }
  };

  // --- ELIMINAR ALINEACIÓN ---
  const handleEliminarAlineacion = () => {
    Alert.alert(
      "Eliminar Alineación",
      "¿Seguro que deseas eliminar toda la alineación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarAlineacion(alineacion.id);
              setAlineacion(null);
            } catch (err) {
              Alert.alert("Error", "No se pudo eliminar.");
            }
          },
        },
      ]
    );
  };

  // --- EXPORTAR ---
  const handleExportExcel = async () => {
    try {
      await exportarAlineacionExcel(sesionId);
      Alert.alert("Exportado", "Archivo Excel descargado.");
    } catch (err) {
      Alert.alert("Error", "No se pudo exportar Excel.");
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportarAlineacionPDF(sesionId);
      Alert.alert("Exportado", "Archivo PDF descargado.");
    } catch (err) {
      Alert.alert("Error", "No se pudo exportar PDF.");
    }
  };

  // --- UI ---
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando alineación...</Text>
      </View>
    );
  }

return (
  
      <View style={{ flex: 1 }}>
  <FlatList
    style={styles.container}
    data={alineacion ? alineacion.jugadores : []}
    keyExtractor={(item) => String(item.jugadorId)}
    ListHeaderComponent={
      <>
        {/* VOLVER */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backTxt}>← Volver</Text>
        </TouchableOpacity>

        {/* INFO SESIÓN */}
        {sesionInfo && (
          <View style={styles.sesionBox}>
            <Text style={styles.sesionTitle}>Sesión #{sesionId}</Text>
            <Text style={styles.sesionDesc}>
              Grupo: {sesionInfo?.grupo?.nombre || "Sin grupo"}
            </Text>
          </View>
        )}

        {/* SI NO HAY ALINEACIÓN */}
        {!alineacion ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No existe alineación aún.</Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleCrearAlineacion}
            >
              <Text style={styles.btnTxt}>Crear Alineación</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* BOTONES */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.secundaryBtn}
                onPress={() => setModalInteligenteVisible(true)}
                disabled={!sesionInfo?.grupo?.id}
              >
                <Text>⚡ Inteligente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secundaryBtn}
                onPress={handleExportExcel}
              >
                <Text>📄 Excel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secundaryBtn}
                onPress={handleExportPDF}
              >
                <Text>📄 PDF</Text>
              </TouchableOpacity>

              {alineacion?.jugadores?.length > 0 && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleEliminarAlineacion}
                >
                  <Text style={{ color: "white" }}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 🔥 CANCHA ALINEACIÓN MOBILE 🔥 */}
            <View style={{ marginBottom: 30 }}>
              <CampoAlineacionMobile
  jugadores={alineacion.jugadores}
  onActualizarPosiciones={async (jugadoresActualizados) => {
    try {
      await actualizarPosicionesJugadores(
        alineacion.id,
        jugadoresActualizados
      );
      await cargarAlineacion();
    } catch (err) {
      Alert.alert(
        "Error",
        "No se pudieron guardar las posiciones."
      );
    }
  }}
  onEliminarJugador={(jugadorId) => handleQuitarJugador(jugadorId)}
  onEditarJugador={(jugador) => {
    setJugadorEditando(jugador);
    setModalEditarVisible(true);
  }}
/>
            </View>

            <Text style={styles.subtitle}>Jugadores</Text>
          </>
        )}
      </>
    }
    renderItem={({ item }) =>
      alineacion ? (
        <TouchableOpacity
          style={styles.playerItem}
          onPress={() => {
            setJugadorEditando(item);
            setModalEditarVisible(true);
          }}
        >
          <Text style={styles.playerName}>
            {item.jugador?.usuario?.nombre}
          </Text>
          <Text style={styles.playerPos}>{item.posicion}</Text>

          <TouchableOpacity
            onPress={() => handleQuitarJugador(item.jugadorId)}
          >
            <Text style={{ color: "red" }}>Quitar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ) : null
    }
    ListFooterComponent={
      alineacion ? (
        <TouchableOpacity
          style={[styles.primaryBtn, { marginBottom: 30 }]}
          onPress={() => setModalAgregarVisible(true)}
        >
          <Text style={styles.btnTxt}>Agregar Jugador</Text>
        </TouchableOpacity>
      ) : null
    }
    
  />
  
<ModalAgregarJugador
  visible={modalAgregarVisible}
  onClose={() => setModalAgregarVisible(false)}
  jugadoresDisponibles={jugadoresFiltrados}
  onSubmit={handleAgregarJugador}
/>

<ModalEditarJugador
  visible={modalEditarVisible}
  jugador={jugadorEditando}
  onClose={() => setModalEditarVisible(false)}
  onSubmit={handleEditarJugador}
/>

<ModalAlineacionInteligente
  visible={modalInteligenteVisible}
  onClose={() => setModalInteligenteVisible(false)}
  sesionId={sesionId}
  grupoId={sesionInfo?.grupo?.id}
  onSuccess={cargarAlineacion}
/>
   </View> 
);


}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { marginBottom: 10 },
  backTxt: { fontSize: 16, color: "#014898" },

  sesionBox: {
    padding: 12,
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    marginBottom: 18,
  },
  sesionTitle: { fontSize: 18, fontWeight: "700" },
  sesionDesc: { opacity: 0.7 },

  emptyBox: { alignItems: "center", paddingVertical: 30 },
  emptyText: { fontSize: 16, color: "#444" },

  primaryBtn: {
    backgroundColor: "#014898",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  secundaryBtn: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  deleteBtn: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 8,
    marginLeft: 4,
  },
  btnTxt: { color: "white", fontWeight: "bold" },

  actionsRow: {
    flexDirection: "row",
    marginBottom: 20,
    flexWrap: "wrap",
  },

  subtitle: { fontSize: 18, marginBottom: 8, fontWeight: "600" },

  playerItem: {
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  playerName: { fontSize: 16, fontWeight: "600" },
  playerPos: { opacity: 0.7 },
});
