import * as Joi from "joi";

export const createModel = Joi.object().keys({
  id: Joi.string().required(),
  code: Joi.string().required(),
  driverId: Joi.string().allow('').optional(),
  cargoIds: Joi.array().optional()
});

export const updateModel = Joi.object().keys({
  id: Joi.string().required(),
  code: Joi.string().required(),
  driverId: Joi.string().allow('').optional(),
  cargoIds: Joi.array().optional()
});

export const changeDriverModel = Joi.object().keys({
  driverId: Joi.string().required()
});
