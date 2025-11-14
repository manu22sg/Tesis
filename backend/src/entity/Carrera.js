import { EntitySchema } from "typeorm";

const CarreraSchema = new EntitySchema({
  name: "Carrera",
  tableName: "carreras",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    nombre: {
      type: "varchar",
      length: 100,
      unique: true,
    },
  },
  relations: {
    usuarios: {
      type: "one-to-many",
      target: "Usuario",
      inverseSide: "carrera",
    },
  },
  indices: [
    {
      name: "idx_carreras_nombre",
      columns: ["nombre"],
    },
  ],
});

export default CarreraSchema;
