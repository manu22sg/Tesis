import { EntitySchema } from "typeorm";

const ParticipanteEquipoSchema = new EntitySchema({
  name: "ParticipanteEquipo",
  tableName: "participante_equipo",
  columns: {
    usuarioId: {
      type: "int",
      primary: true,
    },
    equipoId: {
      type: "int",
      primary: true,
    },
    numeroJugador: {  
      type: "int",
      nullable: true,
      comment: "Número de camiseta o dorsal del jugador",
    },
    posicion: {
      type: "varchar",
      length: 30,
      nullable: true,
    },
    esCapitan: {
      type: "boolean",
      default: false,
    },
    fechaInscripcion: {
      type: "timestamp",
      createDate: true,
    },
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
      target: "Equipo",
      joinColumn: { name: "equipoId" },
      onDelete: "CASCADE",
    },
    estadisticasCampeonato: {
      type: "one-to-many",
      target: "EstadisticaCampeonato",
      inverseSide: "participante",
    },
  },
  indices: [
    { name: "idx_participante_usuario", columns: ["usuarioId"] },
    { name: "idx_participante_equipo", columns: ["equipoId"] },
  ],
});

export default ParticipanteEquipoSchema;