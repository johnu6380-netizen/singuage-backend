// backend/src/controllers/achievements.controller.ts
// Achievements controller

import { Request, Response } from 'express';
import * as achievementsService from '../services/achievements.service';
import { handleApiError } from '../utils/errors';

/**
 * GET /api/achievements
 */
export const getUserAchievements = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const achievements = await achievementsService.getUserAchievements(req.user.id);

    res.json({ achievements });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};
