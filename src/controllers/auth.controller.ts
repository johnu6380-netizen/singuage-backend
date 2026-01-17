// backend/src/controllers/auth.controller.ts
// FIXED: All code paths now return values

import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { handleApiError } from '../utils/errors';
import { sendPasswordResetEmail } from '../utils/email';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// NEW: cookie configuration for refresh tokens
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'none' as const, // required for cross-site cookies
  secure: process.env.NODE_ENV === 'production', // true in prod (HTTPS)
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.registerUser(req.body);

    // Set refresh token as a secure, cross-site cookie
    if (result.refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);
    }

    // Return access token and user info (do NOT expose refresh token to JS)
    res.status(201).json({
      message: 'Registration successful',
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.loginUser(req.body);

    // Set refresh token as a secure, cross-site cookie
    if (result.refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);
    }

    // Return access token and user info
    res.json({
      message: 'Login successful',
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    // Accept refresh token from cookie OR body for compatibility
    const refreshToken = (req.cookies && req.cookies[REFRESH_COOKIE_NAME]) || req.body?.refreshToken;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const tokens = await authService.refreshAccessToken(refreshToken);

    res.json({
      message: 'Token refreshed',
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Prefer cookie, fallback to body
    const refreshToken = (req.cookies && req.cookies[REFRESH_COOKIE_NAME]) || req.body?.refreshToken;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    await authService.logoutUser(refreshToken);

    // Clear cookie on logout
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await authService.getCurrentUserProfile(req.user.id);

    res.json({ user });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * PUT /api/auth/profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * DELETE /api/auth/delete
 */
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await authService.deleteUserAccount(req.user.id);

    res.json({ message: 'Account deleted' });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * POST /api/auth/forgot-password
 * Accepts { email }
 * Always returns a generic success message to avoid user enumeration.
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      // Still return generic message
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      return;
    }

    const result = await authService.createPasswordReset(email);

    // If a token was returned, send email. Otherwise, remain silent.
    if (result && (result as any).token) {
      const { token } = result as any;
      // Build a reset link that contains only the token parameter.
      // Ensure the link uses https and the FRONTEND_URL origin.
      let frontend = process.env.FRONTEND_URL || FRONTEND_URL;
      try {
        const url = new URL(frontend);
        url.protocol = 'https:';
        frontend = url.origin;
      } catch (e) {
        // If FRONTEND_URL is not a full URL, fallback to FRONTEND_URL as provided
        frontend = FRONTEND_URL;
      }

      const resetLink = `${frontend.replace(/\/+$/,'')}/reset-password?token=${encodeURIComponent(token)}`;
      // Send the email (will log in dev if SMTP not configured)
      await sendPasswordResetEmail(email, resetLink);
    }

    // Always return generic message
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Do not divulge internal errors to client
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  }
};

/**
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }

    // Basic server-side password validation (length only); frontend enforces stronger rules.
    if (newPassword.length < 8 || newPassword.length > 128) {
      res.status(400).json({ error: 'Password does not meet requirements' });
      return;
    }

    const result = await authService.resetUserPassword(token, newPassword);

    if (!result || !(result as any).success) {
      // Don't reveal whether token was invalid/expired – return a generic error
      res.status(400).json({ error: 'Invalid or expired token' });
      return;
    }

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};