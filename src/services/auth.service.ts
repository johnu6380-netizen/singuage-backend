// backend/src/services/auth.service.ts
// FULLY FIXED: All type errors resolved + Missing functions added

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RegisterDTO, LoginDTO, UserProfile } from '../types';
import { ValidationError, AuthenticationError } from '../utils/errors';
import { createContextLogger } from '../utils/logger';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

const authLogger = createContextLogger('auth');

const formatDayKey = (d: Date | null | undefined) => {
  if (!d) return null;
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Register a new user
 */
export const registerUser = async (data: RegisterDTO) => {
  try {
    // Username is required
    if (!data.username || !data.username.trim()) {
      throw new ValidationError('Username is required');
    }

    // Normalize username (trim + lowercase) to enforce case-insensitive uniqueness
    const normalizedUsername = data.username.trim().toLowerCase();

    // Ensure username uniqueness (case-insensitive)
    const existingByUsername = await prisma.user.findUnique({ where: { username: normalizedUsername } as any });
    if (existingByUsername) {
      throw new ValidationError('Username already taken');
    }
    // If an email was provided, ensure it's not already registered.
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new ValidationError('Email already registered');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        // store normalized username
        username: normalizedUsername,
        // store null when no email provided
        email: data.email ?? null,
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
        username: user.username,
        displayName: user.displayName || '',
        nativeLanguage: user.nativeLanguage,
        targetLanguages: user.targetLanguages,
        preferredArtists: user.preferredArtists,
        hasPremium: user.hasPremium || false,
        totalXp: user.totalXp || 0,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        lastPracticeDate: formatDayKey(user.lastPracticeDate),
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
    const identifier = data.username.trim();

    // Try username lookup (use lowercase normalized form) first
    let user = await prisma.user.findUnique({ where: { username: identifier.toLowerCase() } as any });
    if (!user) {
      // Fallback: try email lookup
      user = await prisma.user.findUnique({ where: { email: identifier } as any });
    }

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
        username: user.username,
        displayName: user.displayName || '',
        nativeLanguage: user.nativeLanguage,
        targetLanguages: user.targetLanguages,
        preferredArtists: user.preferredArtists,
        hasPremium: user.hasPremium || false,
        totalXp: user.totalXp || 0,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        lastPracticeDate: formatDayKey(user.lastPracticeDate),
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
      username: user.username,
      displayName: user.displayName || '',
      nativeLanguage: user.nativeLanguage,
      targetLanguages: user.targetLanguages,
      preferredArtists: user.preferredArtists,
      hasPremium: user.hasPremium || false,
      totalXp: user.totalXp || 0,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastPracticeDate: formatDayKey(user.lastPracticeDate),
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
    username?: string;
    email?: string | null;
    displayName: string;
    targetLanguages: any;
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    lastPracticeDate: string;
    preferredArtists: string[];
    nativeLanguage?: string; // ADDED: allow updating native language
  }>
) => {
  try {
    const updateData: any = {};
    // Username update: validate and ensure uniqueness
    if (updates.username !== undefined) {
      const trimmed = (updates.username || '').trim();
      if (!trimmed) {
        throw new ValidationError('Username cannot be empty');
      }
      const normalized = trimmed.toLowerCase();
      const existingByUsername = await prisma.user.findUnique({ where: { username: normalized } as any });
      if (existingByUsername && existingByUsername.id !== userId) {
        throw new ValidationError('Username already taken');
      }
      updateData.username = normalized;
    }

    // Email update handling: ensure uniqueness if provided
    if (updates.email !== undefined) {
      if (updates.email) {
        const existing = await prisma.user.findUnique({ where: { email: updates.email } });
        if (existing && existing.id !== userId) {
          throw new ValidationError('Email already in use');
        }
        updateData.email = updates.email;
      } else {
        // allow clearing email by setting null
        updateData.email = null;
      }
    }

    if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
    if (updates.targetLanguages !== undefined) updateData.targetLanguages = updates.targetLanguages;
    if (updates.totalXp !== undefined) updateData.totalXp = updates.totalXp;
    if (updates.currentStreak !== undefined) updateData.currentStreak = updates.currentStreak;
    if (updates.longestStreak !== undefined) updateData.longestStreak = updates.longestStreak;
    if (updates.preferredArtists !== undefined) updateData.preferredArtists = updates.preferredArtists;

    // NEW: persist native language change when provided
    if (updates.nativeLanguage !== undefined) {
      updateData.nativeLanguage = updates.nativeLanguage;
    }

    if (updates.lastPracticeDate !== undefined) {
      updateData.lastPracticeDate = updates.lastPracticeDate ? new Date(updates.lastPracticeDate) : null;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName || '',
      nativeLanguage: user.nativeLanguage,
      targetLanguages: user.targetLanguages,
      preferredArtists: user.preferredArtists,
      hasPremium: user.hasPremium || false,
      totalXp: user.totalXp || 0,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastPracticeDate: formatDayKey(user.lastPracticeDate),
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

/**
 * Create a password reset token for a user identified by email.
 * Ensures any existing unused reset tokens for the user are marked used (so only one active token exists).
 * Returns the raw token (not stored) which should be emailed to the user.
 */
export const createPasswordReset = async (email: string) => {
   // find user by email
   const user = await prisma.user.findUnique({ where: { email } as any });
   if (!user) {
     // Do not reveal whether a user exists — return success silently to avoid user enumeration
     authLogger.info('password_reset_requested_nonexistent_email', { email });
     return { success: true };
   }

   // generate secure token
   // Create a token that embeds the userId so the reset URL only needs a single `token` parameter.
   // Token format: <userId>.<hexRandom>
   const randomHex = crypto.randomBytes(32).toString('hex');
   const token = `${user.id}.${randomHex}`;
   // Store hash of the random part only
   const tokenHash = await bcrypt.hash(randomHex, 10);
   const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

   // In a transaction: mark existing unused resets as used, then create new reset record
   await prisma.$transaction([
     prisma.passwordReset.updateMany({
       where: { userId: user.id, used: false },
       data: { used: true },
     }),
     prisma.passwordReset.create({
       data: {
         userId: user.id,
         tokenHash,
         expiresAt,
       },
     }),
   ]);

  authLogger.info('password_reset_requested', { userId: user.id, email: user.email, expiresAt: expiresAt.toISOString() });
   // Return token so caller can email it. Caller should send this token to user's email in a link.
   return { success: true, token };
 };

/**
 * Verify a provided reset token for a given user and mark it as used.
 * Returns true if token is valid and consumed, false otherwise.
 */
 export const verifyAndConsumeResetToken = async (token: string) => {
   // Expect token format: <userId>.<hexRandom>
   const parts = (token || '').split('.');
   if (parts.length < 2) return false;
   const userId = parts[0];
   const raw = parts.slice(1).join('.');

   // Find the most recent unused, unexpired reset for this user
   const reset = await prisma.passwordReset.findFirst({
     where: {
       userId,
       used: false,
       expiresAt: { gte: new Date() },
     },
     orderBy: { createdAt: 'desc' },
   });

   if (!reset) return false;

   const match = await bcrypt.compare(raw, reset.tokenHash);
   if (!match) {
     authLogger.warn('password_reset_token_mismatch', { userId, tokenId: reset.id });
     return false;
   }

   // mark as used
   await prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } });
   authLogger.info('password_reset_token_consumed', { userId, tokenId: reset.id });
   return { success: true, userId };
 };

/**
 * Reset a user's password using a reset token and a new password.
 * If token is valid this will update the user's password (bcrypt-hashed)
 * and invalidate any existing refresh tokens for that user.
 */
 export const resetUserPassword = async (token: string, newPassword: string) => {
   const verification = await verifyAndConsumeResetToken(token);
   if (!verification || !(verification as any).userId) {
     authLogger.warn('password_reset_failed_verification', { token });
     return { success: false };
   }

   const userId = (verification as any).userId;

   // Hash the new password and update user
   const hashed = await bcrypt.hash(newPassword, 10);
   await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

   // Invalidate refresh tokens for this user (force re-login)
   await prisma.refreshToken.deleteMany({ where: { userId } });

   authLogger.info('password_reset_completed', { userId });

   return { success: true, userId };
 };
