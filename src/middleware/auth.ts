// src/middleware/auth.ts
// Authentication middleware to protect routes

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AuthenticationError } from '../utils/errors';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.utils';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Middleware to authenticate requests using JWT
 * Verifies access token and attaches user info to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    req.user = {
      id: user.id,
      email: user.email ?? undefined,
    };

    next();
  } catch (error: any) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: {
          code: error.name,
          message: error.message,
        },
      });
      return;
    }

    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
      },
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email ?? undefined,
      };
    }

    next();
  } catch (_error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Middleware to check if user owns a resource
 */
export const checkResourceOwnership = (
  paramName: string,
  resourceType: 'song' | 'session'
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const rawParam = req.params[paramName];
      const resourceId = Array.isArray(rawParam) ? rawParam[0] : rawParam;

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
          resource = await prisma.song.findUnique({
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
          resource = await prisma.learningSession.findUnique({
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
    } catch (error) {
      logger.error('Resource ownership check error:', error);
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