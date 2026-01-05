// backend/src/routes/achievements.routes.ts
// Achievements routes

import { Router } from 'express';
import * as achievementsController from '../controllers/achievements.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.get('/', authenticate, achievementsController.getUserAchievements);

export default router;
