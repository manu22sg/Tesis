import Joi from "joi";

// Crear
export const crearGrupoSchema = Joi.object({
  nombre: Joi.string().max(50).required().messages({
    "any.required": "El nombre es requerido",
    "string.max": "El nombre no puede tener más de 50 caracteres",
  }),
  descripcion: Joi.string().max(255).optional().messages({
    "string.max": "La descripción no puede tener más de 255 caracteres",
  }),
});

// Actualizar (al menos un campo)
export const actualizarGrupoSchema = Joi.object({
  nombre: Joi.string().max(50).optional().messages({
    "string.max": "El nombre no puede tener más de 50 caracteres",
  }),
  descripcion: Joi.string().max(255).optional().messages({
    "string.max": "La descripción no puede tener más de 255 caracteres",
  }),
}).min(1).messages({
  "object.min": "Debe proporcionar al menos un campo para actualizar",
});
