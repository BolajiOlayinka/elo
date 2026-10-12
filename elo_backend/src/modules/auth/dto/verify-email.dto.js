const Joi = require('joi');

/**
 * Schema for email verification
 */
const verify_email_schema = Joi.object({
    verification_code: Joi.string()
        .trim()
        .uppercase()
        .required()
        .messages({
            'string.empty': 'Verification code is required',
            'any.required': 'Verification code is required'
        })
});

module.exports = { verify_email_schema };
