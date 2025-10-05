import { EntitySchema } from "typeorm";

const CampeonatoSchema = new EntitySchema({
  name: "Campeonato",
  tableName: "campeonatos",
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
    descripcion: {
      type: "text",
      nullable: true,
    },
    fechaInicio: {
      type: "date",
    },
    fechaFin: {
      type: "date",
      nullable: true,
    },
    estado: {
      type: "varchar",
      length: 20,
      default: "planificacion",
    },
    modalidad: {
      type: "varchar",
      length: 20,
    },
    formatoJuego: {
      type: "varchar",
      length: 20,
    },
    campeonId: {
      type: "int",
      nullable: true,
    },
    fechaCreacion: {
      type: "timestamp",
      createDate: true,
    },
    fechaActualizacion: {
      type: "timestamp",
      updateDate: true,
    },
  },
  relations: {
    equipos: {
      type: "one-to-many",
      target: "Equipo",
      inverseSide: "campeonato",
    },
    partidos: {
      type: "one-to-many",
      target: "Partido",
      inverseSide: "campeonato",
    },
    campeon: {
      type: "many-to-one",
      target: "Equipo",
      joinColumn: { name: "campeonId" },
      nullable: true,
    },
    sanciones: {
      type: "one-to-many",
      target: "Sancion",
      inverseSide: "campeonato",
    },
  },
  indices: [
    { name: "idx_campeonatos_estado", columns: ["estado"] },
    { name: "idx_campeonatos_modalidad", columns: ["modalidad"] },
    { name: "idx_campeonatos_fecha_inicio", columns: ["fechaInicio"] },
  ],
});

export default CampeonatoSchema;