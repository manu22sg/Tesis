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
      nullable: false,
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
    
    sesiones: {
      type: "one-to-many",
      target: "SesionEntrenamiento",
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
