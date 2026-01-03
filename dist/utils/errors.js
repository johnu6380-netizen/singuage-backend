"use strict";
// backend/src/utils/errors.ts
// Error handling utilities - NO code property on AppError
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApiError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message) {
        super(message, 401);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message) {
        super(message, 403);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
/**
 * Handle API errors and return standardized error response
 */
const handleApiError = (error) => {
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
exports.handleApiError = handleApiError;
