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
  onEditarJugador, // Nuevo callback para editar
}) {
  const [modoEdicion, setModoEdicion] = useState(true);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);
  const [jugadoresPos, setJugadoresPos] = useState([]);
  const [jugadorMoviendo, setJugadorMoviendo] = useState(null);
  const [campoLayout, setCampoLayout] = useState(null);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null); // Para tooltip

  const trashAreaRef = useRef(null);
  const trashLayout = useRef(null);

  // Inicializar posiciones
  useEffect(() => {
    if (!campoLayout) return;

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
      const existente = jugadoresPos.find(jp => jp.jugadorId === j.jugadorId);
      const xPercent = existente?.xPercent || j.posicionX || posDefecto(j.posicion).x;
      const yPercent = existente?.yPercent || j.posicionY || posDefecto(j.posicion).y;
      
      return {
        ...j,
        xPercent,
        yPercent,
        x: new Animated.Value((xPercent / 100) * campoLayout.width),
        y: new Animated.Value((yPercent / 100) * campoLayout.height),
      };
    });

    setJugadoresPos(inicial);
  }, [jugadores, campoLayout]);

  // Crear PanResponders
  const panResponders = jugadoresPos.map((jugador) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => modoEdicion,
      onPanResponderGrant: () => {
        setJugadorMoviendo(jugador);
        setJugadorSeleccionado(null); // Ocultar tooltip al mover
        jugador.x.setOffset(jugador.x._value);
        jugador.y.setOffset(jugador.y._value);
        jugador.x.setValue(0);
        jugador.y.setValue(0);
      },
      onPanResponderMove: (_, gesture) => {
        if (!campoLayout) return;

        // Calcular la posición objetivo
        const margenIzq = 22.5;
        const margenDer = 60; // MÁS margen = MENOS espacio permitido
        const margenArriba = 22.5;
        const margenAbajo = 63; // MÁS margen = MENOS espacio permitido
        
        const baseX = jugador.xPercent / 100 * campoLayout.width;
        const baseY = jugador.yPercent / 100 * campoLayout.height;
        
        const targetX = baseX + gesture.dx;
        const targetY = baseY + gesture.dy;

        // Limitar durante el movimiento con márgenes asimétricos
        const limitedX = Math.max(margenIzq, Math.min(campoLayout.width - margenDer, targetX)) - baseX;
        const limitedY = Math.max(margenArriba, Math.min(campoLayout.height - margenAbajo, targetY)) - baseY;

        jugador.x.setValue(limitedX);
        jugador.y.setValue(limitedY);
      },
      onPanResponderRelease: (_, gesture) => {
        jugador.x.flattenOffset();
        jugador.y.flattenOffset();

        if (!campoLayout) {
          setJugadorMoviendo(null);
          return;
        }

        // 🔥 Si el movimiento fue mínimo (menos de 10px), es un click, no un drag
        const distanciaMovimiento = Math.sqrt(gesture.dx ** 2 + gesture.dy ** 2);
        if (distanciaMovimiento < 10 && onEditarJugador) {
          // Es un click, abrir modal de edición
          onEditarJugador(jugador);
          setJugadorMoviendo(null);
          return;
        }

        const finalX = jugador.x._value;
        const finalY = jugador.y._value;

        // Verificar eliminación
        if (
          trashLayout.current &&
          finalX >= trashLayout.current.x &&
          finalX <= trashLayout.current.x + trashLayout.current.width &&
          finalY >= trashLayout.current.y &&
          finalY <= trashLayout.current.y + trashLayout.current.height
        ) {
          Alert.alert(
            "Eliminar jugador",
            `¿Eliminar a ${jugador?.jugador?.usuario?.nombre}?`,
            [
              { 
                text: "Cancelar", 
                style: "cancel",
                onPress: () => {
                  jugador.x.setValue((jugador.xPercent / 100) * campoLayout.width);
                  jugador.y.setValue((jugador.yPercent / 100) * campoLayout.height);
                }
              },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                  if (onEliminarJugador) {
                    await onEliminarJugador(jugador.jugadorId);
                  }
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

        // 🔥 LIMITAR POSICIÓN DENTRO DEL CAMPO (márgenes asimétricos)
        const margenIzq = 22.5;
        const margenDer = 35; // MÁS margen = MENOS espacio permitido
        const margenArriba = 22.5;
        const margenAbajo = 35; // MÁS margen = MENOS espacio permitido
        
        const finalXLimited = Math.max(margenIzq, Math.min(campoLayout.width - margenDer, finalX));
        const finalYLimited = Math.max(margenArriba, Math.min(campoLayout.height - margenAbajo, finalY));

        // Ajustar la posición si se salió del límite
        jugador.x.setValue(finalXLimited);
        jugador.y.setValue(finalYLimited);

        // Calcular nueva posición en porcentaje
        const newXPercent = Math.max(5, Math.min(92, (finalXLimited / campoLayout.width) * 100));
        const newYPercent = Math.max(5, Math.min(92, (finalYLimited / campoLayout.height) * 100));

        // Actualizar estado
        setJugadoresPos((prev) =>
          prev.map((j) =>
            j.jugadorId === jugador.jugadorId
              ? { ...j, xPercent: newXPercent, yPercent: newYPercent }
              : j
          )
        );

        setCambiosPendientes(true);
        setJugadorMoviendo(null);
      },
    })
  );

  const handleGuardar = () => {
    if (!onActualizarPosiciones) return;

    onActualizarPosiciones(
      jugadoresPos.map((j) => ({
        jugadorId: j.jugadorId,
        x: j.xPercent,
        y: j.yPercent,
      }))
    );

    setCambiosPendientes(false);
    Alert.alert("Guardado", "Posiciones guardadas con éxito");
  };

  const handleReset = () => {
    if (!campoLayout) return;
    
    setJugadoresPos((prev) =>
      prev.map((j) => {
        j.x.setValue((50 / 100) * campoLayout.width);
        j.y.setValue((50 / 100) * campoLayout.height);
        return { ...j, xPercent: 50, yPercent: 50 };
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
          <Text style={styles.warning}>⚠ Tiene cambios sin guardar</Text>
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
                transform: [
                  { translateX: jugador.x },
                  { translateY: jugador.y },
                ],
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

            {/* Tooltip con info del jugador - SOLO EN MODO VISTA */}
            {!modoEdicion && jugadorSeleccionado?.jugadorId === jugador.jugadorId && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipName}>
                  {jugador.jugador?.usuario?.nombre}
                </Text>
                <Text style={styles.tooltipRut}>
                  RUT: {jugador.jugador?.usuario?.rut || "N/A"}
                </Text>
                <Text style={styles.tooltipPos}>
                  Posición: {jugador.posicion || "Sin asignar"}
                </Text>
              </View>
            )}
          </Animated.View>
        ))}
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
    left: 0,
    top: 0,
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

  tooltip: {
    position: "absolute",
    top: 55,
    left: -50,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: 10,
    borderRadius: 8,
    minWidth: 150,
    zIndex: 1000,
    borderWidth: 2,
    borderColor: "#fff",
  },
  tooltipName: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tooltipRut: {
    color: "#ccc",
    fontSize: 12,
    marginBottom: 2,
  },
  tooltipPos: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
  },
  tooltipEditBtn: {
    marginTop: 8,
    backgroundColor: "#2196F3",
    padding: 6,
    borderRadius: 4,
    alignItems: "center",
  },
  tooltipEditText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
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