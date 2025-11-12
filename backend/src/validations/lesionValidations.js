import Joi from 'joi';
import { validationError } from '../utils/responseHandler.js';

const idNum = Joi.number().integer().positive().required();

export const crearLesionBody = Joi.object({
  jugadorId: idNum.label('jugadorId'),
  diagnostico: Joi.string().trim().max(2000).required(),
  fechaInicio: Joi.date().iso().required(),
  fechaAltaEstimada: Joi.date().iso().greater(Joi.ref('fechaInicio')).optional().allow(null),
  fechaAltaReal: Joi.date().iso().greater(Joi.ref('fechaInicio')).optional().allow(null),
});

export const actualizarLesionBody = Joi.object({
  diagnostico: Joi.string().trim().max(2000),
  fechaInicio: Joi.date().iso(),
  fechaAltaEstimada: Joi.date().iso().allow(null),
  fechaAltaReal: Joi.date().iso().allow(null),
})
  .custom((v, helpers) => {
    if (v.fechaInicio && v.fechaAltaReal && new Date(v.fechaAltaReal) <= new Date(v.fechaInicio)) {
      return helpers.message('fechaAltaReal debe ser mayor a fechaInicio');
    }
    if (v.fechaInicio && v.fechaAltaEstimada && new Date(v.fechaAltaEstimada) <= new Date(v.fechaInicio)) {
      return helpers.message('fechaAltaEstimada debe ser mayor a fechaInicio');
    }
    return v;
  })
  .or('diagnostico', 'fechaInicio', 'fechaAltaEstimada', 'fechaAltaReal') // al menos uno
  .messages({
    'object.missing': 'Debe enviar al menos un campo para actualizar',
  });

export const obtenerLesionesQuery = Joi.object({
  pagina: Joi.number().integer().min(1).default(1),
  limite: Joi.number().integer().min(1).max(50).default(10),
  jugadorId: Joi.number().integer().positive().optional(),
  desde: Joi.date().iso().optional(),
  hasta: Joi.date().iso().optional(),
});

export const idParamSchema = Joi.object({ id: idNum });




export const validarBody = (schema)=>(req,res,next)=>{
  const { error, value } = schema.validate(req.body, { abortEarly:false, stripUnknown:true });
  if (error) {
    const errors = error.details.map(d=>({ field:d.path.join('.'), message:d.message }));
    return validationError(res, errors);
  }
  req.body = value; next();
};
export const validarQuery = (schema)=>(req,res,next)=>{
  const { error, value } = schema.validate(req.query, { abortEarly:false, stripUnknown:true });
  if (error) {
    const errors = error.details.map(d=>({ field:d.path.join('.'), message:d.message }));
    return validationError(res, errors);
  }
  Object.assign(req.query, value); next();
};
export const validarParams = (schema)=>(req,res,next)=>{
  const { error, value } = schema.validate(req.params, { abortEarly:false, stripUnknown:true });
  if (error) {
    const errors = error.details.map(d=>({ field:d.path.join('.'), message:d.message }));
    return validationError(res, errors);
  }
  req.params = value; next();
};
