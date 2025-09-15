import { EntitySchema } from "typeorm";
const EstadisticaBasicaSchema = new EntitySchema({
    name: "EstadisticaBasica",
    tableName: "estadisticas_basicas",
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
        goles: {
            type: "int",
            default: 0,
        },
        asistencias: {
            type: "int",
            default: 0,
        },
        tarjetasAmarillas: {
            type: "int",
            default: 0,
        },
        tarjetasRojas: {
            type: "int",
            default: 0,
        },
        minutosJugados: {
            type: "int",
            default: 0,
        },
        arcosInvictos: {
            type: "int",
            default: 0,
        },
        fechaRegistro: {
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
        sesion: {
            type: "many-to-one",
            target: "SesionEntrenamiento",
            joinColumn: { name: "sesionId" },
            onDelete: "CASCADE",
        },
    },
    indices: [
        {
            name: "idx_estadisticas_jugador_sesion",
            columns: ["jugadorId", "sesionId"],
        },
        {
            name: "idx_estadisticas_fecha",
            columns: ["fechaRegistro"],
        },
    ],
});
export default EstadisticaBasicaSchema;