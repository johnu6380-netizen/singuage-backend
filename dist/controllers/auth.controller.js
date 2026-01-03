"use strict";
// backend/src/controllers/auth.controller.ts
// FIXED: All code paths now return values
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getCurrentUser = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const authService = __importStar(require("../services/auth.service"));
const errors_1 = require("../utils/errors");
/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const result = await authService.registerUser(req.body);
        res.status(201).json({
            message: 'Registration successful',
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
        });
    }
    catch (error) {
        const apiError = (0, errors_1.handleApiError)(error);
        res.status(apiError.statusCode).json({ error: apiError.message });
    }
};
exports.register = register;
/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const result = await authService.loginUser(req.body);
        res.json({
            message: 'Login successful',
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
        });
    }
    catch (error) {
        const apiError = (0, errors_1.handleApiError)(error);
        res.status(apiError.statusCode).json({ error: apiError.message });
    }
};
exports.login = login;
/**
 * POST /api/auth/refresh
 */
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token required' });
            return;
        }
        const tokens = await authService.refreshAccessToken(refreshToken);
        res.json({
            message: 'Token refreshed',
            accessToken: tokens.accessToken,
        });
    }
    catch (error) {
        const apiError = (0, errors_1.handleApiError)(error);
        res.status(apiError.statusCode).json({ error: apiError.message });
    }
};
exports.refresh = refresh;
/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token required' });
            return;
        }
        await authService.logoutUser(refreshToken);
        res.json({ message: 'Logout successful' });
    }
    catch (error) {
        const apiError = (0, errors_1.handleApiError)(error);
        res.status(apiError.statusCode).json({ error: apiError.message });
    }
};
exports.logout = logout;
/**
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const user = await authService.getCurrentUserProfile(req.user.id);
        res.json({ user });
    }
    catch (error) {
        const apiError = (0, errors_1.handleApiError)(error);
        res.status(apiError.statusCode).json({ error: apiError.message });
    }
};
exports.getCurrentUser = getCurrentUser;
/**
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const user = await authService.updateUserProfile(req.user.id, req.body);
        res.json({
            message: 'Profile updated',
            user,
        });
    }
    catch (error) {
        const apiError = (0, errors_1.handleApiError)(error);
        res.status(apiError.statusCode).json({ error: apiError.message });
    }
};
exports.updateProfile = updateProfile;
