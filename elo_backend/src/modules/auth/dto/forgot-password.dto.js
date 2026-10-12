const Joi = require('joi');

const forgot_password_schema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Invalid email format',
            'any.required': 'Email is required'
        })
});

module.exports = {
    forgot_password_schema
};
