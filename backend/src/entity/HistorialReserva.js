import { EntitySchema } from "typeorm";
const HistorialReservaSchema = new EntitySchema({
    name: "HistorialReserva",
    tableName: "historial_reservas",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true,
        },
        reservaId: {
            type: "int",
        },
        accion: {
            type: "varchar",
            length: 20,
        },
        fechaAccion: {
            type: "timestamp",
            createDate: true,
        },
        observacion: {
            type: "text",
            nullable: true,
        },
        usuarioId: {
            type: "int",
            nullable: true
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
            onDelete: "CASCADE",
        },
    },
});
export default HistorialReservaSchema;