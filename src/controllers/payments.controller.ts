// backend/src/controllers/payments.controller.ts
// Controller to create Stripe Checkout sessions

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../utils/logger';

// Initialize Stripe with the secret key from environment variables.
// This must only run on the backend — the secret key must never be exposed to the client.
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  // Fail fast in development / startup if Stripe secret is missing.
  throw new Error('STRIPE_SECRET_KEY is not configured in the environment');
}

const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' as any });

// Price ID for the subscription. Use the live Price ID provided for production.
// If you need to override in different environments, consider moving this to env vars later.
const PRICE_ID = 'prod_Tn79v0ZFVI5CxY';

/*
  Payment flow (high-level):
  1) Frontend: user clicks "Continue to Payment" → calls backend POST /api/create-checkout-session
  2) Backend: createCheckoutSession uses STRIPE_SECRET_KEY to create a Stripe Checkout Session (server-side)
     and returns a session URL to the frontend.
     (Secrets remain on the server and are never exposed to the browser.)
  3) Frontend: redirects the user to Stripe Checkout (Stripe-hosted page).
  4) Stripe: processes payment and redirects the user to success/cancel URLs.
  5) Stripe: emits webhook events (e.g. checkout.session.completed, customer.subscription.deleted).
  6) Backend webhook endpoint verifies signatures with STRIPE_WEBHOOK_SECRET and updates the DB (Prisma).
  7) Backend enforces access control (hasPremium) for premium routes; frontend reads state via authenticated APIs.
*/

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    // Authentication middleware should have attached the user id to req.user
    const userId = req.user?.id;
    if (!userId) {
      // This endpoint requires a logged-in user to associate the subscription
      throw new AuthenticationError('Authentication required');
    }

    // Domain/redirects - use FRONTEND_URL for production-safety
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Resolve PRICE_ID: if a product id (prod_...) was provided, try to find an active price for it.
    let priceToUse = PRICE_ID;
    try {
      if (PRICE_ID.startsWith('prod_')) {
        logger.info('Configured Stripe identifier looks like a product id; resolving an active price for the product', { product: PRICE_ID });
        const prices = await stripe.prices.list({ product: PRICE_ID, active: true, limit: 1 });
        if (!prices || prices.data.length === 0) {
          logger.error('No active Stripe prices found for product', { product: PRICE_ID });
          return res.status(500).json({ error: 'Payment configuration error: no active price found for configured product' });
        }
        priceToUse = prices.data[0].id;
        logger.info('Resolved product to price id', { product: PRICE_ID, price: priceToUse });
      }
    } catch (resolveErr: any) {
      logger.error('Failed to resolve product to a price', { error: { message: resolveErr?.message, name: resolveErr?.name } });
      return res.status(500).json({ error: 'Failed to resolve Stripe price for checkout' });
    }

    // Create a Stripe Checkout session for a subscription.
    // Note: We set metadata/client_reference_id to link the session to our internal user id.
    // The session will handle customer creation if one doesn't exist.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceToUse,
          quantity: 1,
        },
      ],
      // Attach internal user id so we can reconcile the webhook events with our users.
      metadata: { userId },
      client_reference_id: userId,
      // You can optionally pass a `customer` here if you have one saved for the user
      // (stripeCustomerId). We avoid doing that here for simplicity.

      // Redirect after successful or canceled checkout.
      // Use explicit success and cancel pages so the frontend can show friendly messaging.
      // Do NOT update subscription state on these pages — the webhook is the source of truth.
      success_url: `${frontendUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/upgrade/cancel`,
    });

    // Return the Stripe-hosted session URL to the frontend so it can redirect the browser.
    return res.json({ url: session.url });
  } catch (err: any) {
    // Log error without leaking sensitive request or secret details.
    logger.error('Failed to create checkout session', { error: { message: err?.message, name: err?.name } });
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
};