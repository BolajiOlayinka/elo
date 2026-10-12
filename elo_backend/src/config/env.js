const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const Joi = require('joi');

/**
 * @typedef {Object} EnvConfig
 * @property {'development'|'production'|'test'} NODE_ENV
 * @property {number} PORT
 * @property {string|undefined} DATABASE_URL
 * @property {string} DB_HOST
 * @property {number} DB_PORT
 * @property {string} DB_USER
 * @property {string} DB_PASSWORD
 * @property {string} DB_NAME
 * @property {string} REDIS_URL
 * @property {string} SMTP_HOST
 * @property {number} SMTP_PORT
 * @property {boolean} SMTP_SECURE
 * @property {string} SMTP_USER
 * @property {string} SMTP_PASS
 * @property {string} FROM_NAME
 * @property {string} FROM_EMAIL
 * @property {string} WHITELISTED_ORIGINS
 * @property {string} JWT_SECRET
 * @property {string} JWT_EXPIRES_IN
 * @property {boolean} USE_GMAIL
 * @property {string} GMAIL_USER
 * @property {string} GMAIL_PASS
 */

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().optional().allow(''),
    DB_HOST: Joi.string().default('127.0.0.1'),
    DB_PORT: Joi.number().default(5432),
    DB_USER: Joi.string().default('your_user'),
    DB_PASSWORD: Joi.string().default('your_password'),
    DB_NAME: Joi.string().default('your_db'),
    REDIS_URL: Joi.string().optional().allow(''),
    SMTP_HOST: Joi.string().optional().allow(''),
    SMTP_PORT: Joi.number().optional(),
    SMTP_SECURE: Joi.boolean().optional(),
    SMTP_USER: Joi.string().optional().allow(''),
    SMTP_PASS: Joi.string().optional().allow(''),
    FROM_NAME: Joi.string().optional().allow(''),
    FROM_EMAIL: Joi.string().optional().allow(''),
    WHITELISTED_ORIGINS: Joi.string().optional().allow(''),
    JWT_SECRET: Joi.string().default('elo-preview-change-me'),
    JWT_EXPIRES_IN: Joi.string().default('24h'),
    USE_GMAIL: Joi.boolean().default(false),
    GMAIL_USER: Joi.string().when('USE_GMAIL', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    GMAIL_PASS: Joi.string().when('USE_GMAIL', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    })
}).unknown(true);

const { error, value } = envSchema.validate(process.env);

if (error) {
    throw new Error(`Environment validation error: ${error.details[0].message}`);
}

/** @type {EnvConfig} */
const config = value;

module.exports = config;
