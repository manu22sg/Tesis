import { EntitySchema } from "typeorm";

const AlineacionSchema = new EntitySchema({
    name: "Alineacion",
    tableName: "alineaciones",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true,
        },
        sesionId: {
            type: "int",
        },
        generadaAuto: {
            type: "boolean",
            default: false,
        },
        fechaGeneracion: {
            type: "timestamp",
            createDate: true,
        },
    },
    relations: {
        sesion: {
            type: "many-to-one",
            target: "SesionEntrenamiento",
            joinColumn: { name: "sesionId" },
            onDelete: "CASCADE",
        },
        jugadores: {
            type: "one-to-many",
            target: "AlineacionJugador",
            inverseSide: "alineacion",
        },
    },
});

export default AlineacionSchema;