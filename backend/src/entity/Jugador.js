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
      unique: true, // cada usuario solo puede ser jugador una vez
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
    fechaActualizacion: {
       type: "timestamp", updateDate: true },
  },
  relations: {
    // relación uno a uno con Usuario
    usuario: {
      type: "one-to-one",
      target: "Usuario",
      joinColumn: { name: "usuarioId" },
      onDelete: "CASCADE",
    },

    // todas tus relaciones one-to-many
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

    // 🔥 ahora la relación con grupos se hace vía JugadorGrupo
    jugadorGrupos: {
      type: "one-to-many",
      target: "JugadorGrupo",
      inverseSide: "jugador",
    },
  },
  indices: [
    {
      name: "idx_jugadores_usuario_id",
      columns: ["usuarioId"],
      unique: true,
    },
    {
      name: "idx_jugadores_estado",
      columns: ["estado"],
    },
  ],
});

export default JugadorSchema;
