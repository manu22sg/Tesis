import { EntitySchema } from "typeorm";
const GrupoJugadorSchema = new EntitySchema({
    name: "GrupoJugador",
    tableName: "grupos_jugadores",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true,
        },
        nombre: {
            type: "varchar",
            length: 50,
            unique: true,
        },
        descripcion: {
            type: "text",
            nullable: true,
        },
        fechaCreacion: {
            type: "timestamp",
            createDate: true,
        },
    },
    relations: {
        jugadores: {
            type: "many-to-many",
            target: "Jugador",
            inverseSide: "grupos",
        },
    },
});
export default GrupoJugadorSchema;