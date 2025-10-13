import { EntitySchema } from "typeorm";
const EntrenamientoSesionSchema = new EntitySchema({
    name: "EntrenamientoSesion",
    tableName: "entrenamientos_sesion",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true,
        },
        sesionId: {
            type: "int",
        },
        titulo: {
            type: "varchar",
            length: 100,
        },
        descripcion: {
            type: "text",
            nullable: true,
        },
        duracionMin: {
            type: "int",
            nullable: true,
        },
        orden: {
            type: "int",
            nullable: true,
        },
        fechaCreacion: {
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
    },
});
export default EntrenamientoSesionSchema;