import { EntitySchema } from "typeorm";
const JugadorGrupoSchema = new EntitySchema({
    name: "JugadorGrupo",
    tableName: "jugador_grupo",
    columns: {
        jugadorId: {
            type: "int",
            primary: true,
        },
        grupoId: {
            type: "int",
            primary: true,
        },
        fechaAsignacion: {
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
        grupo: {
            type: "many-to-one",
            target: "GrupoJugador",
            joinColumn: { name: "grupoId" },
            onDelete: "CASCADE",
        },
    },
});

export default JugadorGrupoSchema;
