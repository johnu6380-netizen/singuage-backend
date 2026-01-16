// backend/src/routes/subscription.routes.ts
// Routes for subscription management (cancel, billing portal)

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { cancelSubscription, createBillingPortalSession } from '../controllers/subscription.controller';

const router = Router();

// POST /api/subscription/cancel - cancel at period end
router.post('/subscription/cancel', authenticate, cancelSubscription);

// POST /api/subscription/portal - create billing portal session
router.post('/subscription/portal', authenticate, createBillingPortalSession);

export default router;
