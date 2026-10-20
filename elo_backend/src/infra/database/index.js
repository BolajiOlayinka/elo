const dbConfig = require('./knexfile');
const env = require('../../config/env');

// The running app reads DATABASE_URL when it is set, so local web and admin
// show the loaded ratings. Knex CLI stays on Docker unless --env production.
const config = env.DATABASE_URL
    ? dbConfig.production
    : dbConfig[env.NODE_ENV] || dbConfig.development;

module.exports = require('knex')(config);
