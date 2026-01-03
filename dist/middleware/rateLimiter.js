"use strict";
// src/middleware/rateLimiter.ts
// Rate limiting middleware to prevent abuse
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionUpdateRateLimiter = exports.wordLookupRateLimiter = exports.createRedisRateLimiter = exports.readOnlyRateLimiter = exports.authRateLimiter = exports.standardRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
const redis_1 = require("../config/redis");
/**
 * Standard rate limiter for most endpoints
 * 100 requests per 15 minutes
 */
exports.standardRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !env_1.env.ENABLE_RATE_LIMITING,
});
/**
 * Strict rate limiter for auth endpoints
 * 5 requests per 15 minutes to prevent brute force
 */
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: 5,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later',
        },
    },
    skipSuccessfulRequests: true, // Don't count successful logins
    skip: () => !env_1.env.ENABLE_RATE_LIMITING,
});
/**
 * Lenient rate limiter for read-only endpoints
 * 200 requests per 15 minutes
 */
exports.readOnlyRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: 200,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        },
    },
    skip: () => !env_1.env.ENABLE_RATE_LIMITING,
});
/**
 * Custom rate limiter using Redis for distributed systems
 * Useful when running multiple server instances
 */
const createRedisRateLimiter = (options) => {
    const { windowMs, max, keyGenerator } = options;
    return async (req, res, next) => {
        if (!env_1.env.ENABLE_RATE_LIMITING) {
            return next();
        }
        try {
            // Generate unique key (IP address or user ID)
            const key = keyGenerator
                ? keyGenerator(req)
                : redis_1.CacheKeys.rateLimit(req.ip || 'unknown');
            // Increment counter
            const count = await (0, redis_1.incrementCache)(key);
            // Set expiry on first request
            if (count === 1) {
                // Note: Would need to implement EXPIRE in redis.ts
                // For now, using express-rate-limit is simpler
            }
            // Check if limit exceeded
            if (count > max) {
                return res.status(429).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'Too many requests, please try again later',
                    },
                });
            }
            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', max.toString());
            res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count).toString());
            res.setHeader('X-RateLimit-Reset', Date.now() + windowMs);
            next();
        }
        catch (error) {
            // If rate limiting fails, allow request to proceed
            console.error('Rate limiting error:', error);
            next();
        }
    };
};
exports.createRedisRateLimiter = createRedisRateLimiter;
/**
 * Rate limiter specifically for word lookup API
 * Higher limit since users might look up many words
 */
exports.wordLookupRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 lookups per minute
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many word lookups, please slow down',
        },
    },
    skip: () => !env_1.env.ENABLE_RATE_LIMITING,
});
/**
 * Rate limiter for session updates
 * Very high limit since updates happen frequently during learning
 */
exports.sessionUpdateRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 updates per minute
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many session updates, please slow down',
        },
    },
    skip: () => !env_1.env.ENABLE_RATE_LIMITING,
});
