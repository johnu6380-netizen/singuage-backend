"use strict";
// src/config/redis.ts
// Redis client configuration for caching and session management
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = exports.checkRedisHealth = exports.incrementCache = exports.cacheExists = exports.deleteCachePattern = exports.deleteCache = exports.setCacheExpireAt = exports.setCache = exports.getCacheMulti = exports.getCache = exports.disconnectRedis = exports.connectRedis = void 0;
const redis_1 = require("redis");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
// Create Redis client
const redisClient = (0, redis_1.createClient)({
    url: env_1.env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                logger_1.logger.error('Redis reconnection failed after 10 attempts');
                return new Error('Redis reconnection limit exceeded');
            }
            const delay = Math.min(retries * 100, 3000);
            logger_1.logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
        },
    },
});
// Event handlers
redisClient.on('error', (err) => logger_1.logger.error('Redis Client Error:', err));
redisClient.on('connect', () => logger_1.logger.info('Redis client connecting...'));
redisClient.on('ready', () => logger_1.logger.info('Redis client ready'));
redisClient.on('reconnecting', () => logger_1.logger.warn('Redis client reconnecting...'));
redisClient.on('end', () => logger_1.logger.info('Redis client connection ended'));
// Track connection state
let isConnecting = false;
let connectionPromise = null;
// Connect to Redis
const connectRedis = async (maxRetries = 5) => {
    if (isConnecting && connectionPromise) {
        try {
            await connectionPromise;
            return redisClient.isOpen;
        }
        catch {
            return false;
        }
    }
    if (redisClient.isOpen) {
        logger_1.logger.info('Redis already connected');
        return true;
    }
    isConnecting = true;
    for (let i = 0; i < maxRetries; i++) {
        try {
            connectionPromise = redisClient.connect();
            await connectionPromise;
            isConnecting = false;
            logger_1.logger.info('Redis connected successfully');
            return true;
        }
        catch (error) {
            logger_1.logger.warn(`Redis connection attempt ${i + 1}/${maxRetries} failed:`, error);
            if (i === maxRetries - 1) {
                isConnecting = false;
                logger_1.logger.error('Redis connection failed after all retries');
                return false;
            }
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    isConnecting = false;
    return false;
};
exports.connectRedis = connectRedis;
// Disconnect from Redis
const disconnectRedis = async () => {
    if (redisClient.isOpen) {
        try {
            await redisClient.quit();
            logger_1.logger.info('Redis disconnected successfully');
        }
        catch (error) {
            logger_1.logger.error('Error disconnecting from Redis:', error);
            await redisClient.disconnect();
        }
    }
};
exports.disconnectRedis = disconnectRedis;
// ============================================================================
// Cache Helper Functions
// ============================================================================
const getCache = async (key) => {
    if (!env_1.env.ENABLE_CACHE || !redisClient.isOpen)
        return null;
    try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    }
    catch (error) {
        logger_1.logger.error(`Cache GET error for key ${key}:`, error);
        return null;
    }
};
exports.getCache = getCache;
const getCacheMulti = async (keys) => {
    if (!env_1.env.ENABLE_CACHE || !redisClient.isOpen || keys.length === 0)
        return keys.map(() => null);
    try {
        const values = await redisClient.mGet(keys);
        return values.map((val) => (val ? JSON.parse(val) : null));
    }
    catch (error) {
        logger_1.logger.error('Cache MGET error:', error);
        return keys.map(() => null);
    }
};
exports.getCacheMulti = getCacheMulti;
const setCache = async (key, value, ttlSeconds = env_1.env.CACHE_TTL_SECONDS) => {
    if (!env_1.env.ENABLE_CACHE || !redisClient.isOpen)
        return false;
    try {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Cache SET error for key ${key}:`, error);
        return false;
    }
};
exports.setCache = setCache;
const setCacheExpireAt = async (key, value, expiryTimestamp) => {
    if (!env_1.env.ENABLE_CACHE || !redisClient.isOpen)
        return false;
    try {
        await redisClient.set(key, JSON.stringify(value));
        await redisClient.expireAt(key, expiryTimestamp);
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Cache SET EXPIREAT error for key ${key}:`, error);
        return false;
    }
};
exports.setCacheExpireAt = setCacheExpireAt;
const deleteCache = async (key) => {
    if (!redisClient.isOpen)
        return false;
    try {
        await redisClient.del(key);
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Cache DELETE error for key ${key}:`, error);
        return false;
    }
};
exports.deleteCache = deleteCache;
const deleteCachePattern = async (pattern) => {
    if (!redisClient.isOpen)
        return 0;
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length === 0)
            return 0;
        return await redisClient.del(keys);
    }
    catch (error) {
        logger_1.logger.error(`Cache DELETE pattern error for ${pattern}:`, error);
        return 0;
    }
};
exports.deleteCachePattern = deleteCachePattern;
const cacheExists = async (key) => {
    if (!redisClient.isOpen)
        return false;
    try {
        const exists = await redisClient.exists(key);
        return exists === 1;
    }
    catch (error) {
        logger_1.logger.error(`Cache EXISTS error for key ${key}:`, error);
        return false;
    }
};
exports.cacheExists = cacheExists;
const incrementCache = async (key) => {
    if (!redisClient.isOpen)
        return 0;
    try {
        return await redisClient.incr(key);
    }
    catch (error) {
        logger_1.logger.error(`Cache INCR error for key ${key}:`, error);
        return 0;
    }
};
exports.incrementCache = incrementCache;
const checkRedisHealth = async () => {
    if (!redisClient.isOpen)
        return false;
    try {
        await redisClient.ping();
        return true;
    }
    catch (error) {
        logger_1.logger.error('Redis health check failed:', error);
        return false;
    }
};
exports.checkRedisHealth = checkRedisHealth;
// ============================================================================
// Cache Key Generators
// ============================================================================
exports.CacheKeys = {
    user: (userId) => `user:${userId}`,
    userStats: (userId) => `user:${userId}:stats`,
    song: (songId) => `song:${songId}`,
    songLyrics: (songId) => `song:${songId}:lyrics`,
    session: (sessionId) => `session:${sessionId}`,
    vocabulary: (userId, word, language) => `vocab:${userId}:${language}:${word}`,
    grammarConcept: (conceptId) => `grammar:${conceptId}`,
    userGrammarProgress: (userId) => `user:${userId}:grammar`,
    rateLimit: (identifier) => `ratelimit:${identifier}`,
    leaderboard: (period) => `leaderboard:${period}`,
};
// Export default client for convenience
exports.default = redisClient;
