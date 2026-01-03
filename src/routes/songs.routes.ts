// backend/src/routes/songs.routes.ts
// UPDATED: Added batch re-detection endpoint

import { Router } from 'express';
import * as songsController from '../controllers/songs.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Create a song (user adds to their library) - protected
router.post('/', authenticate, songsController.createSong);

// Get current user's saved songs - protected
router.get('/', authenticate, songsController.getUserSongs);

// NEW: Batch re-detect languages for all user songs
router.post('/redetect-languages', authenticate, songsController.redetectLanguages);

// Get song by YouTube video id (public)
router.get('/video/:videoId', songsController.getSongByVideoId);

// Delete a user's song
router.delete('/:id', authenticate, songsController.deleteSong);

// Update a user's song (protected)
router.put('/:id', authenticate, songsController.updateSong);

export default router;
