import { EntitySchema } from "typeorm";

const EstadisticaBasicaSchema = new EntitySchema({
  name: "EstadisticaBasica",
  tableName: "estadisticas_basicas",
  columns: {
    id: { type: "int", primary: true, generated: true },
    jugadorId: { type: "int" },
    sesionId: { type: "int" },
    
    // Estadísticas Ofensivas
    goles: { type: "int", default: 0 },
    asistencias: { type: "int", default: 0 },
    tirosAlArco: { type: "int", default: 0 },
    tirosTotales: { type: "int", default: 0 },
    regatesExitosos: { type: "int", default: 0 },
    regatesIntentados: { type: "int", default: 0 },
    pasesCompletados: { type: "int", default: 0 },
    pasesIntentados: { type: "int", default: 0 },
    
    // Estadísticas Defensivas
    intercepciones: { type: "int", default: 0 },
    recuperaciones: { type: "int", default: 0 },
    duelosGanados: { type: "int", default: 0 },
    duelosTotales: { type: "int", default: 0 },
    despejes: { type: "int", default: 0 },
    
    //  Estadísticas de Portero
    atajadas: { type: "int", default: 0 },
    golesRecibidos: { type: "int", default: 0 },
    arcosInvictos: { type: "int", default: 0 },
    
    //  Generales
    tarjetasAmarillas: { type: "int", default: 0 },
    tarjetasRojas: { type: "int", default: 0 },
    minutosJugados: { type: "int", default: 0 },  // ✅ Ya lo tenías
    
    fechaRegistro: { type: "timestamp", createDate: true },
  },
  relations: {
    jugador: { 
      type: "many-to-one", 
      target: "Jugador", 
      joinColumn: { name: "jugadorId" }, 
      onDelete: "CASCADE" 
    },
    sesion: { 
      type: "many-to-one", 
      target: "SesionEntrenamiento", 
      joinColumn: { name: "sesionId" }, 
      onDelete: "CASCADE" 
    },
  },
  indices: [
    { name: "idx_estadisticas_jugador_sesion", columns: ["jugadorId", "sesionId"] },
    { name: "idx_estadisticas_fecha", columns: ["fechaRegistro"] },
  ],
  uniques: [
    { name: "uq_estadistica_por_jugador_sesion", columns: ["jugadorId", "sesionId"] }
  ]
});

export default EstadisticaBasicaSchema;