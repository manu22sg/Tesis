import { EntitySchema } from "typeorm";
const NotificacionSchema = new EntitySchema({
    name: "Notificacion",
    tableName: "notificaciones",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true,
        },
        usuarioId: {
            type: "int",
        },
        tipo: {
            type: "varchar",
            length: 50,
        },
        mensaje: {
            type: "text",
        },
        fechaEnvio: {
            type: "timestamp",
            createDate: true,
        },
        canal: {
            type: "varchar",
            length: 20,
        },
    },
    relations: {
        usuario: {
            type: "many-to-one",
            target: "Usuario",
            joinColumn: { name: "usuarioId" },
            onDelete: "CASCADE",
        },
    },
});
export default NotificacionSchema;