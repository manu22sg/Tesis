import { EntitySchema } from "typeorm";

const EstadisticaCampeonatoSchema = new EntitySchema({
  name: "EstadisticaCampeonato",
  tableName: "estadisticas_campeonato",
  columns: {
    id: { type: "int", primary: true, generated: true },
    jugadorCampeonatoId: { type: "int", nullable: false },
    partidoId: { type: "int", nullable: false },
    goles: { type: "int", default: 0 },
    asistencias: { type: "int", default: 0 },
    atajadas: { type: "int", default: 0 },
    tarjetasAmarillas: { type: "int", default: 0 },
    tarjetasRojas: { type: "int", default: 0 },
    minutosJugados: { type: "int", default: 0 },
    fechaRegistro: { type: "timestamp", createDate: true },
  },
  relations: {
    jugadorCampeonato: {
      type: "many-to-one",
      target: "JugadorCampeonato",
      joinColumn: { name: "jugadorCampeonatoId" },
      onDelete: "CASCADE",
    },
    partido: {
      type: "many-to-one",
      target: "PartidoCampeonato",
      joinColumn: { name: "partidoId" },
      onDelete: "CASCADE",
    },
  },
  uniques: [
    { name: "uq_estadistica_jugador_partido", columns: ["jugadorCampeonatoId", "partidoId"] },
  ],
});

export default EstadisticaCampeonatoSchema;
