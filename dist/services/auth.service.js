"use strict";
// backend/src/services/auth.service.ts
// FULLY FIXED: All type errors resolved + Missing functions added
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = exports.getCurrentUserProfile = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.registerUser = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
/**
 * Register a new user
 */
const registerUser = async (data) => {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new errors_1.ValidationError('Email already registered');
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                displayName: data.displayName,
                nativeLanguage: data.nativeLanguage || 'en',
                isAdult: data.isAdult !== undefined ? data.isAdult : true,
                totalXp: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastPracticeDate: null,
                targetLanguages: (data.targetLanguages || []).map(lang => ({
                    code: typeof lang === 'string' ? lang : lang,
                    level: 'beginner',
                    addedAt: new Date().toISOString(),
                })),
            },
        });
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName || '',
                nativeLanguage: user.nativeLanguage,
                targetLanguages: user.targetLanguages,
                preferredArtists: user.preferredArtists,
                totalXp: user.totalXp || 0,
                currentStreak: user.currentStreak || 0,
                isAdult: user.isAdult,
                createdAt: user.createdAt.toISOString(),
            },
        };
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError)
            throw error;
        console.error('Registration error:', error);
        throw new Error('Registration failed');
    }
};
exports.registerUser = registerUser;
/**
 * Login user
 */
const loginUser = async (data) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw new errors_1.AuthenticationError('Invalid credentials');
        }
        const isValid = await bcrypt_1.default.compare(data.password, user.password);
        if (!isValid) {
            throw new errors_1.AuthenticationError('Invalid credentials');
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName || '',
                nativeLanguage: user.nativeLanguage,
                targetLanguages: user.targetLanguages,
                preferredArtists: user.preferredArtists,
                totalXp: user.totalXp || 0,
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                lastPracticeDate: user.lastPracticeDate ? user.lastPracticeDate.toISOString() : null,
                isAdult: user.isAdult,
                createdAt: user.createdAt.toISOString(),
            },
        };
    }
    catch (error) {
        if (error instanceof errors_1.AuthenticationError)
            throw error;
        console.error('Login error:', error);
        throw new Error('Login failed');
    }
};
exports.loginUser = loginUser;
/**
 * Refresh access token
 * ADDED: Missing function
 */
const refreshAccessToken = async (refreshToken) => {
    try {
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
        // Check if refresh token exists in database and is not expired
        const storedToken = await prisma.refreshToken.findFirst({
            where: {
                token: refreshToken,
                userId: decoded.userId,
                expiresAt: {
                    gte: new Date(),
                },
            },
        });
        if (!storedToken) {
            throw new errors_1.AuthenticationError('Invalid or expired refresh token');
        }
        // Generate new access token
        const accessToken = jsonwebtoken_1.default.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '15m' });
        return {
            accessToken,
        };
    }
    catch (error) {
        if (error instanceof errors_1.AuthenticationError)
            throw error;
        console.error('Token refresh error:', error);
        throw new errors_1.AuthenticationError('Failed to refresh token');
    }
};
exports.refreshAccessToken = refreshAccessToken;
/**
 * Logout user (invalidate refresh token)
 * ADDED: Missing function
 */
const logoutUser = async (refreshToken) => {
    try {
        // Delete refresh token from database
        await prisma.refreshToken.deleteMany({
            where: {
                token: refreshToken,
            },
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        // Don't throw error - logout should always succeed
    }
};
exports.logoutUser = logoutUser;
/**
 * Get current user profile
 */
const getCurrentUserProfile = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.AuthenticationError('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName || '',
            nativeLanguage: user.nativeLanguage,
            targetLanguages: user.targetLanguages,
            preferredArtists: user.preferredArtists,
            totalXp: user.totalXp || 0,
            currentStreak: user.currentStreak || 0,
            longestStreak: user.longestStreak || 0,
            lastPracticeDate: user.lastPracticeDate ? user.lastPracticeDate.toISOString() : null,
            isAdult: user.isAdult,
            createdAt: user.createdAt.toISOString(),
        };
    }
    catch (error) {
        console.error('Get profile error:', error);
        throw new Error('Failed to get profile');
    }
};
exports.getCurrentUserProfile = getCurrentUserProfile;
/**
 * Update user profile
 */
const updateUserProfile = async (userId, updates) => {
    try {
        const updateData = {};
        if (updates.displayName !== undefined)
            updateData.displayName = updates.displayName;
        if (updates.targetLanguages !== undefined)
            updateData.targetLanguages = updates.targetLanguages;
        if (updates.totalXp !== undefined)
            updateData.totalXp = updates.totalXp;
        if (updates.currentStreak !== undefined)
            updateData.currentStreak = updates.currentStreak;
        if (updates.longestStreak !== undefined)
            updateData.longestStreak = updates.longestStreak;
        if (updates.preferredArtists !== undefined)
            updateData.preferredArtists = updates.preferredArtists;
        if (updates.lastPracticeDate !== undefined) {
            updateData.lastPracticeDate = updates.lastPracticeDate ? new Date(updates.lastPracticeDate) : null;
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName || '',
            nativeLanguage: user.nativeLanguage,
            targetLanguages: user.targetLanguages,
            preferredArtists: user.preferredArtists,
            totalXp: user.totalXp || 0,
            currentStreak: user.currentStreak || 0,
            longestStreak: user.longestStreak || 0,
            lastPracticeDate: user.lastPracticeDate ? user.lastPracticeDate.toISOString() : null,
            isAdult: user.isAdult,
            createdAt: user.createdAt.toISOString(),
        };
    }
    catch (error) {
        console.error('Update profile error:', error);
        throw new Error('Failed to update profile');
    }
};
exports.updateUserProfile = updateUserProfile;
