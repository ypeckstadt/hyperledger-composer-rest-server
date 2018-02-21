import * as Joi from "joi";

export const jwtValidator = Joi.object({'authorization': Joi.string().required()}).unknown();
