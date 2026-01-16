// src/middleware/rateLimiter.ts
// Rate limiting middleware to prevent abuse

import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { incrementCache, CacheKeys } from '../config/redis';
import { Request, Response } from 'express';

/**
 * Standard rate limiter for most endpoints
 * 100 requests per 15 minutes
 */
export const standardRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !env.ENABLE_RATE_LIMITING,
});

/**
 * Strict rate limiter for auth endpoints
 * 5 requests per 15 minutes to prevent brute force
 */
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  skipSuccessfulRequests: true, // Don't count successful logins
  skip: () => !env.ENABLE_RATE_LIMITING,
});

/**
 * Lenient rate limiter for read-only endpoints
 * 200 requests per 15 minutes
 */
export const readOnlyRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 200,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  skip: () => !env.ENABLE_RATE_LIMITING,
});

/**
 * Custom rate limiter using Redis for distributed systems
 * Useful when running multiple server instances
 */
export const createRedisRateLimiter = (options: {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
}) => {
  const { windowMs, max, keyGenerator } = options;
  
  return async (req: Request, res: Response, next: Function) => {
    if (!env.ENABLE_RATE_LIMITING) {
      return next();
    }
    
    try {
      // Generate unique key (IP address or user ID)
      const key = keyGenerator
        ? keyGenerator(req)
        : CacheKeys.rateLimit(req.ip || 'unknown');
      
      // Increment counter
      const count = await incrementCache(key);
      
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
    } catch (error) {
      // If rate limiting fails, allow request to proceed
      console.error('Rate limiting error:', error);
      next();
    }
  };
};

/**
 * Rate limiter specifically for word lookup API
 * Higher limit since users might look up many words
 */
export const wordLookupRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 lookups per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many word lookups, please slow down',
    },
  },
  skip: () => !env.ENABLE_RATE_LIMITING,
});

/**
 * Rate limiter for session updates
 * Very high limit since updates happen frequently during learning
 */
export const sessionUpdateRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 updates per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many session updates, please slow down',
    },
  },
  skip: () => !env.ENABLE_RATE_LIMITING,
});

/**
 * Rate limiter specifically for forgot-password endpoint
 * e.g., 5 requests per hour per IP
 */
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.FORGOT_PASSWORD_MAX ? Number(process.env.FORGOT_PASSWORD_MAX) : 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !env.ENABLE_RATE_LIMITING,
});

/**
 * Rate limiter specifically for reset-password endpoint
 * e.g., 10 requests per hour per IP to prevent token brute-force
 */
export const resetPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.RESET_PASSWORD_MAX ? Number(process.env.RESET_PASSWORD_MAX) : 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !env.ENABLE_RATE_LIMITING,
});