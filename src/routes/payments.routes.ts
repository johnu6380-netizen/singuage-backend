// backend/src/routes/payments.routes.ts
// Routes for payment-related endpoints

import { Router } from 'express';
import { createCheckoutSession } from '../controllers/payments.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Health/debug endpoint to verify API routing and CORS from the frontend
// Use GET /api/ping to confirm the backend is reachable from the frontend during development.
router.get('/ping', (_req, res) => res.json({ ok: true, route: '/api/ping' }));

// POST /api/create-checkout-session
// Protected route: only authenticated users may create a checkout session.
// We mount this router under /api in server.ts, so the full path becomes /api/create-checkout-session
router.post('/create-checkout-session', authenticate, createCheckoutSession);

export default router;