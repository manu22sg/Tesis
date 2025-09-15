import { EntitySchema } from "typeorm";

const SesionEntrenamientoSchema = new EntitySchema({
  name: "SesionEntrenamiento",
  tableName: "sesiones_entrenamiento",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
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
    tipoSesion: {
      type: "varchar",
      length: 50,
    },
    objetivos: {
      type: "text",
      nullable: true,
    },
    grupoDestinatario: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    token: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    tokenActivo: {
      type: "boolean",
      default: false,
    },
    tokenExpiracion: {
      type: "timestamp",
      nullable: true,
    },
    fechaCreacion: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    entrenamientos: {
      type: "one-to-many",
      target: "EntrenamientoSesion",
      inverseSide: "sesion",
    },
    asistencias: {
      type: "one-to-many",
      target: "Asistencia",
      inverseSide: "sesion",
    },
    evaluaciones: {
      type: "one-to-many",
      target: "Evaluacion",
      inverseSide: "sesion",
    },
    estadisticas: {
      type: "one-to-many",
      target: "EstadisticaBasica",
      inverseSide: "sesion",
    },
    alineaciones: {
      type: "one-to-many",
      target: "Alineacion",
      inverseSide: "sesion",
    },
  },
  indices: [
    {
      name: "idx_sesiones_fecha",
      columns: ["fecha"],
    },
    {
      name: "idx_sesiones_tipo",
      columns: ["tipoSesion"],
    },
    {
      name: "idx_sesiones_token",
      columns: ["token"],
    },
  ],
});
export default SesionEntrenamientoSchema;