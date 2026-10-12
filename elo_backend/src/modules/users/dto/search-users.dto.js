const Joi = require('joi');

/**
 * Schema for searching users
 */
const searchUsersSchema = Joi.object({
    search_term: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Search term is required',
            'string.min': 'Search term must be at least 1 character long',
            'string.max': 'Search term must not exceed 100 characters',
            'any.required': 'Search term is required'
        }),

    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be at least 1'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit must not exceed 100'
        })
});

module.exports = searchUsersSchema;
