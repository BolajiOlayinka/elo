const IORedis = require('ioredis');
const env = require('./env');

const redisClient = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

module.exports = redisClient;
