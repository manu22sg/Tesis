import { EntitySchema } from "typeorm";

const GrupoJugadorSchema = new EntitySchema({
  name: "GrupoJugador",
  tableName: "grupos_jugadores",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    nombre: {
      type: "varchar",
      length: 50,
      unique: true,
    },
    descripcion: {
      type: "text",
      nullable: true,
    },
    fechaCreacion: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    // 🔥 relación con la tabla intermedia
    jugadorGrupos: {
      type: "one-to-many",
      target: "JugadorGrupo",
      inverseSide: "grupo",
    },
  },
  indices: [
    {
      name: "idx_gruposjugadores_nombre",
      columns: ["nombre"],
      unique: true,
    },
  ],
});

export default GrupoJugadorSchema;
