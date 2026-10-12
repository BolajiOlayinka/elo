const Joi = require('joi');

/**
 * Schema for updating an existing user
 * All fields are optional for partial updates
 */
const updateUserSchema = Joi.object({
    first_name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .optional()
        .messages({
            'string.empty': 'First name cannot be empty',
            'string.min': 'First name must be at least 1 character long',
            'string.max': 'First name must not exceed 100 characters'
        }),

    last_name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .optional()
        .messages({
            'string.empty': 'Last name cannot be empty',
            'string.min': 'Last name must be at least 1 character long',
            'string.max': 'Last name must not exceed 100 characters'
        }),

    email: Joi.string()
        .trim()
        .email()
        .optional()
        .messages({
            'string.empty': 'Email cannot be empty',
            'string.email': 'Please provide a valid email address'
        }),

    password: Joi.string()
        .min(8)
        .optional()
        .messages({
            'string.min': 'Password must be at least 8 characters long'
        }),

    phone: Joi.string()
        .trim()
        .pattern(/^[\d\s\-+()]+$/)
        .allow('')
        .optional()
        .messages({
            'string.pattern.base': 'Phone number can only contain digits, spaces, and +()- characters'
        }),

    address: Joi.string()
        .trim()
        .max(255)
        .allow('')
        .optional()
        .messages({
            'string.max': 'Address must not exceed 255 characters'
        }),

    city: Joi.string()
        .trim()
        .max(100)
        .allow('')
        .optional()
        .messages({
            'string.max': 'City must not exceed 100 characters'
        }),

    state: Joi.string()
        .trim()
        .max(100)
        .allow('')
        .optional()
        .messages({
            'string.max': 'State must not exceed 100 characters'
        }),

    zip_code: Joi.string()
        .trim()
        .max(20)
        .allow('')
        .optional()
        .messages({
            'string.max': 'Zip code must not exceed 20 characters'
        }),

    country: Joi.string()
        .trim()
        .max(100)
        .allow('')
        .optional()
        .messages({
            'string.max': 'Country must not exceed 100 characters'
        })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

module.exports = updateUserSchema;
