import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
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

export default function ModalEditarJugador({
  visible,
  jugador,
  onClose,
  onSubmit,
}) {
  const [posicion, setPosicion] = useState("");
  const [orden, setOrden] = useState("");
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    if (jugador) {
      setPosicion(jugador.posicion || "");
      setOrden(jugador.orden ? String(jugador.orden) : "");
      setComentario(jugador.comentario || "");
    }
  }, [jugador]);

  const handleGuardar = () => {
    onSubmit({
      posicion,
      orden: orden ? Number(orden) : null,
      comentario,
    });
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
              <Text style={styles.title}>Editar Jugador</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
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
                        fontWeight: posicion === p ? "700" : "500",
                      }}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={styles.label}>Número / Orden</Text>
                <TextInput
                  style={styles.input}
                  value={orden}
                  keyboardType="numeric"
                  onChangeText={setOrden}
                />

                <Text style={styles.label}>Comentario</Text>
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  value={comentario}
                  onChangeText={setComentario}
                  multiline
                />
              </ScrollView>

              <View style={styles.row}>
                <TouchableOpacity onPress={onClose}>
                  <Text style={{ color: "red", fontSize: 16 }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.save} onPress={handleGuardar}>
                  <Text style={styles.saveTxt}>Guardar</Text>
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
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "85%",
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  label: { marginTop: 10, fontWeight: "600", marginBottom: 6 },
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
    marginTop: 18,
    paddingTop: 10,
  },
  save: {
    backgroundColor: "#1976d2",
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveTxt: { color: "#fff", fontWeight: "bold" },
});