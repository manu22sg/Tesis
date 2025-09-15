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
    },
    carrera: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    telefono: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    estado: {
      type: "varchar",
      length: 20,
      default: "activo",
    },
    fechaNacimiento: {
      type: "date",
      nullable: true,
    },
    anioIngreso: {
      type: "int",
      nullable: true,
    },
    fechaCreacion: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    usuario: {
      type: "one-to-one",
      target: "Usuario",
      joinColumn: {
        name: "usuarioId",
      },
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
    grupos: {
      type: "many-to-many",
      target: "GrupoJugador",
      joinTable: {
        name: "jugador_grupo",
        joinColumn: {
          name: "jugador_id",
          referencedColumnName: "id",
        },
        inverseJoinColumn: {
          name: "grupo_id",
          referencedColumnName: "id",
        },
      },
    },
  },
  indices: [
    {
      name: "idx_jugadores_usuario_id",
      columns: ["usuarioId"],
    },
    {
      name: "idx_jugadores_estado",
      columns: ["estado"],
    },
  ],
});
export default JugadorSchema;