import { EntitySchema } from "typeorm";
const LesionSchema = new EntitySchema({
    name: "Lesion",
    tableName: "lesiones",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true,
        },
        jugadorId: {
            type: "int",
        },
        diagnostico: {
            type: "text",
        },
        fechaInicio: {
            type: "date",
        },
        fechaAltaEstimada: {
            type: "date",
            nullable: true,
        },
        fechaAltaReal: {
            type: "date",
            nullable: true,
        },
        fechaCreacion: {
            type: "timestamp",
            createDate: true,
        },
    },
    relations: {
        jugador: {
            type: "many-to-one",
            target: "Jugador",
            joinColumn: { name: "jugadorId" },
            onDelete: "CASCADE",
        },
    },
});
export default LesionSchema;