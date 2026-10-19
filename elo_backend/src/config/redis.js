const IORedis = require('ioredis');
const env = require('./env');

function usableRedisUrl() {
    const url = env.REDIS_URL;

    if (!url) {
        return null;
    }

    let hostname;

    try {
        hostname = new URL(url).hostname;
    } catch {
        return null;
    }

    const loopback = hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';

    // A copied local URL cannot reach Redis on a Heroku dyno. Skip it instead of
    // retrying 127.0.0.1:6379 forever.
    if (env.NODE_ENV === 'production' && loopback) {
        return null;
    }

    return url;
}

const redisUrl = usableRedisUrl();
const redisClient = redisUrl
    ? new IORedis(redisUrl, { maxRetriesPerRequest: null })
    : null;

if (redisClient) {
    redisClient.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('Redis error:', error.message);
    });
}

module.exports = redisClient;
