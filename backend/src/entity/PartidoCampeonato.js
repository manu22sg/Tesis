import { EntitySchema } from "typeorm";

const PartidoCampeonatoSchema = new EntitySchema({
  name: "PartidoCampeonato",
  tableName: "partidos_campeonato",
  columns: {
    id: { type: "int", primary: true, generated: true },

    campeonatoId: { type: "int", nullable: false },
    canchaId: { type: "int", nullable: true },

    // Participantes neutros (sin local/visita)
    equipoAId: { type: "int", nullable: false },
    equipoBId: { type: "int", nullable: false },
    arbitroId: { type: "int", nullable: true }, /// FALSE en produccion
    ronda: { type: "varchar", length: 20 }, // ej: "cuartos", "semifinal", "final"
    fecha: { type: "date", nullable: true },
    horaInicio: { type: "time", nullable: true },
    horaFin: { type: "time", nullable: true },

    golesA: { type: "int", default: null },
    golesB: { type: "int", default: null },

    penalesA: { type: "int", nullable: true, default: null },
    penalesB: { type: "int", nullable: true, default: null },
    definidoPorPenales: { type: "boolean", default: false }, // indica si se fue a penales

    ganadorId: { type: "int", nullable: true }, // FK a EquipoCampeonato
    estado: { type: "varchar", length: 20, default: "pendiente" }, // pendiente, en_juego, finalizado
    ordenLlave: { type: "int", nullable: true } ,  // Para torneos con llave
    duracionMinutos: { type: "int", nullable: true },  
    fechaCreacion: { type: "timestamp", createDate: true },
    fechaActualizacion: { type: "timestamp", updateDate: true },
  },
  relations: {
    arbitro: {
  type: "many-to-one",
  target: "Usuario",
  joinColumn: { name: "arbitroId" },
  onDelete: "RESTRICT",
},
    campeonato: {
      type: "many-to-one",
      target: "Campeonato",
      joinColumn: { name: "campeonatoId" },
      onDelete: "CASCADE",
    },
    cancha: {
      type: "many-to-one",
      target: "Cancha",
      joinColumn: { name: "canchaId" },
      onDelete: "RESTRICT",
    },

    // Participantes del partido
    equipoA: {
      type: "many-to-one",
      target: "EquipoCampeonato",
      joinColumn: { name: "equipoAId" },
      onDelete: "CASCADE",
    },
    equipoB: {
      type: "many-to-one",
      target: "EquipoCampeonato",
      joinColumn: { name: "equipoBId" },
      onDelete: "CASCADE",
    },

    ganador: {
      type: "many-to-one",
      target: "EquipoCampeonato",
      joinColumn: { name: "ganadorId" },
      onDelete: "SET NULL",
    },

    estadisticas: {
      type: "one-to-many",
      target: "EstadisticaCampeonato",
      inverseSide: "partido",
    },
  },
  indices: [
    { name: "idx_partido_campeonato", columns: ["campeonatoId"] },
    { name: "idx_partido_cancha", columns: ["canchaId"] },
    { name: "idx_partido_estado", columns: ["estado"] },
    { name: "idx_partido_ronda", columns: ["ronda"] },
  ],
  uniques: [
    // Evita duplicar el mismo emparejamiento exacto
    { name: "uq_emparejamiento_ordenado", columns: ["campeonatoId", "equipoAId", "equipoBId"] },
  ],
  checks: [
    // Evita que un partido tenga el mismo equipo dos veces
    { expression: `"equipoAId" <> "equipoBId"` },
  ],
});

export default PartidoCampeonatoSchema;