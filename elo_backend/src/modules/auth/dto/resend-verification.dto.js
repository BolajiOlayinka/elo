const Joi = require('joi');

/**
 * Schema for resend verification email
 */
const resend_verification_schema = Joi.object({
    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        })
});

module.exports = { resend_verification_schema };
