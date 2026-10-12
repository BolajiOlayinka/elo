const Joi = require('joi');

const reset_password_schema = Joi.object({
    reset_code: Joi.string().required(),
    new_password: Joi.string().required()
});

module.exports = { reset_password_schema };
