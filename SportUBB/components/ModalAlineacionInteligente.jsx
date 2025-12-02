import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet
} from "react-native";
import {
  obtenerFormacionesDisponibles,
  generarAlineacionInteligente,
  eliminarAlineacion,
  obtenerAlineacionPorSesion
} from "../services/alineacionServices";

export default function ModalAlineacionInteligente({
  visible,
  onCancel,
  onSuccess,
  sesionId,
  grupoId
}) {
  const [step, setStep] = useState(0); // 0 = tipo, 1 = formación
  const [loading, setLoading] = useState(false);

  const [tipo, setTipo] = useState(null);
  const [formacion, setFormacion] = useState(null);
  const [formaciones, setFormaciones] = useState([]);
  const [loadingFormaciones, setLoadingFormaciones] = useState(false);

  // Reset al cerrar
  useEffect(() => {
    if (!visible) {
      setStep(0);
      setTipo(null);
      setFormacion(null);
      setFormaciones([]);
    }
  }, [visible]);

  // Cargar formaciones al elegir tipo
  const handleSelectTipo = async (t) => {
    setTipo(t);
    setFormacion(null);
    setFormaciones([]);
    setLoadingFormaciones(true);

    try {
      const data = await obtenerFormacionesDisponibles(t);
      setFormaciones(data || []);
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar formaciones");
    } finally {
      setLoadingFormaciones(false);
    }
  };

  // Reemplazar alineación (lógica del 409)
  const handleReemplazar = async (payload) => {
    try {
      setLoading(true);

      const existente = await obtenerAlineacionPorSesion(sesionId)
        .then(r => r.data)
        .catch(() => null);

      if (existente?.id) {
        await eliminarAlineacion(existente.id);
      }

      await generarAlineacionInteligente(payload);

      Alert.alert("Éxito", "Alineación reemplazada");
      onCancel();
      onSuccess?.();

    } catch (err) {
      Alert.alert("Error", "No se pudo reemplazar la alineación");
    } finally {
      setLoading(false);
    }
  };

  // Generar final
  const handleGenerar = async () => {
    if (!tipo || !formacion) return;

    const payload = {
      sesionId: Number(sesionId),
      grupoId: Number(grupoId),
      tipoAlineacion: tipo,
      formacion
    };

    try {
      setLoading(true);
      await generarAlineacionInteligente(payload);

      Alert.alert("Éxito", "Alineación creada");
      onCancel();
      onSuccess?.();

    } catch (err) {
      const status = err.response?.status;
      const backendMsg = err.response?.data?.message;

      if (status === 409) {
        // ya existe alineación → preguntar
        Alert.alert(
          "Alineación existente",
          backendMsg || "Ya existe una alineación. ¿Quieres reemplazarla?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Reemplazar",
              style: "destructive",
              onPress: () => handleReemplazar(payload)
            }
          ]
        );
        return;
      }

      Alert.alert("Error", backendMsg || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onCancel}
      />

      <View style={styles.modal}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>⚡ Alineación Inteligente</Text>

          {/* PASO 1 */}
          {step === 0 && (
            <>
              <Text style={styles.subtitle}>Seleccione el tipo</Text>

              <TouchableOpacity
                style={[
                  styles.option,
                  tipo === "ofensiva" && styles.selected
                ]}
                onPress={() => handleSelectTipo("ofensiva")}
              >
                <Text style={styles.optionText}>🔥 Ofensiva</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.option,
                  tipo === "defensiva" && styles.selected
                ]}
                onPress={() => handleSelectTipo("defensiva")}
              >
                <Text style={styles.optionText}>🛡️ Defensiva</Text>
              </TouchableOpacity>
            </>
          )}

          {/* PASO 2 */}
          {step === 1 && (
            <>
              <Text style={styles.subtitle}>Seleccione una formación</Text>

              {loadingFormaciones && (
                <ActivityIndicator color="#1976d2" size="large" />
              )}

              {formaciones.map((f) => (
                <TouchableOpacity
                  key={f.nombre}
                  style={[
                    styles.option,
                    formacion === f.nombre && styles.selected
                  ]}
                  onPress={() => setFormacion(f.nombre)}
                >
                  <Text style={styles.optionText}>{f.nombre}</Text>
                  <Text style={styles.desc}>
                    POR {f.distribucion.POR} • DEF {f.distribucion.DEF} •
                    MED {f.distribucion.MED} • DEL {f.distribucion.DEL}
                  </Text>
                </TouchableOpacity>
              ))}

              {formaciones.length === 0 && !loadingFormaciones && (
                <Text style={{ textAlign: "center", marginTop: 20 }}>
                  No hay formaciones disponibles
                </Text>
              )}
            </>
          )}
        </ScrollView>

        {/* FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>

          {step === 0 ? (
            <TouchableOpacity
              style={[styles.nextBtn, !tipo && styles.disabled]}
              disabled={!tipo}
              onPress={() => setStep(1)}
            >
              <Text style={styles.nextText}>Siguiente</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.generateBtn,
                (!formacion || loading) && styles.disabled
              ]}
              disabled={!formacion || loading}
              onPress={handleGenerar}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateText}>Generar</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.5)",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    position: "absolute",
    bottom: 0,
    width: "100%",
    maxHeight: "85%"
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10
  },
  option: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    marginBottom: 10
  },
  selected: {
    borderColor: "#1976d2",
    backgroundColor: "#e3f2fd"
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600"
  },
  desc: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15
  },
  cancelBtn: {
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 10,
    width: "45%"
  },
  nextBtn: {
    padding: 12,
    backgroundColor: "#1976d2",
    borderRadius: 10,
    width: "45%"
  },
  generateBtn: {
    padding: 12,
    backgroundColor: "#43a047",
    borderRadius: 10,
    width: "45%"
  },
  disabled: {
    opacity: 0.4
  },
  cancelText: {
    textAlign: "center",
    fontWeight: "bold"
  },
  nextText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold"
  },
  generateText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold"
  }
});
