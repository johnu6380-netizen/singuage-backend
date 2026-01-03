"use strict";
// src/config/env.ts
// Environment variable configuration with validation
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOrigins = exports.isTest = exports.isDevelopment = exports.isProduction = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
// Define schema for environment variables
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('3000'),
    API_VERSION: zod_1.z.string().default('v1'),
    // Database
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    // Redis
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    // JWT
    JWT_ACCESS_SECRET: zod_1.z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('7d'),
    // Bcrypt
    BCRYPT_ROUNDS: zod_1.z.string().default('12').transform(Number),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000').transform(Number),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().default('100').transform(Number),
    // External APIs
    GOOGLE_TRANSLATE_API_KEY: zod_1.z.string().optional(),
    DEEPL_API_KEY: zod_1.z.string().optional(),
    YOUTUBE_API_KEY: zod_1.z.string().optional(),
    // CORS
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173,http://localhost:3000'),
    // Logging
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    // Features
    ENABLE_RATE_LIMITING: zod_1.z.string().default('true').transform(val => val === 'true'),
    ENABLE_CACHE: zod_1.z.string().default('true').transform(val => val === 'true'),
    CACHE_TTL_SECONDS: zod_1.z.string().default('3600').transform(Number),
});
// Parse and validate environment variables
const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('❌ Environment validation failed:');
            error.errors.forEach(err => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
};
exports.env = parseEnv();
// Helper to check if running in production
exports.isProduction = exports.env.NODE_ENV === 'production';
exports.isDevelopment = exports.env.NODE_ENV === 'development';
exports.isTest = exports.env.NODE_ENV === 'test';
// Parse CORS origins
exports.corsOrigins = exports.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
