"use strict";
// src/middleware/validation.ts
// Request validation middleware using Zod schemas
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
const zod_1 = require("zod");
const validators_1 = require("../utils/validators");
/**
 * Validate request body against Zod schema
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Request validation failed',
                        details: error.errors.map((err) => ({
                            path: err.path.join('.'),
                            message: err.message,
                        })),
                    },
                });
                return; // Ensure function exits
            }
            next(error);
        }
    };
};
exports.validateBody = validateBody;
/**
 * Validate request query parameters against Zod schema
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const parsedQuery = (0, validators_1.parseQueryParams)(req.query);
            req.query = schema.parse(parsedQuery);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Query parameter validation failed',
                        details: error.errors.map((err) => ({
                            path: err.path.join('.'),
                            message: err.message,
                        })),
                    },
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
/**
 * Validate request params against Zod schema
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            req.params = schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'URL parameter validation failed',
                        details: error.errors.map((err) => ({
                            path: err.path.join('.'),
                            message: err.message,
                        })),
                    },
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateParams = validateParams;
/**
 * Validate multiple parts of request
 */
const validate = (schemas) => {
    return (req, res, next) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                const parsedQuery = (0, validators_1.parseQueryParams)(req.query);
                req.query = schemas.query.parse(parsedQuery);
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Request validation failed',
                        details: error.errors.map((err) => ({
                            path: err.path.join('.'),
                            message: err.message,
                        })),
                    },
                });
                return;
            }
            next(error);
        }
    };
};
exports.validate = validate;
