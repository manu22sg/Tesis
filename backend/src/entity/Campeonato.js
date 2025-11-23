import { EntitySchema } from "typeorm";

const CampeonatoSchema = new EntitySchema({
  name: "Campeonato",
  tableName: "campeonatos",
  columns: {
    id: { type: "int", primary: true, generated: true },
    nombre: { type: "varchar", length: 100 },
    formato: { type: "varchar", length: 10 }, // 5v5, 7v7, 11v11
    descripcion: { type: "text", nullable: true },
    genero: { type: "varchar", length: 20 }, // masculino, femenino, mixto
    anio: { type: "int", nullable: false },
    semestre: { type: "int", nullable: false },
    estado: { type: "varchar", length: 20, default: "creado" }, 
    entrenadorId: { type: "int", nullable: false },
    tipoCampeonato: { 
      type: "varchar", 
      length: 20, 
      default: "intercarrera",
      comment: "mechon, intercarrera"
    },

    fechaCreacion: { type: "timestamp", createDate: true },
    fechaActualizacion: { type: "timestamp", updateDate: true },
  },
  relations: {
    entrenador: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: { name: "entrenadorId" },
      onDelete: "CASCADE",
    },
    equipos: {
      type: "one-to-many",
      target: "EquipoCampeonato",
      inverseSide: "campeonato",
    },
    partidos: {
      type: "one-to-many",
      target: "PartidoCampeonato",
      inverseSide: "campeonato",
    },
  },
  indices: [
    { name: "idx_campeonato_estado", columns: ["estado"] },
    { name: "idx_campeonato_anio_semestre", columns: ["anio", "semestre"] },
  ],
});

export default CampeonatoSchema;
