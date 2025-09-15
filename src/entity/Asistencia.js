
import { EntitySchema } from "typeorm";

const AsistenciaSchema = new EntitySchema({
  name: "Asistencia",
  tableName: "asistencias",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    jugadorId: {
      type: "int",
    },
    sesionId: {
      type: "int",
    },
    estado: {
      type: "varchar",
      length: 20,
    },
    fechaRegistro: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    latitud: {
      type: "decimal",
      precision: 9,
      scale: 6,
      nullable: true,
    },
    longitud: {
      type: "decimal",
      precision: 9,
      scale: 6,
      nullable: true,
    },
    origen: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
  },
  relations: {
    jugador: {
      type: "many-to-one",
      target: "Jugador",
      joinColumn: {
        name: "jugadorId",
      },
      onDelete: "CASCADE",
    },
    sesion: {
      type: "many-to-one",
      target: "SesionEntrenamiento",
      joinColumn: {
        name: "sesionId",
      },
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "idx_asistencias_jugador_sesion",
      columns: ["jugadorId", "sesionId"],
    },
    {
      name: "idx_asistencias_fecha",
      columns: ["fechaRegistro"],
    },
    {
      name: "idx_asistencias_estado",
      columns: ["estado"],
    },
  ],
});
export default AsistenciaSchema;