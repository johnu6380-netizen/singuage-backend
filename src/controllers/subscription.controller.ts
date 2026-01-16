// backend/src/controllers/subscription.controller.ts
// Controllers for subscription management (cancellation and customer portal)

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/database';
import { AuthenticationError, NotFoundError } from '../utils/errors';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) throw new Error('STRIPE_SECRET_KEY not configured');
// Cast the options to any to avoid strict literal apiVersion mismatches in installed Stripe typings
const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' } as any);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Cancel the user's subscription at period end.
 * This does NOT issue refunds and does NOT immediately remove premium access.
 * We update the Stripe subscription to cancel at the end of the current billing period.
 * The final removal of premium access is performed when Stripe emits
 * 'customer.subscription.deleted' (webhook) and our webhook handler updates the DB.
 *
 * Rationale:
 * - Standard SaaS behavior allows users to continue using paid features until the
 *   end of the billing period they already paid for. This avoids surprising users
 *   and is fair accounting for prepaid time.
 * - We rely on webhooks as the source of truth for subscription lifecycle events.
 */
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AuthenticationError('Authentication required');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const subscriptionId = user.stripeSubscriptionId;
    const customerId = user.stripeCustomerId;

    if (!subscriptionId || !customerId) {
      return res.status(400).json({ error: 'No active subscription found for user' });
    }

    // Update the Stripe subscription to cancel at period end. This preserves access
    // until the subscription expiration and does not issue refunds.
    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Optionally update any local metadata if needed — but do NOT set hasPremium=false here.
    // The webhook (customer.subscription.deleted) will be the authority to remove premium access
    // once the subscription is actually ended by Stripe.

    // Cast updated to any when returning fields that TypeScript's Stripe typings may not expose
    const u: any = updated as any;
    return res.json({
      success: true,
      message: 'Subscription scheduled to cancel at period end',
      subscription: {
        id: u.id,
        cancel_at_period_end: u.cancel_at_period_end,
        current_period_end: u.current_period_end,
      },
    });
  } catch (err: any) {
    console.error('Failed to cancel subscription:', err);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

/**
 * Create a Stripe Customer Portal session so the user can manage their billing directly in Stripe.
 * The portal provides an interface for the user to cancel, update payment methods, and more.
 * We provide a return_url so Stripe can redirect the user back to the app after they finish.
 */
export const createBillingPortalSession = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AuthenticationError('Authentication required');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const customerId = user.stripeCustomerId;
    if (!customerId) return res.status(400).json({ error: 'No Stripe customer found for user' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${FRONTEND_URL}/account`,
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error('Failed to create billing portal session:', err);
    return res.status(500).json({ error: 'Failed to create billing portal session' });
  }
};