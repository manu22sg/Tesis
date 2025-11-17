import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  StyleSheet,
  ScrollView,
  Platform
} from "react-native";

import * as Location from "expo-location";
import * as Clipboard from "expo-clipboard";

const TokenSesionModal = memo(function TokenSesionModal({
  open,
  sesion,
  ttlMin,
  setTtlMin,
  tokenLength,
  setTokenLength,
  loadingToken,
  onClose,
  onActivar,
  onDesactivar,
}) {
  const [requiereUbicacion, setRequiereUbicacion] = useState(false);
  const [ubicacion, setUbicacion] = useState({ latitud: null, longitud: null });
  const [loadingUbicacion, setLoadingUbicacion] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRequiereUbicacion(false);
    setUbicacion({ latitud: null, longitud: null });
  }, [open]);

  // 📋 Copiar token
  const copiarToken = async () => {
    if (!sesion?.token) return;
    await Clipboard.setStringAsync(sesion.token);
    Alert.alert("Token copiado");
  };

  // 📍 Obtener ubicación del entrenador
  const obtenerUbicacion = async () => {
    try {
      setLoadingUbicacion(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Debes permitir acceso a la ubicación.");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUbicacion({
        latitud: pos.coords.latitude,
        longitud: pos.coords.longitude,
      });

    } catch (err) {
      Alert.alert("Error", "No se pudo obtener la ubicación");
    } finally {
      setLoadingUbicacion(false);
    }
  };

  const handleActivar = () => {
    if (requiereUbicacion && !ubicacion.latitud) {
      Alert.alert("Falta ubicación", "Debes fijar una ubicación.");
      return;
    }
  const params = {
    ttlMin,
    tokenLength,
    requiereUbicacion,
    ...(requiereUbicacion && ubicacion.latitud && ubicacion.longitud
      ? {
          latitudToken: ubicacion.latitud,
          longitudToken: ubicacion.longitud,
        }
      : {}
    ),
  };

  console.log("📤 PARAMS A ENVIAR:", params);

  onActivar(params);
};


  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
    style={styles.overlay}
    activeOpacity={1}
    onPress={onClose} 
  >
    <TouchableOpacity
      activeOpacity={1}
      style={styles.modalContainer}
      onPress={() => {}} 
    >

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text st  yle={styles.title}>🔑 Gestión de Token</Text>

            {/* Si el token está activo */}
            {sesion?.tokenActivo ? (
              <>
                <View style={styles.tokenBox}>
                  <Text style={styles.tokenLabel}>Token actual</Text>
                  <Text style={styles.tokenCode}>{sesion.token}</Text>
                  <Text style={styles.tokenExpire}>
                    Expira: {new Date(sesion.tokenExpiracion).toLocaleString()}
                  </Text>
                </View>

                <TouchableOpacity style={styles.copyButton} onPress={copiarToken}>
                  <Text style={styles.copyText}>📋 Copiar Token</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.desactivarBtn]}
                  onPress={onDesactivar}
                  disabled={loadingToken}
                >
                  <Text style={styles.desactivarText}>❌ Desactivar Token</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>⚙ Configuración</Text>

                {/* Duración */}
                <Text style={styles.label}>Duración (minutos)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(ttlMin)}
                  onChangeText={(v) => setTtlMin(Number(v))}
                />
                <Text style={styles.helper}>Expira en {ttlMin} minutos</Text>

                {/* Longitud */}
                <Text style={styles.label}>Longitud del token</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(tokenLength)}
                  onChangeText={(v) => setTokenLength(Number(v))}
                />
                <Text style={styles.helper}>{tokenLength} caracteres</Text>

                {/* Requiere ubicación */}
                <View style={styles.switchRow}>
                  <Text style={styles.label}>📍 Exigir ubicación</Text>
                  <Switch
                    value={requiereUbicacion}
                    onValueChange={(v) => {
                      setRequiereUbicacion(v);
                      if (!v) setUbicacion({ latitud: null, longitud: null });
                    }}
                  />
                </View>

                {/* Obtener ubicación */}
                {requiereUbicacion && (
                  <View style={styles.ubicationBox}>
                    {!ubicacion.latitud ? (
                      <>
                        <TouchableOpacity
                          style={styles.ubicacionBtn}
                          onPress={obtenerUbicacion}
                        >
                          {loadingUbicacion ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.ubicacionBtnText}>📍 Obtener ubicación</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={styles.ubicacionInfo}>
                        <Text style={styles.okIcon}>✅ Ubicación fijada</Text>
                        <Text style={styles.coord}>Lat: {ubicacion.latitud.toFixed(6)}</Text>
                        <Text style={styles.coord}>Lng: {ubicacion.longitud.toFixed(6)}</Text>

                        <TouchableOpacity
                          style={styles.refreshUbicacion}
                          onPress={obtenerUbicacion}
                        >
                          <Text style={{ color: "#1976d2" }}>Actualizar ubicación</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Botón activar */}
                <TouchableOpacity
                  style={[
                    styles.activarBtn,
                    requiereUbicacion && !ubicacion.latitud && styles.btnDisabled,
                  ]}
                  disabled={loadingToken}
                  onPress={handleActivar}
                >
                  <Text style={styles.activarText}>⚡ Generar Token</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Botón cerrar */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </ScrollView>
          
    </TouchableOpacity>
  </TouchableOpacity>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  tokenBox: {
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  tokenLabel: { fontSize: 14, opacity: 0.7 },
  tokenCode: { fontSize: 26, fontWeight: "bold", marginVertical: 8 },
  tokenExpire: { fontSize: 12, opacity: 0.6 },

  copyButton: {
    backgroundColor: "#1976d2",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  copyText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  desactivarBtn: {
    backgroundColor: "#E53935",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  desactivarText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  label: { marginTop: 15, fontWeight: "600", fontSize: 14 },
  input: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  helper: { fontSize: 12, opacity: 0.6, marginTop: 3 },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    alignItems: "center",
  },

  ubicationBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  ubicacionBtn: {
    backgroundColor: "#1976d2",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  ubicacionBtnText: { color: "#fff", fontWeight: "600" },

  ubicacionInfo: { alignItems: "center" },
  okIcon: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  coord: { fontSize: 12, opacity: 0.8 },

  refreshUbicacion: { marginTop: 10 },

  activarBtn: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  activarText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  btnDisabled: { opacity: 0.4 },

  closeBtn: { marginTop: 25, alignItems: "center" },
  closeText: { color: "#1976d2", fontSize: 15, fontWeight: "600" },
});

export default TokenSesionModal;
