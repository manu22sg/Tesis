import { EntitySchema } from "typeorm";

const PartidoSchema = new EntitySchema({
  name: "Partido",
  tableName: "partidos",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    campeonatoId: {
      type: "int",
    },
    equipo1Id: {
      type: "int",
      nullable:true
    },
    equipo2Id: {
      type: "int",
      nullable:true
    },
    canchaId: {
      type: "int",
      nullable: true,
    },
    fecha: {
      type: "date",
      nullable: true,
    },
    horaInicio: {
      type: "time",
      nullable: true,
    },
    horaFin: {
      type: "time",
      nullable: true,
    },
    golesEquipo1: {
      type: "int",
      default: 0,
    },
    golesEquipo2: {
      type: "int",
      default: 0,
    },
    penalesEquipo1: {
      type: "int",
      nullable: true,
      comment: "Goles en tanda de penales equipo 1",
    },
    penalesEquipo2: {
      type: "int",
      nullable: true,
      comment: "Goles en tanda de penales equipo 2",
    },
    definidoPorPenales: {
      type: "boolean",
      default: false,
    },
    estado: {
      type: "varchar",
      length: 20,
      default: "programado",
    },
    fase: {
      type: "varchar",
      length: 30,
    },
    numeroPartido: {
      type: "int",
      nullable: true,
    },
    ganadorId: {
      type: "int",
      nullable: true,
    },
    reservaCanchaId: {
      type: "int",
      nullable: true,
    },
    observaciones: {
      type: "text",
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
      joinColumn: { name: "campeonatoId", nullable:true },
      onDelete: "CASCADE",
    },
    equipo1: {
      type: "many-to-one",
      target: "Equipo",
      joinColumn: { name: "equipo1Id" },
    },
    equipo2: {
      type: "many-to-one",
      target: "Equipo",
      joinColumn: { name: "equipo2Id" },
    },
    cancha: {
      type: "many-to-one",
      target: "Cancha",
      joinColumn: { name: "canchaId" },
      nullable: true,
    },
    ganador: {
      type: "many-to-one",
      target: "Equipo",
      joinColumn: { name: "ganadorId" },
      nullable: true,
    },
    reservaCancha: {
      type: "many-to-one",
      target: "ReservaCancha",
      joinColumn: { name: "reservaCanchaId" },
      nullable: true,
    },
    estadisticas: {
      type: "one-to-many",
      target: "EstadisticaCampeonato",
      inverseSide: "partido",
    },
  },
  indices: [
    { name: "idx_partidos_campeonato", columns: ["campeonatoId"] },
    { name: "idx_partidos_fecha", columns: ["fecha"] },
    { name: "idx_partidos_fase", columns: ["fase"] },
    { name: "idx_partidos_cancha", columns: ["canchaId"] },
    { name: "idx_partidos_numero", columns: ["numeroPartido"] },
  ],
});

export default PartidoSchema;