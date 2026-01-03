// src/utils/jwt.utils.ts
// JWT token generation and verification utilities

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload, TokenPair } from '../types';
import { AuthenticationError } from '../utils/errors';

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<TokenPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'access' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'] } // cast for TS
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<TokenPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'] } // cast for TS
  );
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (userId: string, email: string): TokenPair => {
  const payload = { userId, email };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

    if (payload.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    return payload;
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;

    if (payload.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    return payload;
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};

/**
 * Get token expiry timestamp
 */
export const getTokenExpiry = (token: string): number | null => {
  const decoded = decodeToken(token) as { exp?: number } | null;
  return decoded?.exp ? decoded.exp * 1000 : null;
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return Date.now() >= expiry;
};