import { EntitySchema } from "typeorm";

const EstadisticaCampeonatoSchema = new EntitySchema({
  name: "EstadisticaCampeonato",
  tableName: "estadisticas_campeonato",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    partidoId: {
      type: "int",
    },
    usuarioId: {
      type: "int",
    },
    equipoId: {
      type: "int",
    },
    goles: {
      type: "int",
      default: 0,
    },
    asistencias: {
      type: "int",
      default: 0,
    },
    tarjetasAmarillas: {
      type: "int",
      default: 0,
    },
    tarjetasRojas: {
      type: "int",
      default: 0,
    },
    minutosJugados: {
      type: "int",
      default: 0,
    },
    arcosInvictos: {
      type: "int",
      default: 0,
    },
    fechaRegistro: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    partido: {
      type: "many-to-one",
      target: "Partido",
      joinColumn: { name: "partidoId" },
      onDelete: "CASCADE",
    },
    usuario: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: { name: "usuarioId" },
    },
    equipo: {
      type: "many-to-one",
      target: "Equipo",
      joinColumn: { name: "equipoId" },
    },
  },
  indices: [
    { name: "idx_estadisticas_partido", columns: ["partidoId"] },
    { name: "idx_estadisticas_usuario", columns: ["usuarioId"] },
    { name: "idx_estadisticas_equipo", columns: ["equipoId"] },
  ],
});

export default EstadisticaCampeonatoSchema;