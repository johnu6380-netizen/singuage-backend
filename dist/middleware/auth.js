"use strict";
// src/middleware/auth.ts
// Authentication middleware to protect routes
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkResourceOwnership = exports.optionalAuthenticate = exports.authenticate = void 0;
const errors_1 = require("../utils/errors");
const jwt_utils_1 = require("../utils/jwt.utils");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
/**
 * Middleware to authenticate requests using JWT
 * Verifies access token and attaches user info to request
 */
const authenticate = async (req, res, next) => {
    try {
        const token = (0, jwt_utils_1.extractTokenFromHeader)(req.headers.authorization);
        if (!token) {
            throw new errors_1.AuthenticationError('No token provided');
        }
        const payload = (0, jwt_utils_1.verifyAccessToken)(token);
        const user = await database_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
            },
        });
        if (!user) {
            throw new errors_1.AuthenticationError('User not found');
        }
        req.user = {
            id: user.id,
            email: user.email,
        };
        next();
    }
    catch (error) {
        if (error instanceof errors_1.AuthenticationError) {
            res.status(401).json({
                success: false,
                error: {
                    code: error.name,
                    message: error.message,
                },
            });
            return;
        }
        logger_1.logger.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Authentication failed',
            },
        });
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const token = (0, jwt_utils_1.extractTokenFromHeader)(req.headers.authorization);
        if (!token) {
            next();
            return;
        }
        const payload = (0, jwt_utils_1.verifyAccessToken)(token);
        const user = await database_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
            },
        });
        if (user) {
            req.user = {
                id: user.id,
                email: user.email,
            };
        }
        next();
    }
    catch (_error) {
        // Silently fail for optional auth
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
/**
 * Middleware to check if user owns a resource
 */
const checkResourceOwnership = (paramName, resourceType) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new errors_1.AuthenticationError('Not authenticated');
            }
            const resourceId = req.params[paramName];
            if (!resourceId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'BAD_REQUEST',
                        message: `${paramName} is required`,
                    },
                });
                return;
            }
            let resource;
            switch (resourceType) {
                case 'song':
                    resource = await database_1.prisma.song.findUnique({
                        where: { id: resourceId },
                        select: { userId: true },
                    });
                    if (!resource) {
                        res.status(404).json({
                            success: false,
                            error: {
                                code: 'NOT_FOUND',
                                message: 'Song not found',
                            },
                        });
                        return;
                    }
                    if (resource.userId !== req.user.id) {
                        res.status(403).json({
                            success: false,
                            error: {
                                code: 'FORBIDDEN',
                                message: 'You do not have access to this song',
                            },
                        });
                        return;
                    }
                    break;
                case 'session':
                    resource = await database_1.prisma.learningSession.findUnique({
                        where: { id: resourceId },
                        select: { userId: true },
                    });
                    if (!resource) {
                        res.status(404).json({
                            success: false,
                            error: {
                                code: 'NOT_FOUND',
                                message: 'Session not found',
                            },
                        });
                        return;
                    }
                    if (resource.userId !== req.user.id) {
                        res.status(403).json({
                            success: false,
                            error: {
                                code: 'FORBIDDEN',
                                message: 'You do not have access to this session',
                            },
                        });
                        return;
                    }
                    break;
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Resource ownership check error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to verify resource ownership',
                },
            });
        }
    };
};
exports.checkResourceOwnership = checkResourceOwnership;
