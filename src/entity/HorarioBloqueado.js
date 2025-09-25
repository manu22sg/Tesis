import { EntitySchema } from "typeorm";

const HorarioBloqueadoSchema = new EntitySchema({
  name: "HorarioBloqueado",
  tableName: "horarios_bloqueados",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    canchaId: {
      type: "int",
    },
    fecha: {
      type: "date",
    },
    horaInicio: {
      type: "time",
    },
    horaFin: {
      type: "time",
    },
    motivo: {
      type: "varchar",
      length: 100, // "entrenamiento_masculino", "entrenamiento_femenino", "mantenimiento"
    },
    descripcion: {
      type: "text",
      nullable: true,
    },
    tipoBloqueo: {
      type: "varchar",
      length: 20,
      default: "entrenamiento", // entrenamiento, mantenimiento, evento_especial
    },
    fechaCreacion: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    cancha: {
      type: "many-to-one",
      target: "Cancha",
      joinColumn: { name: "canchaId" },
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "idx_horario_fecha_cancha",
      columns: ["fecha", "canchaId"],
    },
    {
      name: "idx_horario_tipo",
      columns: ["tipoBloqueo"],
    },
  ],
});

export default HorarioBloqueadoSchema;