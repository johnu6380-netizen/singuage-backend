"use strict";
// backend/src/services/auth.service.ts
// FULLY FIXED: All type errors resolved
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.refreshAccessToken = exports.updateUserProfile = exports.getCurrentUserProfile = exports.loginUser = exports.registerUser = void 0;
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
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new errors_1.ValidationError('Email already registered');
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
        // Create user with all fields including isAdult
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                displayName: data.displayName,
                nativeLanguage: data.nativeLanguage || 'en',
                isAdult: data.isAdult !== undefined ? data.isAdult : true,
                // Initialize XP and streak
                totalXp: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastPracticeDate: null,
                // Target languages as JSON
                targetLanguages: (data.targetLanguages || []).map(lang => ({
                    code: typeof lang === 'string' ? lang : lang,
                    level: 'beginner',
                    addedAt: new Date().toISOString(),
                })),
            },
        });
        // Generate tokens
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Store refresh token
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
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw new errors_1.AuthenticationError('Invalid credentials');
        }
        // Verify password
        const isValid = await bcrypt_1.default.compare(data.password, user.password);
        if (!isValid) {
            throw new errors_1.AuthenticationError('Invalid credentials');
        }
        // Generate tokens
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Store refresh token
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
/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
    try {
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
        // Check if refresh token exists and is valid
        const storedToken = await prisma.refreshToken.findFirst({
            where: {
                token: refreshToken,
                userId: decoded.userId,
                expiresAt: { gt: new Date() },
            },
        });
        if (!storedToken) {
            throw new errors_1.AuthenticationError('Invalid refresh token');
        }
        // Generate new access token
        const accessToken = jsonwebtoken_1.default.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '15m' });
        return { accessToken };
    }
    catch (error) {
        throw new errors_1.AuthenticationError('Invalid refresh token');
    }
};
exports.refreshAccessToken = refreshAccessToken;
/**
 * Logout user
 */
const logoutUser = async (refreshToken) => {
    try {
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
    catch (error) {
        console.error('Logout error:', error);
    }
};
exports.logoutUser = logoutUser;
