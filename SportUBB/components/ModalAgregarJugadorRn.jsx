import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";

const POSICIONES = [
  "Portero",
  "Defensa Central",
  "Defensa Central Derecho",
  "Defensa Central Izquierdo",
  "Lateral Derecho",
  "Lateral Izquierdo",
  "Mediocentro Defensivo",
  "Mediocentro",
  "Mediocentro Ofensivo",
  "Extremo Derecho",
  "Extremo Izquierdo",
  "Delantero Centro",
];

export default function ModalAgregarJugador({
  visible,
  onClose,
  jugadoresDisponibles = [],
  onSubmit,
}) {
  const [jugadorId, setJugadorId] = useState(null);
  const [posicion, setPosicion] = useState("");
  const [orden, setOrden] = useState("");

  const handleAgregar = () => {
    if (!jugadorId || !posicion) {
      Alert.alert("Faltan datos", "Debes escoger jugador y posición.");
      return;
    }

    onSubmit({
      jugadorId,
      posicion,
      orden: orden ? Number(orden) : null,
    });

    setJugadorId(null);
    setPosicion("");
    setOrden("");
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.box}>
              <Text style={styles.title}>Agregar Jugador</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* -------- SELECT DE JUGADOR -------- */}
                <Text style={styles.label}>Jugador</Text>
                {jugadoresDisponibles.map((j) => (
                  <TouchableOpacity
                    key={j.id}
                    style={[
                      styles.option,
                      jugadorId === j.id && styles.optionSelected,
                    ]}
                    onPress={() => setJugadorId(j.id)}
                  >
                    <Text
                      style={{
                        color: jugadorId === j.id ? "white" : "black",
                      }}
                    >
                      {j.usuario?.nombre} - {j.usuario?.rut}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* -------- SELECT DE POSICIÓN -------- */}
                <Text style={styles.label}>Posición</Text>

                {POSICIONES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.option,
                      posicion === p && styles.optionSelected,
                    ]}
                    onPress={() => setPosicion(p)}
                  >
                    <Text
                      style={{
                        color: posicion === p ? "white" : "black",
                      }}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* -------- ORDEN -------- */}
                <Text style={styles.label}>Número / Orden</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Opcional"
                  keyboardType="numeric"
                  value={orden}
                  onChangeText={setOrden}
                />
              </ScrollView>

              {/* -------- BOTONES -------- */}
              <View style={styles.row}>
                <TouchableOpacity style={styles.cancel} onPress={onClose}>
                  <Text style={styles.cancelTxt}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.save} onPress={handleAgregar}>
                  <Text style={styles.saveTxt}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    maxHeight: "85%",
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  label: { fontSize: 14, marginTop: 12, marginBottom: 4, fontWeight: "600" },
  input: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  option: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginBottom: 6,
  },
  optionSelected: {
    backgroundColor: "#1976d2",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 10,
  },
  cancel: { padding: 10 },
  cancelTxt: { color: "red", fontSize: 16 },
  save: {
    backgroundColor: "#1976d2",
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveTxt: { color: "#fff", fontWeight: "bold" },
});