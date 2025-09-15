import { EntitySchema } from "typeorm";

const ReservaCanchaSchema = new EntitySchema({
  name: "ReservaCancha",
  tableName: "reservas_cancha",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    usuarioId: {
      type: "int",
    },
    fechaSolicitud: {
      type: "date",
    },
    horaInicio: {
      type: "time",
    },
    horaFin: {
      type: "time",
    },
    motivo: {
      type: "text",
      nullable: true,
    },
    estado: {
      type: "varchar",
      length: 20,
      default: "pendiente",
    },
    confirmado: {
      type: "boolean",
      default: false,
    },
    fechaCreacion: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    usuario: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: {
        name: "usuarioId",
      },
      onDelete: "CASCADE",
    },
    participantes: {
      type: "one-to-many",
      target: "ParticipanteReserva",
      inverseSide: "reserva",
    },
    historial: {
      type: "one-to-many",
      target: "HistorialReserva",
      inverseSide: "reserva",
    },
  },
  indices: [
    {
      name: "idx_reservas_usuario",
      columns: ["usuarioId"],
    },
    {
      name: "idx_reservas_fecha",
      columns: ["fechaSolicitud"],
    },
    {
      name: "idx_reservas_estado",
      columns: ["estado"],
    },
  ],
});

export default ReservaCanchaSchema;
