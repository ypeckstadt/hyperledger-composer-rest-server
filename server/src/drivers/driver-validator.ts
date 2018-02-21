import * as Joi from "joi";

export const createModel = Joi.object().keys({
  id: Joi.string().required(),
  email: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  address: Joi.object().required().keys({
    country: Joi.string().required(),
    city: Joi.string().required()
  })
});

export const updateModel = Joi.object().keys({
  id: Joi.string().required(),
  email: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  address: Joi.object().required().keys({
    country: Joi.string().required(),
    city: Joi.string().required()
  })
});
