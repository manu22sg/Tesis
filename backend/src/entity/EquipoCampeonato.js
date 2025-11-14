import { EntitySchema } from "typeorm";

const EquipoCampeonatoSchema = new EntitySchema({
  name: "EquipoCampeonato",
  tableName: "equipos_campeonato",
  columns: {
    id: { type: "int", primary: true, generated: true },

    campeonatoId: { type: "int", nullable: false },

    carreraId: { type: "int", nullable: true },

    nombre: { type: "varchar", length: 100 },
    tipo: { type: "varchar", length: 20 },

    ordenLlave: { type: "int", nullable: true },

    fechaInscripcion: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
  },

  relations: {
    campeonato: {
      type: "many-to-one",
      target: "Campeonato",
      joinColumn: { name: "campeonatoId" },
      onDelete: "CASCADE",
    },

    // 🔥 NUEVO
    carrera: {
      type: "many-to-one",
      target: "Carrera",
      joinColumn: { name: "carreraId" },
      onDelete: "RESTRICT",
    },

    jugadores: {
      type: "one-to-many",
      target: "JugadorCampeonato",
      inverseSide: "equipo",
    },

    partidosLocal: {
      type: "one-to-many",
      target: "PartidoCampeonato",
      inverseSide: "equipoLocal",
    },

    partidosVisitante: {
      type: "one-to-many",
      target: "PartidoCampeonato",
      inverseSide: "equipoVisitante",
    },
  },

  indices: [
    { name: "idx_equipo_campeonato", columns: ["campeonatoId"] },
    { name: "idx_equipo_tipo", columns: ["tipo"] },
    { name: "idx_equipo_carrera", columns: ["carreraId"] }, // 🔥 NUEVO
  ],
});

export default EquipoCampeonatoSchema;
