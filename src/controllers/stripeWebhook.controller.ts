// backend/src/controllers/stripeWebhook.controller.ts
// Stripe webhook handler - must run on the backend only

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Load webhook secret from environment. This must be kept private on the backend.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not configured in the environment');
}

// Initialize a lightweight Stripe client for event types (no secret operations here).
// We still use the secret key for some lookups if needed; ensure STRIPE_SECRET_KEY is set.
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  throw new Error('STRIPE_SECRET_KEY is not configured in the environment');
}

const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' as any });

// Explaination:
// Webhooks are the source of truth for payment state because Stripe is the ultimate
// authority for payment events (payment succeed, subscription created, canceled, etc.).
// We must verify the webhook signature using STRIPE_WEBHOOK_SECRET before trusting
// any payload. Failing to verify the signature can allow attackers to spoof events
// and cause unauthorized changes to user subscription state.

export const stripeWebhookHandler = async (req: Request, res: Response): Promise<Response> => {
  // The express.raw middleware must be used for this route so req.body is the raw
  // request body (Buffer). Stripe requires the raw body to verify the signature.
  const sig = (req.headers['stripe-signature'] as string) || '';
  const rawBody = req.body as Buffer;

  if (!sig) {
    logger.warn('Stripe webhook received without stripe-signature header');
    return res.status(400).send('Missing stripe-signature header');
  }

  let event: Stripe.Event;

  try {
    // Verify signature and construct the event
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    logger.error('⚠️  Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // A Checkout Session was completed. Use metadata to link session to user.
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = (session.customer as string) || null;
        const subscriptionId = (session.subscription as string) || null;

        if (!userId) {
          logger.warn('checkout.session.completed without metadata.userId; skipping');
          break;
        }

        // Update the user record: mark premium, save customer and subscription ids.
        await prisma.user.update({
          where: { id: userId },
          data: {
            hasPremium: true,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          },
        });

        logger.info(`User ${userId} marked as premium (checkout.session.completed)`);
        break;
      }

      case 'customer.subscription.deleted': {
        // A subscription was deleted or canceled. Find user by subscription id.
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Find the user who has this subscription id
        const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscriptionId } });
        if (!user) {
          logger.warn(`No user found for subscription id ${subscriptionId}`);
          break;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { hasPremium: false },
        });

        logger.info(`User ${user.id} marked as not premium (subscription deleted)`);
        break;
      }

      default: {
        // Other events can be handled here if needed.
        logger.info(`Unhandled Stripe event type: ${event.type}`);
      }
    }

    // Return a 2xx response to acknowledge receipt of the event
    return res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error('Error handling Stripe webhook event:', err);
    // Return a non-2xx code so Stripe will retry the event
    return res.status(500).json({ error: 'Webhook handler error' });
  }
};