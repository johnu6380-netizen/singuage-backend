// backend/src/routes/songs.routes.ts
// UPDATED: Added batch re-detect endpoint

import { Router, Request, Response } from 'express';
import { createSong, getUserSongs, redetectLanguages, getSongByVideoId, getSongById, deleteSong, updateSong } from '../controllers/songs.controller';
import { authenticate } from '../middleware/auth.middleware';
import * as songService from '../services/song.service';

const router = Router();

// Create a song (user adds to their library) - protected
router.post('/', authenticate, createSong);

// Get current user's saved songs - protected
router.get('/', authenticate, getUserSongs);

// NEW: Batch re-detect languages for all user songs
router.post('/redetect-languages', authenticate, redetectLanguages);

// Get song by YouTube video id (public) - keep this BEFORE '/:id' to avoid conflicts
router.get('/video/:videoId', getSongByVideoId);

// NEW: Get the authenticated user's song by video id (protected)
// Implemented inline to avoid controller export mismatch issues.
router.get('/video/:videoId/me', authenticate, async (req: Request<{ videoId: string }>, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { videoId } = req.params;
    const song = await songService.getUserSongByVideoId(userId, videoId);
    res.json({ song: song || null });
  } catch (error) {
    const err = (error as any)?.message || 'Failed to fetch song';
    res.status(500).json({ error: err });
  }
});

// NEW: Get a user's song by id - protected
router.get('/:id', authenticate, getSongById);

// Delete a user's song
router.delete('/:id', authenticate, deleteSong);

// Update a user's song (protected)
router.put('/:id', authenticate, updateSong);

export default router;