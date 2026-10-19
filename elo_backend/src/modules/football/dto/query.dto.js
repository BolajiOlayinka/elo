'use strict';

const Joi = require('joi');

const pageQuery = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    q: Joi.string().trim().max(80).allow('').default(''),
    refresh: Joi.boolean().truthy('1', 'true').falsy('0', 'false').default(false)
});

const ratingsQuery = pageQuery.keys({
    entity: Joi.string().valid('players', 'keepers', 'coaches', 'leagues', 'countries').default('players')
});

const profileParams = Joi.object({
    type: Joi.string().valid('players', 'keepers', 'coaches', 'leagues', 'countries').required(),
    id: Joi.string().pattern(/^\d+$/).required()
});

const idParams = Joi.object({
    id: Joi.number().integer().positive().required()
});

module.exports = {
    pageQuery,
    ratingsQuery,
    profileParams,
    idParams
};
