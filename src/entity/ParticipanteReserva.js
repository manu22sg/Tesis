import { EntitySchema } from "typeorm";
const ParticipanteReservaSchema = new EntitySchema({
    name: "ParticipanteReserva",
    tableName: "participantes_reserva",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true,
        },
        reservaId: {
            type: "int",
        },
        usuarioId: {
            type: "int",
            nullable: true,
        },
        rut: {
            type: "varchar",
            length: 15,
            nullable: true,
        },
        nombreOpcional: {
            type: "varchar",
            length: 100,
            nullable: true,
        },
        fechaCreacion: {
            type: "timestamp",
            createDate: true,
        },
    },
    relations: {
        reserva: {
            type: "many-to-one",
            target: "ReservaCancha",
            joinColumn: { name: "reservaId" },
            onDelete: "CASCADE",
        },
        usuario: {
            type: "many-to-one",
            target: "Usuario",
            joinColumn: { name: "usuarioId" },
            onDelete: "SET NULL",
        },
    },
});
export default ParticipanteReservaSchema;