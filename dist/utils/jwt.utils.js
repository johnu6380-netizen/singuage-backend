"use strict";
// src/utils/jwt.utils.ts
// JWT token generation and verification utilities
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTokenExpired = exports.getTokenExpiry = exports.decodeToken = exports.extractTokenFromHeader = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokenPair = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
/**
 * Generate access token
 */
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign({ ...payload, type: 'access' }, env_1.env.JWT_ACCESS_SECRET, { expiresIn: env_1.env.JWT_ACCESS_EXPIRY } // cast for TS
    );
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generate refresh token
 */
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign({ ...payload, type: 'refresh' }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRY } // cast for TS
    );
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Generate both access and refresh tokens
 */
const generateTokenPair = (userId, email) => {
    const payload = { userId, email };
    return {
        accessToken: (0, exports.generateAccessToken)(payload),
        refreshToken: (0, exports.generateRefreshToken)(payload),
    };
};
exports.generateTokenPair = generateTokenPair;
/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        if (payload.type !== 'access') {
            throw new errors_1.AuthenticationError('Invalid token type');
        }
        return payload;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errors_1.AuthenticationError('Token expired');
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errors_1.AuthenticationError('Invalid token');
        }
        throw error;
    }
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
        if (payload.type !== 'refresh') {
            throw new errors_1.AuthenticationError('Invalid token type');
        }
        return payload;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errors_1.AuthenticationError('Refresh token expired');
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errors_1.AuthenticationError('Invalid refresh token');
        }
        throw error;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Extract token from Authorization header
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
};
exports.extractTokenFromHeader = extractTokenFromHeader;
/**
 * Decode token without verification (for debugging)
 */
const decodeToken = (token) => {
    return jsonwebtoken_1.default.decode(token);
};
exports.decodeToken = decodeToken;
/**
 * Get token expiry timestamp
 */
const getTokenExpiry = (token) => {
    const decoded = (0, exports.decodeToken)(token);
    return decoded?.exp ? decoded.exp * 1000 : null;
};
exports.getTokenExpiry = getTokenExpiry;
/**
 * Check if token is expired
 */
const isTokenExpired = (token) => {
    const expiry = (0, exports.getTokenExpiry)(token);
    if (!expiry)
        return true;
    return Date.now() >= expiry;
};
exports.isTokenExpired = isTokenExpired;
