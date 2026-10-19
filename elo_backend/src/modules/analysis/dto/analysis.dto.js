const Joi = require('joi');

const media_schema = Joi.object({
    upload_id: Joi.string().allow('').optional(),
    uploadId: Joi.string().allow('').optional(),
    file_url: Joi.string().allow('').optional(),
    fileUrl: Joi.string().allow('').optional()
}).unknown(true);

const metric_schema = Joi.object({
    id: Joi.string().allow('').optional(),
    label: Joi.string().allow('').optional(),
    left: Joi.alternatives().try(Joi.string(), Joi.number()).allow('').optional(),
    right: Joi.alternatives().try(Joi.string(), Joi.number()).allow('').optional(),
    winner: Joi.string().valid('left', 'right', 'none').optional(),
    unit: Joi.string().allow('').optional()
}).unknown(true);

const category_schema = Joi.object({
    label: Joi.string().trim().min(1).max(80).optional(),
    slug: Joi.string().trim().max(80).allow('').optional(),
    description: Joi.string().allow('').optional(),
    sortOrder: Joi.number().integer().optional()
});

const tag_schema = Joi.object({
    name: Joi.string().trim().min(1).max(40).optional(),
    slug: Joi.string().trim().max(40).allow('').optional()
});

const post_schema = Joi.object({
    title: Joi.string().trim().allow('').optional(),
    cardTitle: Joi.string().trim().allow('').optional(),
    excerpt: Joi.string().allow('').optional(),
    body: Joi.string().allow('').optional(),
    slug: Joi.string().trim().allow('').optional(),
    category: Joi.string().trim().allow('').optional(),
    categoryId: Joi.string().trim().allow('').optional(),
    status: Joi.string().valid('draft', 'published').optional(),
    comparison: Joi.boolean().optional(),
    readMinutes: Joi.number().integer().min(1).max(120).optional(),
    clips: Joi.number().integer().min(0).optional(),
    publishedAt: Joi.alternatives().try(Joi.date(), Joi.string().allow(''), Joi.valid(null)).optional(),
    author: Joi.object({
        name: Joi.string().allow('').optional(),
        role: Joi.string().allow('').optional(),
        initials: Joi.string().allow('').optional()
    }).optional(),
    thumbnail: Joi.alternatives().try(media_schema, Joi.string().allow('')).optional(),
    hero: Joi.alternatives().try(media_schema, Joi.string().allow('')).optional(),
    metrics: Joi.array().items(metric_schema).optional(),
    metricNames: Joi.object({
        left: Joi.string().allow('').optional(),
        right: Joi.string().allow('').optional()
    }).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    translations: Joi.object().optional()
}).or('title', 'cardTitle');

const comment_schema = Joi.object({
    text: Joi.string().trim().min(1).max(4000).required(),
    body: Joi.string().trim().optional(),
    stance: Joi.string().valid('support', 'challenge').optional(),
    name: Joi.string().trim().max(80).allow('').optional(),
    initials: Joi.string().trim().max(4).allow('').optional(),
    email: Joi.string().email().allow('').optional(),
    parentId: Joi.string().allow(null, '').optional(),
    match: Joi.object({
        label: Joi.string().allow('').optional(),
        clock: Joi.string().allow('').optional()
    }).optional(),
    matchLabel: Joi.string().allow('').optional(),
    matchClock: Joi.string().allow('').optional()
});

const comment_moderation_schema = Joi.object({
    status: Joi.string().valid('pending', 'approved', 'spam', 'rejected').optional(),
    flagged: Joi.boolean().optional()
});

const vote_schema = Joi.object({
    direction: Joi.string().valid('up', 'down').required()
});

const staff_login_schema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().required()
});

const upload_schema = Joi.object({
    filename: Joi.string().trim().max(180).required(),
    content_type: Joi.string().trim().max(80).allow('').optional(),
    data: Joi.string().required()
});

module.exports = {
    category_schema,
    tag_schema,
    post_schema,
    comment_schema,
    comment_moderation_schema,
    vote_schema,
    staff_login_schema,
    upload_schema
};
