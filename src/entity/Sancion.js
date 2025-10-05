import { EntitySchema } from "typeorm";

const SancionSchema = new EntitySchema({
  name: "Sancion",
  tableName: "sanciones",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    usuarioId: {
      type: "int",
    },
    partidoId: {
      type: "int",
    },
    campeonatoId: {
      type: "int",
    },
    tipo: {
      type: "varchar",
      length: 30,
    },
    partidosSuspension: {
      type: "int",
      default: 1,
    },
    cumplida: {
      type: "boolean",
      default: false,
    },
    observaciones: {
      type: "text",
      nullable: true,
    },
    fechaRegistro: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    usuario: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: { name: "usuarioId" },
    },
    partido: {
      type: "many-to-one",
      target: "Partido",
      joinColumn: { name: "partidoId" },
    },
    campeonato: {
      type: "many-to-one",
      target: "Campeonato",
      joinColumn: { name: "campeonatoId" },
    },
  },
  indices: [
    { name: "idx_sanciones_usuario", columns: ["usuarioId"] },
    { name: "idx_sanciones_partido", columns: ["partidoId"] },
    { name: "idx_sanciones_cumplida", columns: ["cumplida"] },
  ],
});

export default SancionSchema;