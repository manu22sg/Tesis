import { EntitySchema } from "typeorm";
const AlineacionSchema = new EntitySchema({
  name: "Alineacion",
  tableName: "alineaciones",
  columns: {
    id: { type: "int", primary: true, generated: true },
    sesionId: { type: "int" },
    generadaAuto: { type: "boolean", default: false },
    fechaGeneracion: { type: "timestamp", createDate: true },
  },
  relations: {
    sesion: { type: "many-to-one", target: "SesionEntrenamiento", joinColumn: { name: "sesionId" }, onDelete: "CASCADE" },
    jugadores: { type: "one-to-many", target: "AlineacionJugador", inverseSide: "alineacion" },
  },
  indices: [{ name: "idx_alineacion_sesion", columns: ["sesionId"] }],
  uniques: [{ name: "uq_alineacion_por_sesion", columns: ["sesionId"] }], // 1 alineación por sesión (si te sirve)
});
export default AlineacionSchema;
