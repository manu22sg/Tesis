import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";

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
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Editar Jugador</Text>

          <Text style={styles.label}>Posición</Text>
          <TextInput
            style={styles.input}
            value={posicion}
            onChangeText={setPosicion}
          />

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

          <View style={styles.row}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: "red" }}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.save} onPress={handleGuardar}>
              <Text style={styles.saveTxt}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  label: { marginTop: 10 },
  input: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  save: {
    backgroundColor: "#1976d2",
    padding: 10,
    borderRadius: 8,
  },
  saveTxt: { color: "#fff", fontWeight: "bold" },
});
