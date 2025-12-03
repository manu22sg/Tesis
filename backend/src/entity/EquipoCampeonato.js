import { EntitySchema } from "typeorm";

const EquipoCampeonatoSchema = new EntitySchema({
  name: "EquipoCampeonato",
  tableName: "equipos_campeonato",
  columns: {
    id: { type: "int", primary: true, generated: true },

    campeonatoId: { type: "int", nullable: false },
    fechaActualizacion: { type: "timestamp", updateDate: true },

    carreraId: { type: "int", nullable: false },

    nombre: { type: "varchar", length: 100 },
    tipo: { type: "varchar", length: 20 },

    fechaInscripcion: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
uniques: [
  { name: "uq_equipo_por_carrera_en_campeonato", columns: ["campeonatoId", "carreraId"] }
],
  relations: {
    campeonato: {
      type: "many-to-one",
      target: "Campeonato",
      joinColumn: { name: "campeonatoId" },
      onDelete: "CASCADE",
    },

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

    partidosComoA: {
      type: "one-to-many",
      target: "PartidoCampeonato",
      inverseSide: "equipoA",
    },

    partidosComoB: {
      type: "one-to-many",
      target: "PartidoCampeonato",
      inverseSide: "equipoB",
    },
  },

  indices: [
    { name: "idx_equipo_campeonato", columns: ["campeonatoId"] },
    { name: "idx_equipo_tipo", columns: ["tipo"] },
    { name: "idx_equipo_carrera", columns: ["carreraId"] },
  ],
});

export default EquipoCampeonatoSchema;
