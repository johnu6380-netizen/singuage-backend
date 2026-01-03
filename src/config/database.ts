// src/config/database.ts
// Prisma database client configuration

import { PrismaClient } from '@prisma/client';
import { isDevelopment } from './env';
import { logger } from '../utils/logger';

// Singleton pattern for Prisma client
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with logging configuration
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: isDevelopment
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    errorFormat: 'pretty',
  });

// Store in global to prevent multiple instances during hot-reload
if (isDevelopment) {
  global.prisma = prisma;
}

// Graceful shutdown handling
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
};

// Health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Connection with retry logic
export const connectDatabase = async (maxRetries = 5): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      logger.info('Database connected successfully');
      return true;
    } catch (error) {
      logger.warn(`Database connection attempt ${i + 1}/${maxRetries} failed`);
      if (i === maxRetries - 1) {
        logger.error('Database connection failed after all retries:', error);
        return false;
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  return false;
};

// Transaction helper
export const runTransaction = async <T>(
  callback: (tx: any) => Promise<T>
): Promise<T> => {
  return prisma.$transaction(callback);
};

// Export type for transaction context
export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;
