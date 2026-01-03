// src/config/env.ts
// Environment variable configuration with validation

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Define schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  API_VERSION: z.string().default('v1'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  
  // Bcrypt
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  
  // External APIs
  GOOGLE_TRANSLATE_API_KEY: z.string().optional(),
  DEEPL_API_KEY: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Features
  ENABLE_RATE_LIMITING: z.string().default('true').transform(val => val === 'true'),
  ENABLE_CACHE: z.string().default('true').transform(val => val === 'true'),
  CACHE_TTL_SECONDS: z.string().default('3600').transform(Number),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

// Helper to check if running in production
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// Parse CORS origins
export const corsOrigins = env.CORS_ORIGIN.split(',').map(origin => origin.trim());
