import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableOpacity,
  Alert,
} from "react-native";

export default function CampoAlineacionMobile({
  jugadores = [],
  onActualizarPosiciones,
  onEliminarJugador,
}) {
  const [modoEdicion, setModoEdicion] = useState(true);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  // Estado interno con posiciones
  const [jugadoresPos, setJugadoresPos] = useState([]);

  const [jugadorMoviendo, setJugadorMoviendo] = useState(null);

  const trashAreaRef = useRef(null);
  const trashLayout = useRef(null);

  // Inicializar posiciones
  useEffect(() => {
    const posDefecto = (pos) => {
      const mapa = {
        portero: { x: 50, y: 85 },
        "defensa central": { x: 50, y: 70 },
        "defensa central derecho": { x: 60, y: 70 },
        "defensa central izquierdo": { x: 40, y: 70 },
        "lateral derecho": { x: 80, y: 70 },
        "lateral izquierdo": { x: 20, y: 70 },
        "mediocentro defensivo": { x: 50, y: 55 },
        mediocentro: { x: 50, y: 45 },
        "mediocentro ofensivo": { x: 50, y: 35 },
        "extremo derecho": { x: 80, y: 35 },
        "extremo izquierdo": { x: 20, y: 35 },
        "delantero centro": { x: 50, y: 20 },
      };
      return mapa[pos?.toLowerCase()] || { x: 50, y: 50 };
    };

    const inicial = jugadores.map((j) => ({
      ...j,
      x: j.posicionX || posDefecto(j.posicion).x,
      y: j.posicionY || posDefecto(j.posicion).y,
      pan: new Animated.ValueXY(),
    }));

    setJugadoresPos(inicial);
  }, [jugadores]);

  // Iniciar movimiento táctil
  const panResponders = jugadoresPos.map((jugador, index) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => modoEdicion,
      onPanResponderGrant: () => {
        setJugadorMoviendo(jugador);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: jugador.pan.x, dy: jugador.pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        jugador.pan.flattenOffset();

        verificarDrop(gesture, jugador);
        jugador.pan.setValue({ x: 0, y: 0 });
        setJugadorMoviendo(null);
      },
    })
  );

  // Verificar si cae en zona de eliminación
  const verificarDrop = (gesture, jugador) => {
    if (!campoLayout) return;

    const dropX = (jugador.x / 100) * campoLayout.width + gesture.dx;
    const dropY = (jugador.y / 100) * campoLayout.height + gesture.dy;

    if (
      trashLayout.current &&
      dropX >= trashLayout.current.x &&
      dropX <= trashLayout.current.x + trashLayout.current.width &&
      dropY >= trashLayout.current.y &&
      dropY <= trashLayout.current.y + trashLayout.current.height
    ) {
      // Eliminar
      Alert.alert(
        "Eliminar jugador",
        `¿Eliminar a ${jugador?.jugador?.usuario?.nombre}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => onEliminarJugador(jugador.jugadorId),
          },
        ]
      );
      return;
    }

    moverJugador(gesture, jugador);
  };

  const [campoLayout, setCampoLayout] = useState(null);

  const moverJugador = (gesture, jugador) => {
    if (!campoLayout) return;

    const newX = Math.max(
      5,
      Math.min(
        95,
        ((jugador.x / 100) * campoLayout.width + gesture.dx) /
          campoLayout.width * 100
      )
    );

    const newY = Math.max(
      5,
      Math.min(
        95,
        ((jugador.y / 100) * campoLayout.height + gesture.dy) /
          campoLayout.height * 100
      )
    );

    setJugadoresPos((prev) =>
      prev.map((j) =>
        j.jugadorId === jugador.jugadorId ? { ...j, x: newX, y: newY } : j
      )
    );

    setCambiosPendientes(true);
  };

  const handleGuardar = () => {
    if (!onActualizarPosiciones) return;

    onActualizarPosiciones(
      jugadoresPos.map((j) => ({
        jugadorId: j.jugadorId,
        x: j.x,
        y: j.y,
      }))
    );

    setCambiosPendientes(false);
    Alert.alert("Guardado", "Posiciones guardadas con éxito");
  };

  const handleReset = () => {
    setJugadoresPos((prev) =>
      prev.map((j) => ({ ...j, x: 50, y: 50 }))
    );
    setCambiosPendientes(true);
  };

  return (
    <View style={styles.container}>
      {/* Controles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.switchBtn, modoEdicion && styles.switchActive]}
          onPress={() => setModoEdicion(!modoEdicion)}
        >
          <Text style={styles.switchText}>
            {modoEdicion ? "🔓 Edición" : "🔒 Vista"}
          </Text>
        </TouchableOpacity>

        {cambiosPendientes && (
          <Text style={styles.warning}>⚠ Tienes cambios sin guardar</Text>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.btnText}>↩️ Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, !cambiosPendientes && styles.disabled]}
            disabled={!cambiosPendientes}
            onPress={handleGuardar}
          >
            <Text style={styles.btnText}>💾 Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cancha */}
      <View
        style={styles.campo}
        onLayout={(e) => setCampoLayout(e.nativeEvent.layout)}
      >
        {jugadoresPos.map((jugador, i) => (
          <Animated.View
            key={jugador.jugadorId}
            {...panResponders[i].panHandlers}
            style={[
              styles.player,
              {
                left: `${jugador.x}%`,
                top: `${jugador.y}%`,
                transform: jugador.pan.getTranslateTransform(),
              },
            ]}
          >
            <View style={styles.playerCircle}>
              <Text style={styles.playerText}>
                {jugador.jugador?.usuario?.nombre?.[0] || "?"}
              </Text>
            </View>
            <Text style={styles.playerName}>
              {jugador.jugador?.usuario?.nombre}
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* Zona de eliminación */}
      <View
        style={styles.trashArea}
        ref={trashAreaRef}
        onLayout={(e) => (trashLayout.current = e.nativeEvent.layout)}
      >
        <Text style={styles.trashIcon}>🗑️</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  controls: {
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  switchBtn: {
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  switchActive: {
    backgroundColor: "#4CAF50",
  },
  switchText: {
    color: "#fff",
    fontWeight: "bold",
  },

  warning: {
    color: "#ff9800",
    fontSize: 13,
    marginTop: 6,
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },

  resetBtn: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 6,
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 6,
  },
  disabled: {
    opacity: 0.4,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
  },

  campo: {
    height: 500,
    backgroundColor: "#2d7a35",
    borderRadius: 10,
    borderWidth: 4,
    borderColor: "#1e5128",
  },

  player: {
    position: "absolute",
    alignItems: "center",
  },
  playerCircle: {
    width: 45,
    height: 45,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
  },
  playerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  playerName: {
    color: "white",
    fontSize: 12,
    marginTop: 2,
  },

  trashArea: {
    width: 90,
    height: 90,
    backgroundColor: "#c62828",
    borderRadius: 50,
    position: "absolute",
    bottom: 10,
    right: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  trashIcon: {
    fontSize: 36,
  },
});
