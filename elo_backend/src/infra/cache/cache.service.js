/* eslint-disable no-console */
// TODO: Add proper logging
/** @type {import('ioredis').Redis} */
const redisClient = require('../../config/redis');

class CacheService {
    /**
     * Set a value in cache with optional TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache (will be JSON stringified)
     * @param {number} [ttl] - Time to live in seconds (optional)
     * @returns {Promise<string>} Returns 'OK' if successful
     */
    static async set(key, value, ttl = null) {
        if (!redisClient) {
            return null;
        }

        try {
            const serializedValue = JSON.stringify(value);
            
            if (ttl) {
                return await redisClient.setex(key, ttl, serializedValue);
            } else {
                return await redisClient.set(key, serializedValue);
            }
        } catch (error) {
            console.error('Cache set error:', error);
            throw error;
        }
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any|null>} Parsed value or null if not found
     */
    static async get(key) {
        if (!redisClient) {
            return null;
        }

        try {
            const value = await redisClient.get(key);
            
            if (value === null) {
                return null;
            }
            
            return JSON.parse(value);
        } catch (error) {
            console.error('Cache get error:', error);

            return null;
        }
    }

    /**
     * Delete a key from cache
     * @param {string} key - Cache key
     * @returns {Promise<number>} Number of keys deleted (0 or 1)
     */
    static async del(key) {
        if (!redisClient) {
            return 0;
        }

        try {
            return await redisClient.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
            throw error;
        }
    }

    /**
     * Check if a key exists in cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} True if key exists, false otherwise
     */
    static async exists(key) {
        try {
            const result = await redisClient.exists(key);

            return result === 1;
        } catch (error) {
            console.error('Cache exists error:', error);

            return false;
        }
    }

    /**
     * Set TTL for an existing key
     * @param {string} key - Cache key
     * @param {number} ttl - Time to live in seconds
     * @returns {Promise<boolean>} True if successful, false if key doesn't exist
     */
    static async expire(key, ttl) {
        try {
            const result = await redisClient.expire(key, ttl);

            return result === 1;
        } catch (error) {
            console.error('Cache expire error:', error);

            return false;
        }
    }

    /**
     * Get remaining TTL for a key
     * @param {string} key - Cache key
     * @returns {Promise<number>} Remaining TTL in seconds, -1 if no TTL, -2 if key doesn't exist
     */
    static async ttl(key) {
        try {
            return await redisClient.ttl(key);
        } catch (error) {
            console.error('Cache TTL error:', error);

            return -2;
        }
    }

    /**
     * Increment a numeric value in cache
     * @param {string} key - Cache key
     * @param {number} [increment=1] - Amount to increment by
     * @returns {Promise<number>} New value after increment
     */
    static async incr(key, increment = 1) {
        try {
            if (increment === 1) {
                return await redisClient.incr(key);
            } else {
                return await redisClient.incrby(key, increment);
            }
        } catch (error) {
            console.error('Cache increment error:', error);
            throw error;
        }
    }

    /**
     * Decrement a numeric value in cache
     * @param {string} key - Cache key
     * @param {number} [decrement=1] - Amount to decrement by
     * @returns {Promise<number>} New value after decrement
     */
    static async decr(key, decrement = 1) {
        try {
            if (decrement === 1) {
                return await redisClient.decr(key);
            } else {
                return await redisClient.decrby(key, decrement);
            }
        } catch (error) {
            console.error('Cache decrement error:', error);
            throw error;
        }
    }

    /**
     * Get all keys matching a pattern
     * @param {string} pattern - Redis pattern (e.g., 'user:*', 'session:*')
     * @returns {Promise<string[]>} Array of matching keys
     */
    static async keys(pattern) {
        try {
            return await redisClient.keys(pattern);
        } catch (error) {
            console.error('Cache keys error:', error);

            return [];
        }
    }

    /**
     * Delete multiple keys matching a pattern
     * @param {string} pattern - Redis pattern (e.g., 'user:*', 'session:*')
     * @returns {Promise<number>} Number of keys deleted
     */
    static async delPattern(pattern) {
        if (!redisClient) {
            return 0;
        }

        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }

            return await redisClient.del(...keys);
        } catch (error) {
            console.error('Cache delete pattern error:', error);
            throw error;
        }
    }

    /**
     * Set multiple key-value pairs at once
     * @param {Object} keyValuePairs - Object with key-value pairs
     * @param {number} [ttl] - Optional TTL for all keys in seconds
     * @returns {Promise<string>} Returns 'OK' if successful
     */
    static async mset(keyValuePairs, ttl = null) {
        try {
            const serializedPairs = {};
            for (const [key, value] of Object.entries(keyValuePairs)) {
                serializedPairs[key] = JSON.stringify(value);
            }
            
            await redisClient.mset(serializedPairs);
            
            // Set TTL for all keys if provided
            if (ttl) {
                const promises = Object.keys(keyValuePairs).map(key => redisClient.expire(key, ttl));
                await Promise.all(promises);
            }
            
            return 'OK';
        } catch (error) {
            console.error('Cache mset error:', error);
            throw error;
        }
    }

    /**
     * Get multiple values at once
     * @param {string[]} keys - Array of cache keys
     * @returns {Promise<Object>} Object with key-value pairs (null for missing keys)
     */
    static async mget(keys) {
        try {
            const values = await redisClient.mget(...keys);
            const result = {};
            
            keys.forEach((key, index) => {
                const value = values[index];
                result[key] = value === null ? null : JSON.parse(value);
            });
            
            return result;
        } catch (error) {
            console.error('Cache mget error:', error);

            return {};
        }
    }

    /**
     * Clear all cache (use with caution!)
     * @returns {Promise<string>} Returns 'OK' if successful
     */
    static async flushAll() {
        try {
            return await redisClient.flushall();
        } catch (error) {
            console.error('Cache flush all error:', error);
            throw error;
        }
    }

    /**
     * Get Redis client for advanced operations
     * @returns {Object} Redis client instance
     */
    static getClient() {
        return redisClient;
    }
}

module.exports = CacheService;
