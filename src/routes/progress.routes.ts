// backend/src/routes/progress.routes.ts
// CHECKED: All handlers have proper return types

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as progressService from '../services/progress.service';
import { handleApiError } from '../utils/errors';

const router = Router();

/**
 * POST /api/progress/session
 */
router.post('/session', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await progressService.recordSession(userId, req.body);

    res.json({
      message: 'Session recorded successfully',
      ...result,
    });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
});

/**
 * PREMIUM/FREEMIUM:
 * POST /api/progress/consume-lines
 *
 * Called when the user completes typing one (or more) lyric lines.
 * Enforces:
 * - First song added is fully free (no limit)
 * - All other songs: max 4 lines per song per server-day
 */
router.post('/consume-lines', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { songId, lines } = req.body as { songId?: string; lines?: number };

    if (!songId) {
      res.status(400).json({ error: 'songId is required' });
      return;
    }

    const linesToConsume = Number(lines ?? 1);
    if (!Number.isInteger(linesToConsume) || linesToConsume <= 0) {
      res.status(400).json({ error: 'lines must be a positive integer' });
      return;
    }

    const result = await progressService.consumeSongLines(userId, songId, linesToConsume);

    if (!result.allowed) {
      // 402 Payment Required is semantically appropriate for "upgrade to premium"
      res.status(402).json({
        error: 'Daily free limit reached for this song. Upgrade to premium to keep learning today.',
        code: 'PREMIUM_LINE_LIMIT_REACHED',
        songId,
        date: result.date, // server-day key used for reset
        limit: result.limit, // 4
        usedToday: result.usedToday,
        remainingToday: result.remainingToday,
      });
      return;
    }

    res.json({
      success: true,
      songId,
      date: result.date,
      isFirstSong: result.isFirstSong,
      limit: result.limit,
      usedToday: result.usedToday,
      remainingToday: result.remainingToday,
    });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
});

/**
 * GET /api/progress
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const progress = await progressService.getUserProgress(userId);

    res.json(progress);
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
});

/**
 * GET /api/progress/song/:songId
 */
router.get('/song/:songId', authenticate, async (req: Request<{ songId: string }>, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { songId } = req.params;

    const progress = await progressService.getSongProgress(userId, songId);

    res.json(progress);
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
});

/**
 * GET /api/progress/streak-calendar
 */
router.get('/streak-calendar', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const calendar = await progressService.getStreakCalendar(userId);

    res.json({ dates: calendar });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
});

/**
 * GET /api/progress/vocab-count
 * Returns number of vocabulary review sessions completed by the user today (server day)
 */
router.get('/vocab-count', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const count = await progressService.getTodayVocabReviewCount(userId);
    res.json({ count });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
});

/**
 * GET /api/progress/by-language
 * Returns total XP earned grouped by song language for the authenticated user
 */
router.get('/by-language', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const xpByLang = await progressService.getXpByLanguage(userId);
    res.json({ xpByLanguage: xpByLang });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
});

export default router;