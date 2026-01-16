// backend/src/middleware/premium.middleware.ts
// Middleware to require a premium subscription for protected routes

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

// FRONTEND_URL is used in the response to give clients a friendly upgrade link.
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * requirePremium
 * - Ensures the request is authenticated (req.user must be present).
 * - Fetches the user's subscription flag from the database and denies access if hasPremium !== true.
 *
 * Why this must be a server-side check:
 * - Frontend-only checks (JS/CSS/UI) can be bypassed by an attacker. The backend is the
 *   final authority for access control and must enforce subscription state before returning
 *   protected data or performing premium actions.
 *
 * Why we read from the database here:
 * - The backend holds the authoritative subscription state (kept in sync via Stripe webhooks).
 * - Checking the DB ensures we don't rely on stale or tampered client-provided values.
 */
export const requirePremium = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Ensure authentication first
    const userId = req.user?.id;
    if (!userId) {
      // Authentication middleware should normally handle this, but we guard defensively.
      throw new AuthenticationError('Authentication required');
    }

    // Look up the user's premium status in the database. This is the source of truth.
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { hasPremium: true } });

    if (!user) {
      throw new AuthorizationError('User not found');
    }

    if (!user.hasPremium) {
      // Return 402 Payment Required with a clear message and an upgrade URL.
      // Clients can use the upgradeUrl to redirect the user to purchase premium.
      return res.status(402).json({
        error: 'Premium subscription required',
        code: 'PREMIUM_REQUIRED',
        upgradeUrl: `${FRONTEND_URL}/upgrade`,
      });
    }

    // User has premium access — continue to the protected handler.
    return next();
  } catch (err) {
    // Let centralized error handling middleware handle AppError instances; convert others to 500.
    return next(err);
  }
};
