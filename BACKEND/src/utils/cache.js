const Redis = require('ioredis');
const { logger, logError } = require('./logger');

// Redis configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3
};

// Create Redis client
const redis = new Redis(redisConfig);

// Event handlers
redis.on('error', (error) => {
    logError('Redis error:', error);
});

redis.on('connect', () => {
    logger.info('Redis connected successfully');
});

redis.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
});

// Constants
const DEFAULT_EXPIRATION = 3600; // 1 hour

// Cache operations with error handling
const cacheGet = async (key) => {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        logError('Cache get error:', error);
        return null;
    }
};

const cacheSet = async (key, data, expiration = DEFAULT_EXPIRATION) => {
    try {
        await redis.setex(key, expiration, JSON.stringify(data));
        return true;
    } catch (error) {
        logError('Cache set error:', error);
        return false;
    }
};

const cacheDelete = async (key) => {
    try {
        await redis.del(key);
        return true;
    } catch (error) {
        logError('Cache delete error:', error);
        return false;
    }
};

const cacheClear = async (pattern) => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        return true;
    } catch (error) {
        logError('Cache clear error:', error);
        return false;
    }
};

// Health check
const healthCheck = async () => {
    try {
        await redis.ping();
        return true;
    } catch (error) {
        logError('Redis health check failed:', error);
        return false;
    }
};

module.exports = {
    redis, // Export for testing
    cacheGet,
    cacheSet,
    cacheDelete,
    cacheClear,
    healthCheck,
    DEFAULT_EXPIRATION
};