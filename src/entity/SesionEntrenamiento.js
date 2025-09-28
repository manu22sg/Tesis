import { EntitySchema } from "typeorm";

const SesionEntrenamientoSchema = new EntitySchema({
  name: "SesionEntrenamiento",
  tableName: "sesiones_entrenamiento",
  columns: {
    id: { type: "int", primary: true, generated: true },
  canchaId: { type: "int", nullable: false },

    fecha: { type: "date" },
    horaInicio: { type: "time" },
    horaFin: { type: "time" },
    tipoSesion: { type: "varchar", length: 50 },
    objetivos: { type: "text", nullable: true },

    //  FK al grupo 
    grupoId: { type: "int", nullable: true },

    // Token (no cambia la estructura)
    token: { type: "varchar", length: 20, nullable: true },
    tokenActivo: { type: "boolean", default: false },
    tokenExpiracion: { type: "timestamp", nullable: true },

    fechaCreacion: { type: "timestamp", createDate: true },
    fechaActualizacion: { type: "timestamp", updateDate: true, nullable: true },
  },
  relations: {
    cancha: {
    type: "many-to-one",
    target: "Cancha",
    joinColumn: { name: "canchaId" },
    onDelete: "RESTRICT",
  },

    grupo: {
      type: "many-to-one",
      target: "GrupoJugador",
      joinColumn: { name: "grupoId" },
      onDelete: "SET NULL",
    },

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
    { name: "idx_sesiones_fecha", columns: ["fecha"] },
    { name: "idx_sesiones_tipo", columns: ["tipoSesion"] },
    { name: "idx_sesiones_token", columns: ["token"] },
    { name: "idx_sesiones_grupo", columns: ["grupoId"] },
    { name: "idx_sesiones_cancha", columns: ["canchaId"] },
  ],
});

export default SesionEntrenamientoSchema;
