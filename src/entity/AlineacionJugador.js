import { EntitySchema } from "typeorm";
const AlineacionJugadorSchema = new EntitySchema({
    name: "AlineacionJugador",
    tableName: "alineacion_jugador",
    columns: {
        alineacionId: {
            type: "int",
            primary: true,
        },
        jugadorId: {
            type: "int",
            primary: true,
        },
        posicion: {
            type: "varchar",
            length: 20,
        },
        orden: {
            type: "int",
            nullable: true,
        },
        comentario: {
            type: "text",
            nullable: true,
        },
    },
    relations: {
        alineacion: {
            type: "many-to-one",
            target: "Alineacion",
            joinColumn: { name: "alineacionId" },
            onDelete: "CASCADE",
        },
        jugador: {
            type: "many-to-one",
            target: "Jugador",
            joinColumn: { name: "jugadorId" },
            onDelete: "CASCADE",
        },
    },
});
export default AlineacionJugadorSchema;