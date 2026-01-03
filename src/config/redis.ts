// src/config/redis.ts
// Redis client configuration for caching and session management

import { createClient, RedisClientType } from 'redis';
import { env, isDevelopment } from './env';
import { logger } from '../utils/logger';

// Create Redis client
const redisClient: RedisClientType = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection limit exceeded');
      }
      const delay = Math.min(retries * 100, 3000);
      logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
  },
});

// Event handlers
redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
redisClient.on('connect', () => logger.info('Redis client connecting...'));
redisClient.on('ready', () => logger.info('Redis client ready'));
redisClient.on('reconnecting', () => logger.warn('Redis client reconnecting...'));
redisClient.on('end', () => logger.info('Redis client connection ended'));

// Track connection state
let isConnecting = false;
let connectionPromise: Promise<RedisClientType> | null = null;

// Connect to Redis
export const connectRedis = async (maxRetries = 5): Promise<boolean> => {
  if (isConnecting && connectionPromise) {
    try {
      await connectionPromise;
      return redisClient.isOpen;
    } catch {
      return false;
    }
  }

  if (redisClient.isOpen) {
    logger.info('Redis already connected');
    return true;
  }

  isConnecting = true;

  for (let i = 0; i < maxRetries; i++) {
    try {
      connectionPromise = redisClient.connect();
      await connectionPromise;
      isConnecting = false;
      logger.info('Redis connected successfully');
      return true;
    } catch (error) {
      logger.warn(`Redis connection attempt ${i + 1}/${maxRetries} failed:`, error);
      if (i === maxRetries - 1) {
        isConnecting = false;
        logger.error('Redis connection failed after all retries');
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  isConnecting = false;
  return false;
};

// Disconnect from Redis
export const disconnectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) {
    try {
      await redisClient.quit();
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      await redisClient.disconnect();
    }
  }
};

// ============================================================================
// Cache Helper Functions
// ============================================================================

export const getCache = async <T>(key: string): Promise<T | null> => {
  if (!env.ENABLE_CACHE || !redisClient.isOpen) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Cache GET error for key ${key}:`, error);
    return null;
  }
};

export const getCacheMulti = async <T>(keys: string[]): Promise<(T | null)[]> => {
  if (!env.ENABLE_CACHE || !redisClient.isOpen || keys.length === 0) return keys.map(() => null);

  try {
    const values = await redisClient.mGet(keys);
    return values.map((val) => (val ? JSON.parse(val) : null));
  } catch (error) {
    logger.error('Cache MGET error:', error);
    return keys.map(() => null);
  }
};

export const setCache = async (key: string, value: any, ttlSeconds: number = env.CACHE_TTL_SECONDS): Promise<boolean> => {
  if (!env.ENABLE_CACHE || !redisClient.isOpen) return false;

  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`Cache SET error for key ${key}:`, error);
    return false;
  }
};

export const setCacheExpireAt = async (key: string, value: any, expiryTimestamp: number): Promise<boolean> => {
  if (!env.ENABLE_CACHE || !redisClient.isOpen) return false;

  try {
    await redisClient.set(key, JSON.stringify(value));
    await redisClient.expireAt(key, expiryTimestamp);
    return true;
  } catch (error) {
    logger.error(`Cache SET EXPIREAT error for key ${key}:`, error);
    return false;
  }
};

export const deleteCache = async (key: string): Promise<boolean> => {
  if (!redisClient.isOpen) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Cache DELETE error for key ${key}:`, error);
    return false;
  }
};

export const deleteCachePattern = async (pattern: string): Promise<number> => {
  if (!redisClient.isOpen) return 0;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;
    return await redisClient.del(keys);
  } catch (error) {
    logger.error(`Cache DELETE pattern error for ${pattern}:`, error);
    return 0;
  }
};

export const cacheExists = async (key: string): Promise<boolean> => {
  if (!redisClient.isOpen) return false;

  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error(`Cache EXISTS error for key ${key}:`, error);
    return false;
  }
};

export const incrementCache = async (key: string): Promise<number> => {
  if (!redisClient.isOpen) return 0;

  try {
    return await redisClient.incr(key);
  } catch (error) {
    logger.error(`Cache INCR error for key ${key}:`, error);
    return 0;
  }
};

export const checkRedisHealth = async (): Promise<boolean> => {
  if (!redisClient.isOpen) return false;

  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
};

// ============================================================================
// Cache Key Generators
// ============================================================================

export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userStats: (userId: string) => `user:${userId}:stats`,
  song: (songId: string) => `song:${songId}`,
  songLyrics: (songId: string) => `song:${songId}:lyrics`,
  session: (sessionId: string) => `session:${sessionId}`,
  vocabulary: (userId: string, word: string, language: string) => `vocab:${userId}:${language}:${word}`,
  grammarConcept: (conceptId: string) => `grammar:${conceptId}`,
  userGrammarProgress: (userId: string) => `user:${userId}:grammar`,
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
  leaderboard: (period: string) => `leaderboard:${period}`,
};

// Export default client for convenience
export default redisClient;
