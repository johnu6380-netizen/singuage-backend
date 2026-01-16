// backend/src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

// Centralized error handler
// - Do not leak internal error details or secrets to clients.
// - Log server-side errors using structured logger (no environment secrets included).
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    // Known application errors: return safe message and status code
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Unexpected errors: log them server-side but return a generic message to the client.
  // Avoid logging sensitive environment variables or secrets.
  logger.error('Unhandled error', {
    error: { message: err?.message, name: err?.name },
  });

  return res.status(500).json({ error: 'Internal server error' });
};