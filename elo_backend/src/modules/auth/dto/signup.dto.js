const Joi = require('joi');

/**
 * Schema for user signup
 */
const signup_schema = Joi.object({
    first_name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .custom((value) => value?.toLowerCase().replace(/(^\w|\s\w)/, (match) => match.toUpperCase()))
        .messages({
            'string.empty': 'First name is required',
            'string.min': 'First name must be at least 1 character long',
            'string.max': 'First name must not exceed 100 characters',
            'any.required': 'First name is required'
        }),

    last_name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .custom((value) => value?.toLowerCase().replace(/(^\w|\s\w)/, (match) => match.toUpperCase()))
        .messages({
            'string.empty': 'Last name is required',
            'string.min': 'Last name must be at least 1 character long',
            'string.max': 'Last name must not exceed 100 characters',
            'any.required': 'Last name is required'
        }),

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
        .min(8)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'any.required': 'Password is required'
        }),

    role: Joi.string()
        .valid('parent', 'driver')
        .required()
        .messages({
            'string.empty': 'Role is required',
            'any.only': 'Role must be either parent or driver',
            'any.required': 'Role is required'
        }),

    phone: Joi.string()
        .trim()
        .pattern(/^[\d\s\-+()]+$/)
        .optional()
        .messages({
            'string.pattern.base': 'Phone number can only contain digits, spaces, and +()- characters'
        }),

    address: Joi.string()
        .trim()
        .max(255)
        .optional()
        .messages({
            'string.max': 'Address must not exceed 255 characters'
        }),

    city: Joi.string()
        .trim()
        .max(100)
        .optional()
        .messages({
            'string.max': 'City must not exceed 100 characters'
        }),

    state: Joi.string()
        .trim()
        .max(100)
        .optional()
        .messages({
            'string.max': 'State must not exceed 100 characters'
        }),

    zip_code: Joi.string()
        .trim()
        .max(20)
        .optional()
        .messages({
            'string.max': 'Zip code must not exceed 20 characters'
        }),

    country: Joi.string()
        .trim()
        .max(100)
        .optional()
        .messages({
            'string.max': 'Country must not exceed 100 characters'
        })
});

module.exports = { signup_schema };
