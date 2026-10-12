const { UnprocessableEntityException } = require('../exceptions');

class Validation {
    /**
     * Validates request data against a Joi schema
     * @param {Object} data - The data to validate
     * @param {import("joi").Schema} schema - The Joi schema to validate against
     * @param {Object} options - Validation options
     * @returns {Promise<Object>} - The validated data
     * @throws {UnprocessableEntityException} - When validation fails
     */
    static async #validate(data, schema, options = {}) {
        const defaultOptions = {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true,
            ...options
        };

        // Ensure data is an object for Joi validation
        const dataToValidate = data || {};

        try {
            const value = await schema.validateAsync(dataToValidate, defaultOptions);

            return value;
        } catch (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');

            throw new UnprocessableEntityException(`Validation failed: ${errorMsg}`);
        }
    }

    /**
     * Validates multiple parts of the request
     * @param {import('express').Request} req - Express request object
     * @param {{body?: Object, query?: Object, params?: Object}} schemas - Object containing schemas for body, query, params
     * @param {Object} options - Validation options
     * @returns {Promise<{body?: Object, query?: Object, params?: Object}>} - Object containing validated data for each part
     */
    static async #validateRequest(req, schemas = {}, options = {}) {
        const result = {};

        if (schemas.body) {
            result.body = await this.#validate(req.body, schemas.body, options);
        }

        if (schemas.query) {
            result.query = await this.#validate(req.query, schemas.query, options);
        }

        if (schemas.params) {
            result.params = await this.#validate(req.params, schemas.params, options);
        }

        return result;
    }

    /**
     * Middleware factory for request validation
     * @param {{body?: Object, query?: Object, params?: Object}} schemas - Object containing schemas for body, query, params
     * @param {Object} options - Validation options
     * @returns {import('express').RequestHandler} - Express middleware function
     */
    static middleware(schemas, options = {}) {
        return async (req, res, next) => {            
            try {
                const validatedData = await this.#validateRequest(req, schemas, options);                
                // Replace request data with validated data
                if (validatedData.body) req.body = validatedData.body;
                if (validatedData.query) {
                    const result = validatedData.query;
                    Object.assign(req.query, result);
                }
                if (validatedData.params) req.params = validatedData.params;
                
                next();
            } catch (error) {
                next(error);
            }
        };
    }
}

module.exports = Validation;
