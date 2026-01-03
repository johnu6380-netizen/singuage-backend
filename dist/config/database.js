"use strict";
// src/config/database.ts
// Prisma database client configuration
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTransaction = exports.connectDatabase = exports.checkDatabaseConnection = exports.disconnectDatabase = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
// Create Prisma client with logging configuration
exports.prisma = global.prisma ||
    new client_1.PrismaClient({
        log: env_1.isDevelopment
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
        errorFormat: 'pretty',
    });
// Store in global to prevent multiple instances during hot-reload
if (env_1.isDevelopment) {
    global.prisma = exports.prisma;
}
// Graceful shutdown handling
const disconnectDatabase = async () => {
    try {
        await exports.prisma.$disconnect();
        logger_1.logger.info('Database disconnected successfully');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from database:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
// Health check function
const checkDatabaseConnection = async () => {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        logger_1.logger.info('Database connection successful');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database connection failed:', error);
        return false;
    }
};
exports.checkDatabaseConnection = checkDatabaseConnection;
// Connection with retry logic
const connectDatabase = async (maxRetries = 5) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await exports.prisma.$connect();
            logger_1.logger.info('Database connected successfully');
            return true;
        }
        catch (error) {
            logger_1.logger.warn(`Database connection attempt ${i + 1}/${maxRetries} failed`);
            if (i === maxRetries - 1) {
                logger_1.logger.error('Database connection failed after all retries:', error);
                return false;
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    return false;
};
exports.connectDatabase = connectDatabase;
// Transaction helper
const runTransaction = async (callback) => {
    return exports.prisma.$transaction(callback);
};
exports.runTransaction = runTransaction;
