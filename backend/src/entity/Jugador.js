import { EntitySchema } from "typeorm";

const JugadorSchema = new EntitySchema({
  name: "Jugador",
  tableName: "jugadores",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    usuarioId: {
      type: "int",
      unique: true,
    },
    anioIngreso: {
      type: "int",
      nullable: true,
    },
    fechaNacimiento: {
      type: "date",
      nullable: true,
    },
    posicion: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    posicionSecundaria: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    piernaHabil: {
      type: "varchar",
      length: 10,
      nullable: false,
    },
    altura: {
      type: "decimal",
      precision: 5,
      scale: 2,
      nullable: true,
    },
    peso: {
      type: "decimal",
      precision: 5,
      scale: 2,
      nullable: true,
    },
    imc: {
      type: "decimal",
      precision: 5,
      scale: 2,
      nullable: true,
    },
    estado: {
      type: "varchar",
      length: 20,
      default: "activo",
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
    usuario: {
      type: "one-to-one",
      target: "Usuario",
      joinColumn: { name: "usuarioId" },
      onDelete: "CASCADE",
    },
    asistencias: {
      type: "one-to-many",
      target: "Asistencia",
      inverseSide: "jugador",
    },
    evaluaciones: {
      type: "one-to-many",
      target: "Evaluacion",
      inverseSide: "jugador",
    },
    estadisticas: {
      type: "one-to-many",
      target: "EstadisticaBasica",
      inverseSide: "jugador",
    },
    lesiones: {
      type: "one-to-many",
      target: "Lesion",
      inverseSide: "jugador",
    },
    alineaciones: {
      type: "one-to-many",
      target: "AlineacionJugador",
      inverseSide: "jugador",
    },
    jugadorGrupos: {
      type: "one-to-many",
      target: "JugadorGrupo",
      inverseSide: "jugador",
    },
  },

  indices: [
    { name: "idx_jugadores_usuario_id", columns: ["usuarioId"], unique: true },
    { name: "idx_jugadores_estado", columns: ["estado"] },
    { name: "idx_jugadores_posicion", columns: ["posicion"] },
  ],
});

export default JugadorSchema;
