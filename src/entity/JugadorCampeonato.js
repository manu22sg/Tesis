import { EntitySchema } from "typeorm";

const JugadorCampeonatoSchema = new EntitySchema({
  name: "JugadorCampeonato",
  tableName: "jugadores_campeonato",
  columns: {
    id: { type: "int", primary: true, generated: true },
    usuarioId: { type: "int", nullable: false },
    equipoId: { type: "int", nullable: false },
    campeonatoId: { type: "int", nullable: false },
    numeroCamiseta: { type: "int", nullable: true },
    posicion: { type: "varchar", length: 50, nullable: true },
    golesCampeonato: { type: "int", default: 0 },
    asistenciasCampeonato: { type: "int", default: 0 },
    atajadasCampeonato: { type: "int", default: 0 },
    fechaInscripcion: { type: "timestamp", default: () => "CURRENT_TIMESTAMP" },
  },
  relations: {
    usuario: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: { name: "usuarioId" },
      onDelete: "CASCADE",
    },
    equipo: {
      type: "many-to-one",
      target: "EquipoCampeonato",
      joinColumn: { name: "equipoId" },
      onDelete: "CASCADE",
    },
    campeonato: {
      type: "many-to-one",
      target: "Campeonato",
      joinColumn: { name: "campeonatoId" },
      onDelete: "CASCADE",
    },
    estadisticas: {
      type: "one-to-many",
      target: "EstadisticaCampeonato",
      inverseSide: "jugadorCampeonato",
    },
  },
  indices: [
    { name: "idx_jugador_campeonato_usuario", columns: ["usuarioId"] },
    { name: "idx_jugador_campeonato_equipo", columns: ["equipoId"] },
  ],
  uniques: [
    { name: "uq_jugador_unico_en_campeonato", columns: ["usuarioId", "campeonatoId"] },
  ],
});

export default JugadorCampeonatoSchema;
