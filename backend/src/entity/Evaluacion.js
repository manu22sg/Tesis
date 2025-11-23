import { EntitySchema } from "typeorm";

const EvaluacionSchema = new EntitySchema({
  name: "Evaluacion",
  tableName: "evaluaciones",
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
    tecnica: {
      type: "int",
      nullable: true,
    },
    tactica: {
      type: "int",
      nullable: true,
    },
    actitudinal: {
      type: "int",
      nullable: true,
    },
    fisica: {
      type: "int",
      nullable: true,
    },
    observaciones: {
      type: "text",
      nullable: true,
    },
    fechaRegistro: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
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
  uniques: [
  { name: "uq_evaluacion_jugador_sesion", columns: ["jugadorId", "sesionId"] }
]
  ,
  indices: [
    {
      name: "idx_evaluaciones_jugador_sesion",
      columns: ["jugadorId", "sesionId"],
    },
    {
      name: "idx_evaluaciones_fecha",
      columns: ["fechaRegistro"],
    },
    
  ],
});

export default EvaluacionSchema;
