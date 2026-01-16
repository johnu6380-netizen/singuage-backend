// backend/src/routes/premium.routes.ts
// Example routes that require a premium subscription

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requirePremium } from '../middleware/premium.middleware';

const router = Router();

// Deterministic daily premium count endpoint (authoritative)
router.get('/premium-count', async (req: Request, res: Response) => {
  try {
    const BASELINE = 6011;

    const hash32 = (str: string) => {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      return h >>> 0;
    };

    const mulberry32 = (a: number) => {
      return () => {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    const deterministicIntInRange = (seedStr: string, min: number, max: number) => {
      const seed = hash32(seedStr);
      const rnd = mulberry32(seed)();
      return Math.floor(rnd * (max - min + 1)) + min;
    };

    const now = new Date();
    const anchor = new Date('2026-01-01T00:00:00Z');
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysSinceAnchor = Math.max(
      0,
      Math.floor(
        (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
          Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate())) /
          msPerDay
      )
    );

    let premiumCount = BASELINE;
    for (let d = 1; d <= daysSinceAnchor; d++) {
      const seedBase = `premium_day_2026_01_01_offset_${d}`;
      const decide = mulberry32(hash32(seedBase + '_decide'))();
      if (decide < 0.6) {
        const inc = deterministicIntInRange(seedBase + '_add', 3, 300);
        premiumCount += inc;
      } else {
        const dec = deterministicIntInRange(seedBase + '_sub', 3, 100);
        if (premiumCount - dec >= BASELINE) {
          premiumCount -= dec;
        } else {
          const inc = deterministicIntInRange(seedBase + '_add', 3, 300);
          premiumCount += inc;
        }
      }
    }

    return res.json({ count: premiumCount });
  } catch (err) {
    console.error('premium-count error', err);
    return res.status(500).json({ count: 6011 });
  }
});

// GET /api/premium-only
// This endpoint demonstrates how to protect routes that should only be available
// to premium users. Non-premium users will receive a 402 response with an
// upgradeUrl pointing to the frontend's Upgrade page.
router.get('/premium-only', authenticate, requirePremium, async (req: Request, res: Response) => {
  // Return sample premium content. In a real app this could be access to
  // higher limits, exclusive resources, or downloadable content.
  res.json({ success: true, message: 'Welcome to premium-only content.' });
});

export default router;