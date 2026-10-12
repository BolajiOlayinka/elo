const Joi = require('joi');

/**
 * Schema for user login
 */
const login_schema = Joi.object({
    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),

    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        }),

    role: Joi.string()
        .valid('parent', 'driver')
        .required()
        .messages({
            'string.empty': 'Role is required',
            'any.only': 'Role must be either parent or driver',
            'any.required': 'Role is required'
        })
});

module.exports = { login_schema };
