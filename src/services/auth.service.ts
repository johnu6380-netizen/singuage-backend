// backend/src/services/auth.service.ts
// FULLY FIXED: All type errors resolved + Missing functions added

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RegisterDTO, LoginDTO, UserProfile } from '../types';
import { ValidationError, AuthenticationError } from '../utils/errors';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

/**
 * Register a new user
 */
export const registerUser = async (data: RegisterDTO) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

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

    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

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
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    console.error('Registration error:', error);
    throw new Error('Registration failed');
  }
};

/**
 * Login user
 */
export const loginUser = async (data: LoginDTO) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

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
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    console.error('Login error:', error);
    throw new Error('Login failed');
  }
};

/**
 * Refresh access token
 * ADDED: Missing function
 */
export const refreshAccessToken = async (refreshToken: string) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

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
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Generate new access token
    const accessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '15m' });

    return {
      accessToken,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    console.error('Token refresh error:', error);
    throw new AuthenticationError('Failed to refresh token');
  }
};

/**
 * Logout user (invalidate refresh token)
 * ADDED: Missing function
 */
export const logoutUser = async (refreshToken: string) => {
  try {
    // Delete refresh token from database
    await prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Don't throw error - logout should always succeed
  }
};

/**
 * Get current user profile
 */
export const getCurrentUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
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
  } catch (error) {
    console.error('Get profile error:', error);
    throw new Error('Failed to get profile');
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<{
    displayName: string;
    targetLanguages: any;
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    lastPracticeDate: string;
    preferredArtists: string[];
  }>
) => {
  try {
    const updateData: any = {};
    
    if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
    if (updates.targetLanguages !== undefined) updateData.targetLanguages = updates.targetLanguages;
    if (updates.totalXp !== undefined) updateData.totalXp = updates.totalXp;
    if (updates.currentStreak !== undefined) updateData.currentStreak = updates.currentStreak;
    if (updates.longestStreak !== undefined) updateData.longestStreak = updates.longestStreak;
    if (updates.preferredArtists !== undefined) updateData.preferredArtists = updates.preferredArtists;
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
  } catch (error) {
    console.error('Update profile error:', error);
    throw new Error('Failed to update profile');
  }
};

/**
 * Delete user account and related data
 */
export const deleteUserAccount = async (userId: string) => {
  try {
    // Remove any refresh tokens first (not strictly necessary due to cascade, but explicit)
    await prisma.refreshToken.deleteMany({ where: { userId } });

    // Delete user (cascade will remove related sessions, songs, vocabulary, etc.)
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    console.error('Delete user error:', error);
    throw new Error('Failed to delete user');
  }
};