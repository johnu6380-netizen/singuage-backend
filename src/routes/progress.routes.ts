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
router.get('/song/:songId', authenticate, async (req: Request, res: Response): Promise<void> => {
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

export default router;
