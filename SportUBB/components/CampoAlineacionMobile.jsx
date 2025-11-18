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
  
  // Mantener referencias de pan estables
  const panRefs = useRef({});

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

    const inicial = jugadores.map((j) => {
      // Reutilizar el pan existente o crear uno nuevo
      if (!panRefs.current[j.jugadorId]) {
        panRefs.current[j.jugadorId] = new Animated.ValueXY();
      }
      
      // Buscar si ya existe en el estado actual para preservar posición
      const existente = jugadoresPos.find(jp => jp.jugadorId === j.jugadorId);
      
      return {
        ...j,
        x: existente?.x || j.posicionX || posDefecto(j.posicion).x,
        y: existente?.y || j.posicionY || posDefecto(j.posicion).y,
        pan: panRefs.current[j.jugadorId],
      };
    });

    setJugadoresPos(inicial);
  }, [jugadores]);

  // Iniciar movimiento táctil
  const panResponders = jugadoresPos.map((jugador, index) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => modoEdicion,
      onPanResponderGrant: () => {
        setJugadorMoviendo(jugador);
        // Establecer el offset para que el movimiento sea relativo
        jugador.pan.setOffset({
          x: jugador.pan.x._value,
          y: jugador.pan.y._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: jugador.pan.x, dy: jugador.pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        // Aplanar el offset en el valor
        jugador.pan.flattenOffset();

        // Calcular nueva posición ANTES de resetear el pan
        if (!campoLayout) {
          jugador.pan.setValue({ x: 0, y: 0 });
          setJugadorMoviendo(null);
          return;
        }

        const dropX = (jugador.x / 100) * campoLayout.width + gesture.dx;
        const dropY = (jugador.y / 100) * campoLayout.height + gesture.dy;

        // Verificar si cae en zona de eliminación
        if (
          trashLayout.current &&
          dropX >= trashLayout.current.x &&
          dropX <= trashLayout.current.x + trashLayout.current.width &&
          dropY >= trashLayout.current.y &&
          dropY <= trashLayout.current.y + trashLayout.current.height
        ) {
          // Resetear pan antes de eliminar
          jugador.pan.setValue({ x: 0, y: 0 });
          
          Alert.alert(
            "Eliminar jugador",
            `¿Eliminar a ${jugador?.jugador?.usuario?.nombre}?`,
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                  // Llamar al servicio de eliminación primero
                  if (onEliminarJugador) {
                    await onEliminarJugador(jugador.jugadorId);
                  }
                  
                  // Eliminar del estado local
                  setJugadoresPos((prev) =>
                    prev.filter((j) => j.jugadorId !== jugador.jugadorId)
                  );
                },
              },
            ]
          );
          setJugadorMoviendo(null);
          return;
        }

        // Calcular nueva posición
        const newX = Math.max(
          5,
          Math.min(95, (dropX / campoLayout.width) * 100)
        );

        const newY = Math.max(
          5,
          Math.min(95, (dropY / campoLayout.height) * 100)
        );

        // Actualizar posición en el estado
        setJugadoresPos((prev) =>
          prev.map((j) =>
            j.jugadorId === jugador.jugadorId 
              ? { ...j, x: newX, y: newY, pan: j.pan }
              : j
          )
        );

        // Resetear el pan a 0
        jugador.pan.setValue({ x: 0, y: 0 });
        
        setCambiosPendientes(true);
        setJugadorMoviendo(null);
      },
    })
  );

  const [campoLayout, setCampoLayout] = useState(null);

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
      prev.map((j) => {
        j.pan.setValue({ x: 0, y: 0 });
        return { ...j, x: 50, y: 50, pan: j.pan };
      })
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
        {/* Líneas del campo */}
        <View style={styles.fieldLines}>
          {/* Línea de medio campo */}
          <View style={styles.midLine} />
          
          {/* Círculo central */}
          <View style={styles.centerCircle} />
          <View style={styles.centerDot} />
          
          {/* Área grande superior */}
          <View style={styles.bigBoxTop} />
          
          {/* Área chica superior */}
          <View style={styles.smallBoxTop} />
          
          {/* Área grande inferior */}
          <View style={styles.bigBoxBottom} />
          
          {/* Área chica inferior */}
          <View style={styles.smallBoxBottom} />
        </View>

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
    position: "relative",
    overflow: "hidden",
  },

  fieldLines: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  midLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },

  centerCircle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 80,
    height: 80,
    marginLeft: -40,
    marginTop: -40,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },

  centerDot: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },

  bigBoxTop: {
    position: "absolute",
    top: 0,
    left: "25%",
    width: "50%",
    height: "18%",
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },

  smallBoxTop: {
    position: "absolute",
    top: 0,
    left: "37.5%",
    width: "25%",
    height: "9%",
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },

  bigBoxBottom: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    width: "50%",
    height: "18%",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },

  smallBoxBottom: {
    position: "absolute",
    bottom: 0,
    left: "37.5%",
    width: "25%",
    height: "9%",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
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