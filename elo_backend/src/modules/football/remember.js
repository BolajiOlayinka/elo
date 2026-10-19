const { CacheService } = require('../../infra/cache');

async function get(key) {
    try {
        return await CacheService.get(key);
    } catch {
        return null;
    }
}

async function set(key, value, ttl) {
    try {
        await CacheService.set(key, value, ttl);
    } catch {
        // Request path still works from Postgres when Redis is down.
    }
}

async function clear(pattern) {
    try {
        await CacheService.delPattern(pattern);
    } catch {
        // ignore
    }
}

module.exports = {
    get,
    set,
    clear
};
