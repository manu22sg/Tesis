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
    apellido: {
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
    sexo: {
      type: "varchar",
      length: 10,
      nullable: false,
    },
    estado: {
      type: "varchar",
      length: 20,
      default: "pendiente",
    },
    carreraId: {
      type: "int",
      nullable: true, // alumnos la usan, académicos/admin pueden tenerla null
    },
    anioIngresoUniversidad: { 
    type: "int", 
    nullable: true,
  },

    verificado: {
      type: "boolean",
      default: false, 
      nullable: true,
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
    carrera: {
      type: "many-to-one",
      target: "Carrera",
      joinColumn: { name: "carreraId" },
    },
    jugadoresCampeonato: {
      type: "one-to-many",
      target: "JugadorCampeonato",
      inverseSide: "usuario",
    },
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
    {
      name: "idx_usuarios_carrera",
      columns: ["carreraId"],
    },
  ],
});

export default UsuarioSchema;
