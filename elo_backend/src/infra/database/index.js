const dbConfig = require('./knexfile');
const env = require('../../config/env');

module.exports = require('knex')(dbConfig[env.NODE_ENV]);
