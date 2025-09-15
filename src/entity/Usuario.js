import { EntitySchema } from "typeorm";

const UsuarioSchema = new EntitySchema({
  name: "Usuario",
  tableName: "usuarios",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    rut: {
      type: "varchar",
      length: 15,
      unique: true,
    },
    nombre: {
      type: "varchar",
      length: 100,
    },
    email: {
      type: "varchar",
      length: 100,
      unique: true,
    },
    password: {
      type: "text",
    },
    rol: {
      type: "varchar",
      length: 20,
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
    jugador: {
      type: "one-to-one",
      target: "Jugador",
      inverseSide: "usuario",
    },
    reservas: {
      type: "one-to-many",
      target: "ReservaCancha",
      inverseSide: "usuario",
    },
    notificaciones: {
      type: "one-to-many",
      target: "Notificacion",
      inverseSide: "usuario",
    },
    participaciones: {
      type: "one-to-many",
      target: "ParticipanteReserva",
      inverseSide: "usuario",
    },
    historialesReserva: {
      type: "one-to-many",
      target: "HistorialReserva",
      inverseSide: "usuario",
    },
  },
  indices: [
    {
      name: "idx_usuarios_rut",
      columns: ["rut"],
    },
    {
      name: "idx_usuarios_email",
      columns: ["email"],
    },
    {
      name: "idx_usuarios_rol",
      columns: ["rol"],
    },
  ],
});

export default UsuarioSchema;
