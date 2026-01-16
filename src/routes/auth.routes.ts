// backend/src/routes/auth.routes.ts
// Authentication routes

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { forgotPasswordRateLimiter, resetPasswordRateLimiter } from '../middleware/rateLimiter';
import { csrfProtection } from '../middleware/csrf.middleware';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', forgotPasswordRateLimiter, authController.forgotPassword);
// Protect reset endpoint with CSRF middleware and rate limiter; SPA should fetch /api/csrf-token first
router.post('/reset-password', resetPasswordRateLimiter, csrfProtection, authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, authController.updateProfile);
router.delete('/delete', authenticate, authController.deleteAccount);

export default router;