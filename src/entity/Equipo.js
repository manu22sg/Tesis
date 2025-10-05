import { EntitySchema } from "typeorm";

const EquipoSchema = new EntitySchema({
  name: "Equipo",
  tableName: "equipos",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    nombre: {
      type: "varchar",
      length: 100,
    },
    carrera: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    campeonatoId: {
      type: "int",
    },
    capitanId: {
      type: "int",
      nullable: true,
    },
    eliminado: {
      type: "boolean",
      default: false,
    },
    posicionFinal: {
      type: "int",
      nullable: true,
    },
    fechaCreacion: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    campeonato: {
      type: "many-to-one",
      target: "Campeonato",
      joinColumn: { name: "campeonatoId" },
      onDelete: "CASCADE",
    },
    capitan: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: { name: "capitanId" },
      nullable: true,
    },
    participantes: {
      type: "one-to-many",
      target: "ParticipanteEquipo",
      inverseSide: "equipo",
    },
    partidosEquipo1: {
      type: "one-to-many",
      target: "Partido",
      inverseSide: "equipo1",
    },
    partidosEquipo2: {
      type: "one-to-many",
      target: "Partido",
      inverseSide: "equipo2",
    },
    estadisticasCampeonato: {
      type: "one-to-many",
      target: "EstadisticaCampeonato",
      inverseSide: "equipo",
    },
  },
  indices: [
    { name: "idx_equipos_campeonato", columns: ["campeonatoId"] },
    { name: "idx_equipos_carrera", columns: ["carrera"] },
  ],
});

export default EquipoSchema;