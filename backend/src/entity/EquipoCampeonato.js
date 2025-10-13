import { EntitySchema } from "typeorm";

const EquipoCampeonatoSchema = new EntitySchema({
  name: "EquipoCampeonato",
  tableName: "equipos_campeonato",
  columns: {
    id: { type: "int", primary: true, generated: true },
    campeonatoId: { type: "int", nullable: false },
    nombre: { type: "varchar", length: 100 },
    carrera: { type: "varchar", length: 100, nullable: true },
    tipo: { type: "varchar", length: 20 }, // masculino, femenino, mixto
    ordenLlave: { type: "int", nullable: true }, // Para torneos con llave

    fechaInscripcion: { type: "timestamp", default: () => "CURRENT_TIMESTAMP" },
  },
  relations: {
    campeonato: {
      type: "many-to-one",
      target: "Campeonato",
      joinColumn: { name: "campeonatoId" },
      onDelete: "CASCADE",
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
  ],
});

export default EquipoCampeonatoSchema;
