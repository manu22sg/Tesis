import { EntitySchema } from "typeorm";

const CanchaSchema = new EntitySchema({
  name: "Cancha",
  tableName: "canchas",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    nombre: {
      type: "varchar",
      length: 100,
    },
    descripcion: {
      type: "text",
      nullable: true,
    },
    capacidadMaxima: {
      type: "int",
      default: 12, // Máximo 12 jugadores como mencionaste
    },
    estado: {
      type: "varchar",
      length: 20,
      default: "disponible", // disponible, mantenimiento, fuera_servicio
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
    reservas: {
      type: "one-to-many",
      target: "ReservaCancha",
      inverseSide: "cancha",
    },
    horariosBloquedos: {
      type: "one-to-many",
      target: "HorarioBloqueado",
      inverseSide: "cancha",
    },
  },
  indices: [
    {
      name: "idx_cancha_estado",
      columns: ["estado"],
    },
  ],
});

export default CanchaSchema;