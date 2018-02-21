import * as Joi from "joi";

export const getPassportTokenModel = Joi.object().keys({
    email: Joi.string().email().trim().required(),
    password: Joi.string().trim().required()
});
