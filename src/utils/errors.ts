// backend/src/utils/errors.ts
// Error handling utilities - NO code property on AppError

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Handle API errors and return standardized error response
 */
export const handleApiError = (error: any): { statusCode: number; message: string } => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
    };
  }

  if (error.name === 'ZodError') {
    return {
      statusCode: 400,
      message: error.errors?.[0]?.message || 'Validation error',
    };
  }

  console.error('Unhandled error:', error);
  
  return {
    statusCode: 500,
    message: 'Internal server error',
  };
};
